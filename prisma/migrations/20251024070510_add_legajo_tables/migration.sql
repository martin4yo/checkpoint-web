-- CreateTable
CREATE TABLE "public"."legajos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numeroLegajo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_datos_personales" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "dni" TEXT,
    "cuil" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "genero" TEXT,
    "estadoCivil" TEXT,
    "nacionalidad" TEXT,
    "domicilioCalle" TEXT,
    "domicilioNumero" TEXT,
    "domicilioPiso" TEXT,
    "domicilioDepto" TEXT,
    "domicilioLocalidad" TEXT,
    "domicilioProvincia" TEXT,
    "domicilioCP" TEXT,
    "telefonoFijo" TEXT,
    "telefonoCelular" TEXT,
    "emailPersonal" TEXT,
    "emailCorporativo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_datos_personales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_datos_familiares" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "grupoFamiliarACargo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_datos_familiares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_contactos_emergencia" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "relacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_contactos_emergencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_datos_laborales" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3),
    "fechaEgreso" TIMESTAMP(3),
    "tipoContrato" TEXT,
    "categoria" TEXT,
    "puesto" TEXT,
    "area" TEXT,
    "ubicacion" TEXT,
    "modalidadTrabajo" TEXT,
    "obraSocial" TEXT,
    "sindicato" TEXT,
    "convenioColectivo" TEXT,
    "numeroAfiliado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_datos_laborales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_datos_remuneracion" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "salarioBasico" DECIMAL(10,2),
    "tipoLiquidacion" TEXT,
    "banco" TEXT,
    "cbu" TEXT,
    "adicionales" JSONB,
    "beneficios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_datos_remuneracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_datos_administrativos" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "estadoEmpleado" TEXT,
    "diasVacacionesAnuales" INTEGER,
    "diasVacacionesDisponibles" DECIMAL(5,2),
    "diasVacacionesTomadas" DECIMAL(5,2),
    "licenciasAcumuladas" JSONB,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_datos_administrativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_horarios_trabajo" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "tipoJornada" TEXT,
    "modalidadHorario" TEXT,
    "horasSemanales" DECIMAL(5,2),
    "horasMensuales" DECIMAL(6,2),
    "esNocturno" BOOLEAN NOT NULL DEFAULT false,
    "tieneHorasExtrasPactadas" BOOLEAN NOT NULL DEFAULT false,
    "horasExtrasSemanales" DECIMAL(5,2),
    "detalleHorario" JSONB,
    "tieneTurnosRotativos" BOOLEAN NOT NULL DEFAULT false,
    "esquemaTurnos" JSONB,
    "diasFrancos" TEXT,
    "detalleFrancos" TEXT,
    "descansoDomingos" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_horarios_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_formacion" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "nivelEducativo" TEXT,
    "titulo" TEXT,
    "institucion" TEXT,
    "fechaObtencion" TIMESTAMP(3),
    "certificaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_formacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_capacitaciones" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "institucion" TEXT,
    "fechaRealizacion" TIMESTAMP(3),
    "duracionHoras" INTEGER,
    "certificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_capacitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legajo_documentos" (
    "id" TEXT NOT NULL,
    "legajoId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "descripcion" TEXT,
    "archivoUrl" TEXT,
    "fechaCarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legajos_userId_key" ON "public"."legajos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "legajos_numeroLegajo_key" ON "public"."legajos"("numeroLegajo");

-- CreateIndex
CREATE UNIQUE INDEX "legajo_datos_personales_legajoId_key" ON "public"."legajo_datos_personales"("legajoId");

-- CreateIndex
CREATE UNIQUE INDEX "legajo_datos_familiares_legajoId_key" ON "public"."legajo_datos_familiares"("legajoId");

-- CreateIndex
CREATE UNIQUE INDEX "legajo_datos_laborales_legajoId_key" ON "public"."legajo_datos_laborales"("legajoId");

-- CreateIndex
CREATE UNIQUE INDEX "legajo_datos_remuneracion_legajoId_key" ON "public"."legajo_datos_remuneracion"("legajoId");

-- CreateIndex
CREATE UNIQUE INDEX "legajo_datos_administrativos_legajoId_key" ON "public"."legajo_datos_administrativos"("legajoId");

-- AddForeignKey
ALTER TABLE "public"."legajos" ADD CONSTRAINT "legajos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_datos_personales" ADD CONSTRAINT "legajo_datos_personales_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_datos_familiares" ADD CONSTRAINT "legajo_datos_familiares_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_contactos_emergencia" ADD CONSTRAINT "legajo_contactos_emergencia_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_datos_laborales" ADD CONSTRAINT "legajo_datos_laborales_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_datos_remuneracion" ADD CONSTRAINT "legajo_datos_remuneracion_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_datos_administrativos" ADD CONSTRAINT "legajo_datos_administrativos_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_horarios_trabajo" ADD CONSTRAINT "legajo_horarios_trabajo_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_formacion" ADD CONSTRAINT "legajo_formacion_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_capacitaciones" ADD CONSTRAINT "legajo_capacitaciones_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legajo_documentos" ADD CONSTRAINT "legajo_documentos_legajoId_fkey" FOREIGN KEY ("legajoId") REFERENCES "public"."legajos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

