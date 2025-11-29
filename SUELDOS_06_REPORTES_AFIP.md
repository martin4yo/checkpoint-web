# MÓDULO DE SUELDOS - REPORTES Y CUMPLIMIENTO AFIP

## Descripción
Este documento describe los formatos y procesos de generación de reportes requeridos por AFIP y otros organismos, incluyendo Libro de Sueldos Digital, F.931, Simplificación Registral y archivos bancarios.

---

## 1. Reportes Requeridos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REPORTES DEL SISTEMA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  OBLIGATORIOS AFIP              INTERNOS                BANCARIOS
  ──────────────────             ────────                ─────────
  • Libro Sueldos Digital        • Recibos PDF           • Archivo TXT
  • F.931 (DDJJ)                 • Listados              • Formato bancos
  • Simplif. Registral           • Resúmenes             • Transferencias
  • Certificación Serv.          • Auditoría

  EMPLEADOS                      CONTABLES               SINDICALES
  ─────────                      ─────────               ──────────
  • Recibo digital               • Asientos              • Aportes
  • Certificados                 • Provisiones           • Padrones
  • F.649 (Ganancias)            • Mayor                 • Retenciones
```

---

## 2. Recibo de Sueldo (Art. 140 LCT)

### 2.1 Requisitos Legales

```typescript
interface ReciboSueldo {
  // Datos del Empleador
  empleador: {
    razonSocial: string;
    cuit: string;
    domicilioLegal: string;
    actividadPrincipal: string;
    cctAplicable: string;
  };

  // Datos del Empleado
  empleado: {
    nombreCompleto: string;
    cuil: string;
    fechaIngreso: Date;
    categoria: string;
    tareaDesempeñada: string;
    lugarTrabajo: string;
  };

  // Período
  periodo: {
    mes: number;
    año: number;
    fechaPago: Date;
  };

  // Conceptos
  haberes: ConceptoRecibo[];      // Remunerativos
  noRemunerativos: ConceptoRecibo[];
  descuentos: ConceptoRecibo[];

  // Totales
  totales: {
    totalRemunerativo: number;
    totalNoRemunerativo: number;
    totalBruto: number;
    totalDescuentos: number;
    netoAPagar: number;
  };

  // Bancarización
  formaPago: 'TRANSFERENCIA' | 'EFECTIVO';
  banco?: string;
  cbu?: string;

  // Firma
  lugarEmision: string;
  fechaEmision: Date;
}

interface ConceptoRecibo {
  codigo: string;
  descripcion: string;
  cantidad?: number;       // Horas, días, etc.
  unidad?: string;         // "HS", "DIAS", "%"
  base?: number;           // Base de cálculo
  monto: number;
}
```

### 2.2 Generación de PDF

```typescript
// Usando @react-pdf/renderer o similar

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const ReciboSueldoPDF = ({ recibo }: { recibo: ReciboSueldo }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado - Datos Empleador */}
      <View style={styles.header}>
        <Text style={styles.empresa}>{recibo.empleador.razonSocial}</Text>
        <Text>CUIT: {recibo.empleador.cuit}</Text>
        <Text>{recibo.empleador.domicilioLegal}</Text>
      </View>

      {/* Datos del Empleado */}
      <View style={styles.empleado}>
        <Text>Empleado: {recibo.empleado.nombreCompleto}</Text>
        <Text>CUIL: {recibo.empleado.cuil}</Text>
        <Text>Categoría: {recibo.empleado.categoria}</Text>
        <Text>Ingreso: {format(recibo.empleado.fechaIngreso, 'dd/MM/yyyy')}</Text>
      </View>

      {/* Período */}
      <View style={styles.periodo}>
        <Text>Período: {recibo.periodo.mes}/{recibo.periodo.año}</Text>
        <Text>Fecha Pago: {format(recibo.periodo.fechaPago, 'dd/MM/yyyy')}</Text>
      </View>

      {/* Tabla de Haberes */}
      <View style={styles.tabla}>
        <View style={styles.tablaHeader}>
          <Text style={styles.colCodigo}>Código</Text>
          <Text style={styles.colDesc}>Descripción</Text>
          <Text style={styles.colCant}>Cant.</Text>
          <Text style={styles.colMonto}>Monto</Text>
        </View>

        {/* Haberes Remunerativos */}
        <Text style={styles.seccion}>HABERES REMUNERATIVOS</Text>
        {recibo.haberes.map((h, i) => (
          <View key={i} style={styles.fila}>
            <Text style={styles.colCodigo}>{h.codigo}</Text>
            <Text style={styles.colDesc}>{h.descripcion}</Text>
            <Text style={styles.colCant}>{h.cantidad || ''}</Text>
            <Text style={styles.colMonto}>{formatMoney(h.monto)}</Text>
          </View>
        ))}

        {/* Haberes No Remunerativos */}
        <Text style={styles.seccion}>HABERES NO REMUNERATIVOS</Text>
        {recibo.noRemunerativos.map((h, i) => (
          <View key={i} style={styles.fila}>
            {/* ... */}
          </View>
        ))}

        {/* Descuentos */}
        <Text style={styles.seccion}>DESCUENTOS</Text>
        {recibo.descuentos.map((d, i) => (
          <View key={i} style={styles.fila}>
            {/* ... */}
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totales}>
        <View style={styles.filaTotal}>
          <Text>Total Remunerativo:</Text>
          <Text>{formatMoney(recibo.totales.totalRemunerativo)}</Text>
        </View>
        <View style={styles.filaTotal}>
          <Text>Total No Remunerativo:</Text>
          <Text>{formatMoney(recibo.totales.totalNoRemunerativo)}</Text>
        </View>
        <View style={styles.filaTotal}>
          <Text>Total Descuentos:</Text>
          <Text>{formatMoney(recibo.totales.totalDescuentos)}</Text>
        </View>
        <View style={[styles.filaTotal, styles.neto]}>
          <Text>NETO A PAGAR:</Text>
          <Text>{formatMoney(recibo.totales.netoAPagar)}</Text>
        </View>
      </View>

      {/* Pie */}
      <View style={styles.pie}>
        <Text>Forma de Pago: {recibo.formaPago}</Text>
        {recibo.cbu && <Text>CBU: {recibo.cbu}</Text>}
        <Text>Recibí conforme: ___________________</Text>
      </View>
    </Page>
  </Document>
);
```

---

## 3. Libro de Sueldos Digital (LSD)

### 3.1 Descripción
El Libro de Sueldos Digital es la presentación electrónica obligatoria ante AFIP de todas las liquidaciones de haberes.

### 3.2 Estructura del Archivo

```typescript
interface LibroSueldosDigital {
  // Cabecera
  cabecera: {
    cuitEmpleador: string;
    periodoLiquidacion: string;  // YYYYMM
    tipoLiquidacion: TipoLiquidacionLSD;
    cantidadEmpleados: number;
    fechaGeneracion: Date;
  };

  // Detalle por empleado
  empleados: EmpleadoLSD[];

  // Conceptos liquidados
  conceptos: ConceptoLSD[];

  // Totales
  totales: TotalesLSD;
}

enum TipoLiquidacionLSD {
  MENSUAL = '1',
  QUINCENA_1 = '2',
  QUINCENA_2 = '3',
  SAC_1 = '4',
  SAC_2 = '5',
  VACACIONES = '6',
  FINAL = '7'
}

interface EmpleadoLSD {
  cuil: string;
  apellidoNombre: string;
  fechaIngreso: string;        // YYYYMMDD
  fechaEgreso?: string;
  codigoSiniestrado: string;
  codigoCondicion: string;
  codigoActividad: string;
  codigoModalidadContratacion: string;
  codigoSituacionRevista: string;
  codigoCategoria: string;
  cantidadHorasTrabajadas: number;
  porcentajeAporteTrabajadorAdicional: number;
}

interface ConceptoLSD {
  cuil: string;
  codigoConcepto: string;      // Código AFIP del concepto
  cantidad: number;
  unidad: string;
  importeConcepto: number;
  importeBase: number;
  porcentaje: number;
  debeHaber: 'D' | 'H';        // Débito o Haber
}

interface TotalesLSD {
  totalRemunerativo: number;
  totalNoRemunerativo: number;
  totalDescuentos: number;
  totalNeto: number;
  baseImponible1: number;      // Jubilación
  baseImponible2: number;      // Obra Social
  baseImponible3: number;      // LRT
  baseImponible4: number;      // Contribuciones
  baseImponible5: number;      // Ganancias
}
```

### 3.3 Mapeo de Conceptos a Códigos AFIP

```typescript
// Tabla de códigos de conceptos para LSD

const CODIGOS_CONCEPTOS_AFIP = {
  // Remunerativos
  'BASICO': '1000',
  'ANTIGUEDAD': '1001',
  'PRESENTISMO': '1002',
  'HS_EXTRA_50': '1010',
  'HS_EXTRA_100': '1011',
  'SAC': '1050',
  'VACACIONES': '1060',

  // No Remunerativos
  'VIATICOS': '2000',
  'ASIG_FAMILIAR': '2100',

  // Descuentos
  'JUBILACION': '3000',
  'OBRA_SOCIAL': '3001',
  'PAMI': '3002',
  'SINDICATO': '3010',
  'GANANCIAS': '3050',

  // ... más códigos
};

function mapearConceptoAFIP(
  conceptoInterno: ConceptoLiquidacion
): string {
  return CODIGOS_CONCEPTOS_AFIP[conceptoInterno.codigo]
    || conceptoInterno.codigoAFIP
    || '9999';  // Otros
}
```

### 3.4 Generación del Archivo

```typescript
async function generarLibroSueldosDigital(
  periodo: PeriodoLiquidacion,
  liquidaciones: Liquidacion[]
): Promise<Buffer> {
  const lsd: LibroSueldosDigital = {
    cabecera: {
      cuitEmpleador: periodo.tenant.cuit,
      periodoLiquidacion: format(periodo.fechaDesde, 'yyyyMM'),
      tipoLiquidacion: mapearTipoLiquidacion(periodo.tipo),
      cantidadEmpleados: liquidaciones.length,
      fechaGeneracion: new Date()
    },
    empleados: [],
    conceptos: [],
    totales: inicializarTotales()
  };

  for (const liquidacion of liquidaciones) {
    // Agregar empleado
    lsd.empleados.push(mapearEmpleadoLSD(liquidacion.user));

    // Agregar conceptos
    for (const concepto of liquidacion.conceptos) {
      lsd.conceptos.push({
        cuil: liquidacion.user.cuil,
        codigoConcepto: mapearConceptoAFIP(concepto),
        cantidad: concepto.cantidad || 1,
        unidad: concepto.unidad || 'U',
        importeConcepto: concepto.monto,
        importeBase: concepto.base || concepto.monto,
        porcentaje: concepto.porcentaje || 100,
        debeHaber: concepto.tipo === 'DESCUENTO' ? 'D' : 'H'
      });
    }

    // Acumular totales
    acumularTotales(lsd.totales, liquidacion);
  }

  // Generar archivo en formato AFIP
  return generarArchivoLSD(lsd);
}

function generarArchivoLSD(lsd: LibroSueldosDigital): Buffer {
  const lineas: string[] = [];

  // Registro tipo 1: Cabecera
  lineas.push(generarRegistroCabecera(lsd.cabecera));

  // Registros tipo 2: Empleados
  for (const empleado of lsd.empleados) {
    lineas.push(generarRegistroEmpleado(empleado));
  }

  // Registros tipo 3: Conceptos
  for (const concepto of lsd.conceptos) {
    lineas.push(generarRegistroConcepto(concepto));
  }

  // Registro tipo 9: Totales
  lineas.push(generarRegistroTotales(lsd.totales));

  return Buffer.from(lineas.join('\r\n'), 'utf-8');
}
```

---

## 4. F.931 - Declaración Jurada de Aportes y Contribuciones

### 4.1 Descripción
Formulario mensual de declaración jurada de aportes y contribuciones al Sistema Único de Seguridad Social (SUSS).

### 4.2 Estructura

```typescript
interface F931 {
  // Datos del empleador
  empleador: {
    cuit: string;
    razonSocial: string;
    domicilioFiscal: string;
    actividadPrincipal: string;
  };

  // Período
  periodo: string;  // YYYYMM

  // Nómina
  cantidadEmpleados: number;

  // Bases imponibles
  bases: {
    remuneracionTotal: number;
    baseJubilacion: number;
    baseObraSocial: number;
    baseLRT: number;
  };

  // Aportes de empleados
  aportesEmpleados: {
    jubilacion: number;
    obraSocial: number;
    pami: number;
    total: number;
  };

  // Contribuciones patronales
  contribucionesPatronales: {
    jubilacion: number;
    pami: number;
    asignacionesFamiliares: number;
    fne: number;
    obraSocial: number;
    lrt: number;
    seguroVida: number;
    total: number;
  };

  // Cuota ART
  cuotaART: number;

  // Detalle por empleado
  detalleEmpleados: DetalleEmpleadoF931[];
}

interface DetalleEmpleadoF931 {
  cuil: string;
  apellidoNombre: string;
  remuneracion: number;
  baseJubilacion: number;
  baseObraSocial: number;
  aporteJubilacion: number;
  aporteObraSocial: number;
  aportePAMI: number;
  contribucionJubilacion: number;
  contribucionObraSocial: number;
  contribucionFNE: number;
  contribucionAsigFam: number;
}
```

### 4.3 Generación

```typescript
async function generarF931(
  periodo: PeriodoLiquidacion,
  liquidaciones: Liquidacion[],
  contribucionesPatronales: ContribucionesPatronales[]
): Promise<F931> {
  const f931: F931 = {
    empleador: {
      cuit: periodo.tenant.cuit,
      razonSocial: periodo.tenant.nombre,
      domicilioFiscal: periodo.tenant.domicilioFiscal,
      actividadPrincipal: periodo.tenant.actividadPrincipal
    },
    periodo: format(periodo.fechaDesde, 'yyyyMM'),
    cantidadEmpleados: liquidaciones.length,
    bases: { remuneracionTotal: 0, baseJubilacion: 0, baseObraSocial: 0, baseLRT: 0 },
    aportesEmpleados: { jubilacion: 0, obraSocial: 0, pami: 0, total: 0 },
    contribucionesPatronales: {
      jubilacion: 0, pami: 0, asignacionesFamiliares: 0,
      fne: 0, obraSocial: 0, lrt: 0, seguroVida: 0, total: 0
    },
    cuotaART: 0,
    detalleEmpleados: []
  };

  for (let i = 0; i < liquidaciones.length; i++) {
    const liq = liquidaciones[i];
    const contrib = contribucionesPatronales[i];

    // Acumular bases
    f931.bases.remuneracionTotal += liq.totalRemunerativo;
    f931.bases.baseJubilacion += liq.baseJubilacion;
    f931.bases.baseObraSocial += liq.baseObraSocial;

    // Acumular aportes empleado
    f931.aportesEmpleados.jubilacion += liq.aporteJubilacion;
    f931.aportesEmpleados.obraSocial += liq.aporteObraSocial;
    f931.aportesEmpleados.pami += liq.aportePAMI;

    // Acumular contribuciones patronales
    f931.contribucionesPatronales.jubilacion += contrib.sipa;
    f931.contribucionesPatronales.pami += contrib.pami;
    f931.contribucionesPatronales.asignacionesFamiliares += contrib.asignacionesFamiliares;
    f931.contribucionesPatronales.fne += contrib.fne;
    f931.contribucionesPatronales.obraSocial += contrib.obraSocial;
    f931.contribucionesPatronales.lrt += contrib.art;

    // Detalle empleado
    f931.detalleEmpleados.push({
      cuil: liq.user.cuil,
      apellidoNombre: `${liq.user.lastName}, ${liq.user.firstName}`,
      remuneracion: liq.totalRemunerativo,
      baseJubilacion: liq.baseJubilacion,
      baseObraSocial: liq.baseObraSocial,
      aporteJubilacion: liq.aporteJubilacion,
      aporteObraSocial: liq.aporteObraSocial,
      aportePAMI: liq.aportePAMI,
      contribucionJubilacion: contrib.sipa,
      contribucionObraSocial: contrib.obraSocial,
      contribucionFNE: contrib.fne,
      contribucionAsigFam: contrib.asignacionesFamiliares
    });
  }

  // Totales
  f931.aportesEmpleados.total =
    f931.aportesEmpleados.jubilacion +
    f931.aportesEmpleados.obraSocial +
    f931.aportesEmpleados.pami;

  f931.contribucionesPatronales.total = Object.values(f931.contribucionesPatronales)
    .reduce((a, b) => a + b, 0);

  return f931;
}
```

---

## 5. Simplificación Registral

### 5.1 Altas

```typescript
interface AltaEmpleado {
  // Datos del alta
  cuil: string;
  fechaAlta: string;           // YYYYMMDD

  // Datos laborales
  codigoModalidadContratacion: string;
  codigoActividad: string;
  codigoObraSocial: string;
  codigoCCT: string;
  codigoCategoria: string;
  codigoZona: string;

  // Remuneración
  remuneracionPactada: number;
  tipoRemuneracion: 'MENSUAL' | 'JORNAL' | 'HORA';

  // Jornada
  cantidadHorasSemanal: number;
  porcentajeJornada: number;

  // Lugar de trabajo
  localidadLugarTrabajo: string;
  provinciaTrabajo: string;
}

async function generarAltaSimplificacionRegistral(
  empleado: User,
  datosLaborales: DatosLaboralesCCT
): Promise<AltaEmpleado> {
  return {
    cuil: empleado.cuil,
    fechaAlta: format(datosLaborales.fechaIngreso, 'yyyyMMdd'),
    codigoModalidadContratacion: mapearModalidadContratacion(datosLaborales.tipoContrato),
    codigoActividad: obtenerCodigoActividad(empleado.tenantId),
    codigoObraSocial: obtenerCodigoObraSocial(datosLaborales.obraSocial),
    codigoCCT: datosLaborales.cct?.codigo || '0',
    codigoCategoria: datosLaborales.categoria?.codigo || '0',
    codigoZona: obtenerCodigoZona(empleado.lugarTrabajo),
    remuneracionPactada: datosLaborales.salarioBasico,
    tipoRemuneracion: 'MENSUAL',
    cantidadHorasSemanal: datosLaborales.horasSemanales || 48,
    porcentajeJornada: datosLaborales.tipoJornada === 'COMPLETA' ? 100 : 50,
    localidadLugarTrabajo: empleado.place?.address || '',
    provinciaTrabajo: obtenerProvincia(empleado.place)
  };
}
```

### 5.2 Bajas

```typescript
interface BajaEmpleado {
  cuil: string;
  fechaBaja: string;           // YYYYMMDD
  codigoCausaBaja: string;     // Código AFIP
}

const CODIGOS_BAJA = {
  'RENUNCIA': '01',
  'DESPIDO_CON_CAUSA': '02',
  'DESPIDO_SIN_CAUSA': '03',
  'MUTUO_ACUERDO': '04',
  'JUBILACION': '05',
  'FALLECIMIENTO': '06',
  'FIN_CONTRATO': '07'
};
```

### 5.3 Modificaciones

```typescript
interface ModificacionEmpleado {
  cuil: string;
  fechaModificacion: string;
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
}
```

---

## 6. Archivo Bancario para Pagos

### 6.1 Formato General

```typescript
interface ArchivoBancario {
  cabecera: CabeceraBanco;
  transferencias: TransferenciaBanco[];
  pie: PieBanco;
}

interface CabeceraBanco {
  tipRegistro: '0';
  fechaPago: string;          // YYYYMMDD
  cantidadRegistros: number;
  montoTotal: number;
  cuitEmpresa: string;
  cbuDebito: string;          // CBU cuenta de la empresa
}

interface TransferenciaBanco {
  tipRegistro: '1';
  cuil: string;
  cbu: string;
  importe: number;
  referencia: string;         // Ej: "HAB 11/2024"
}

interface PieBanco {
  tipRegistro: '9';
  cantidadRegistros: number;
  montoTotal: number;
}
```

### 6.2 Formatos por Banco

```typescript
// Cada banco tiene su formato específico

interface FormatoBanco {
  nombre: string;
  extension: string;          // .txt, .dat, etc.
  separador: string;          // ';', ',', '|', fixed-width
  encoding: string;           // 'utf-8', 'latin1'
  generarArchivo: (data: ArchivoBancario) => Buffer;
}

const FORMATOS_BANCOS: Record<string, FormatoBanco> = {
  'GALICIA': {
    nombre: 'Banco Galicia',
    extension: '.txt',
    separador: ';',
    encoding: 'latin1',
    generarArchivo: generarArchivoGalicia
  },
  'SANTANDER': {
    nombre: 'Banco Santander',
    extension: '.txt',
    separador: '|',
    encoding: 'utf-8',
    generarArchivo: generarArchivoSantander
  },
  'BBVA': {
    nombre: 'BBVA Argentina',
    extension: '.txt',
    separador: ',',
    encoding: 'utf-8',
    generarArchivo: generarArchivoBBVA
  },
  'MACRO': {
    nombre: 'Banco Macro',
    extension: '.dat',
    separador: 'FIXED',        // Ancho fijo
    encoding: 'latin1',
    generarArchivo: generarArchivoMacro
  }
  // ... más bancos
};

async function generarArchivoBancario(
  periodo: PeriodoLiquidacion,
  liquidaciones: Liquidacion[],
  banco: string
): Promise<Buffer> {
  const formato = FORMATOS_BANCOS[banco];

  if (!formato) {
    throw new Error(`Formato de banco ${banco} no soportado`);
  }

  const data: ArchivoBancario = {
    cabecera: {
      tipRegistro: '0',
      fechaPago: format(periodo.fechaPago, 'yyyyMMdd'),
      cantidadRegistros: liquidaciones.length,
      montoTotal: liquidaciones.reduce((sum, l) => sum + l.netoAPagar, 0),
      cuitEmpresa: periodo.tenant.cuit,
      cbuDebito: periodo.tenant.cbuEmpresa
    },
    transferencias: liquidaciones.map(l => ({
      tipRegistro: '1',
      cuil: l.user.cuil,
      cbu: l.user.legajo?.datosRemuneracion?.cbu || '',
      importe: l.netoAPagar,
      referencia: `HAB ${format(periodo.fechaDesde, 'MM/yyyy')}`
    })),
    pie: {
      tipRegistro: '9',
      cantidadRegistros: liquidaciones.length,
      montoTotal: liquidaciones.reduce((sum, l) => sum + l.netoAPagar, 0)
    }
  };

  return formato.generarArchivo(data);
}
```

---

## 7. Certificación de Servicios

### 7.1 Descripción
Documento que certifica los servicios prestados por un empleado, requerido para trámites jubilatorios.

```typescript
interface CertificacionServicios {
  // Datos empleador
  empleador: {
    razonSocial: string;
    cuit: string;
    domicilio: string;
    actividad: string;
  };

  // Datos empleado
  empleado: {
    apellidoNombre: string;
    cuil: string;
    fechaNacimiento: Date;
    sexo: 'M' | 'F';
  };

  // Período certificado
  periodoDesde: Date;
  periodoHasta: Date;

  // Detalle de remuneraciones
  remuneraciones: {
    periodo: string;           // YYYYMM
    remuneracion: number;
    aporteJubilatorio: number;
  }[];

  // Firma
  fechaEmision: Date;
  lugarEmision: string;
}
```

---

## 8. Reportes Internos

### 8.1 Resumen de Liquidación

```typescript
interface ResumenLiquidacion {
  periodo: string;
  cantidadEmpleados: number;

  totales: {
    totalBruto: number;
    totalRemunerativo: number;
    totalNoRemunerativo: number;
    totalAportesEmpleado: number;
    totalNetoAPagar: number;
    totalContribucionesPatronales: number;
    costoLaboralTotal: number;
  };

  porConcepto: {
    concepto: string;
    tipo: string;
    cantidad: number;
    total: number;
  }[];

  porDepartamento?: {
    departamento: string;
    cantidad: number;
    totalBruto: number;
    totalNeto: number;
  }[];

  porCategoria?: {
    categoria: string;
    cantidad: number;
    totalBruto: number;
    totalNeto: number;
  }[];
}
```

### 8.2 Listado de Novedades

```typescript
interface ListadoNovedades {
  periodo: string;

  novedades: {
    empleado: string;
    cuil: string;
    tipo: string;           // Licencia, Ausencia, etc.
    fechaDesde: Date;
    fechaHasta?: Date;
    dias: number;
    observaciones?: string;
  }[];
}
```

### 8.3 Control de Horas Extras

```typescript
interface ControlHorasExtras {
  periodo: string;

  empleados: {
    empleado: string;
    cuil: string;
    horasExtras50: number;
    horasExtras100: number;
    totalHorasMes: number;
    acumuladoAño: number;
    alertas: string[];       // Ej: "Supera límite mensual"
  }[];

  resumen: {
    totalHoras50: number;
    totalHoras100: number;
    montoTotal: number;
    empleadosConExceso: number;
  };
}
```

---

## 9. Exportación y Formatos

### 9.1 Formatos Soportados

```typescript
enum FormatoExportacion {
  PDF = 'pdf',
  EXCEL = 'xlsx',
  CSV = 'csv',
  TXT = 'txt',        // Para AFIP
  JSON = 'json'
}

async function exportarReporte(
  reporte: any,
  formato: FormatoExportacion
): Promise<Buffer> {
  switch (formato) {
    case FormatoExportacion.PDF:
      return generarPDF(reporte);
    case FormatoExportacion.EXCEL:
      return generarExcel(reporte);
    case FormatoExportacion.CSV:
      return generarCSV(reporte);
    case FormatoExportacion.TXT:
      return generarTXT(reporte);
    case FormatoExportacion.JSON:
      return Buffer.from(JSON.stringify(reporte, null, 2));
  }
}
```

---

## 10. Validaciones Pre-Exportación

```typescript
interface ValidacionExportacion {
  tipo: 'ERROR' | 'ADVERTENCIA' | 'INFO';
  codigo: string;
  mensaje: string;
  empleado?: string;
  campo?: string;
}

async function validarParaExportacion(
  periodo: PeriodoLiquidacion,
  tipoReporte: string
): Promise<ValidacionExportacion[]> {
  const errores: ValidacionExportacion[] = [];

  // Validar que todas las liquidaciones estén cerradas
  const liquidacionesAbiertas = await prisma.liquidacion.count({
    where: { periodoId: periodo.id, estado: { not: 'CERRADO' } }
  });

  if (liquidacionesAbiertas > 0) {
    errores.push({
      tipo: 'ERROR',
      codigo: 'LIQ_ABIERTAS',
      mensaje: `Hay ${liquidacionesAbiertas} liquidaciones sin cerrar`
    });
  }

  // Validar CUIL de empleados
  const empleadosSinCUIL = await prisma.user.findMany({
    where: {
      liquidaciones: { some: { periodoId: periodo.id } },
      cuil: null
    }
  });

  for (const emp of empleadosSinCUIL) {
    errores.push({
      tipo: 'ERROR',
      codigo: 'SIN_CUIL',
      mensaje: 'Empleado sin CUIL cargado',
      empleado: `${emp.lastName}, ${emp.firstName}`,
      campo: 'cuil'
    });
  }

  // Validar CBU para archivo bancario
  if (tipoReporte === 'BANCO') {
    const empleadosSinCBU = await prisma.user.findMany({
      where: {
        liquidaciones: { some: { periodoId: periodo.id } },
        legajo: { datosRemuneracion: { cbu: null } }
      }
    });

    for (const emp of empleadosSinCBU) {
      errores.push({
        tipo: 'ERROR',
        codigo: 'SIN_CBU',
        mensaje: 'Empleado sin CBU para transferencia',
        empleado: `${emp.lastName}, ${emp.firstName}`,
        campo: 'cbu'
      });
    }
  }

  return errores;
}
```

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
