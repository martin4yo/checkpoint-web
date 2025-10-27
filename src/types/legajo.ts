// Tipos para el sistema de legajos

export interface LegajoDatosPersonales {
  dni?: string
  cuil?: string
  fechaNacimiento?: string
  genero?: string
  estadoCivil?: string
  nacionalidad?: string
  domicilioCalle?: string
  domicilioNumero?: string
  domicilioPiso?: string
  domicilioDepto?: string
  domicilioLocalidad?: string
  domicilioProvincia?: string
  domicilioCP?: string
  telefonoFijo?: string
  telefonoCelular?: string
  emailPersonal?: string
  emailCorporativo?: string
}

export interface FamiliarACargo {
  nombre: string
  relacion: string
  fechaNacimiento?: string
  dni?: string
}

export interface LegajoDatosFamiliares {
  hijosACargo?: boolean
  grupoFamiliarACargo?: FamiliarACargo[]
}

export interface ContactoEmergencia {
  id?: string
  nombre: string
  relacion: string
  telefono: string
  orden: number
}

export interface LegajoDatosLaborales {
  fechaIngreso?: string
  fechaEgreso?: string
  tipoContrato?: string
  categoria?: string
  puesto?: string
  area?: string
  sector?: string
  supervisor?: string
  ubicacion?: string
  jornada?: string
  modalidad?: string
  modalidadTrabajo?: string
  obraSocial?: string
  sindicato?: string
  convenioColectivo?: string
  numeroAfiliado?: string
}

export interface Adicional {
  concepto: string
  monto: number
  tipo: string
}

export interface Beneficio {
  tipo: string
  descripcion: string
  monto?: number
}

export interface LegajoDatosRemuneracion {
  salarioBasico?: number
  tipoLiquidacion?: string
  banco?: string
  cbu?: string
  obraSocial?: string
  arl?: string
  adicionales?: Adicional[]
  beneficios?: Beneficio[]
}

export interface Formacion {
  id?: string
  nivelEducativo?: string
  titulo?: string
  institucion?: string
  fechaObtencion?: string
  certificaciones?: string
}

export interface Capacitacion {
  id?: string
  nombre: string
  descripcion?: string
  institucion?: string
  fechaRealizacion?: string
  duracionHoras?: number
  certificado: boolean
}

export interface Documento {
  id?: string
  tipoDocumento: string
  descripcion?: string
  archivoUrl?: string
  fechaCarga?: string
  fechaVencimiento?: string
}

export interface LegajoDatosAdministrativos {
  estadoEmpleado?: string
  diasVacacionesAnuales?: number
  diasVacacionesDisponibles?: number
  diasVacacionesTomadas?: number
  licenciasAcumuladas?: Record<string, number>
  observaciones?: string
  legajoFisico?: string
}

export interface LegajoCompleto {
  id?: string
  userId: string
  numeroLegajo: string
  datosPersonales?: LegajoDatosPersonales
  datosFamiliares?: LegajoDatosFamiliares
  contactosEmergencia?: ContactoEmergencia[]
  datosLaborales?: LegajoDatosLaborales
  datosRemuneracion?: LegajoDatosRemuneracion
  formacion?: Formacion[]
  capacitaciones?: Capacitacion[]
  documentos?: Documento[]
  datosAdministrativos?: LegajoDatosAdministrativos
}
