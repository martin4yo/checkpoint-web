import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { startOfMonth, endOfMonth, differenceInHours, parseISO } from 'date-fns';

/**
 * Action Executor Service para Checkpoint
 *
 * Ejecuta las acciones identificadas por el AI Assistant
 * (crear empleados, novedades, consultas, etc.)
 */

interface AIAction {
  accion: string;
  entidades?: any;
  error?: string;
}

interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class ActionExecutorService {

  /**
   * Ejecuta una acción identificada por la IA
   */
  async executeAction(
    action: AIAction,
    userId: string,
    tenantId: string,
    originalPrompt?: string
  ): Promise<ExecutionResult> {
    try {
      console.log(`\n⚙️  [Action Executor] Ejecutando: ${action.accion}`);

      switch (action.accion) {
        case 'crear_empleado':
          return await this.crearEmpleado(action, userId, tenantId, originalPrompt);

        case 'editar_empleado':
          return await this.editarEmpleado(action, userId, tenantId);

        case 'desactivar_empleado':
          return await this.desactivarEmpleado(action, userId, tenantId);

        case 'asignar_supervisor':
          return await this.asignarSupervisor(action, userId, tenantId);

        case 'crear_novedad':
          return await this.crearNovedad(action, userId, tenantId, originalPrompt);

        case 'aprobar_novedad':
          return await this.aprobarNovedad(action, userId, tenantId);

        case 'rechazar_novedad':
          return await this.rechazarNovedad(action, userId, tenantId);

        case 'listar_novedades_pendientes':
          return await this.listarNovedadesPendientes(action, userId, tenantId);

        case 'consultar_horas':
          return await this.consultarHoras(action, userId, tenantId);

        case 'consultar_horas_extras':
          return await this.consultarHorasExtras(action, userId, tenantId);

        case 'consultar_empleado':
          return await this.consultarEmpleado(action, userId, tenantId);

        case 'unknown':
          const unknownMessage = action.error || 'No pude entender el comando. ¿Podés darme más detalles?';
          console.log(`❓ [Unknown Action] Retornando mensaje: "${unknownMessage}"`);
          return {
            success: true, // Cambiar a true para que se muestre como mensaje normal
            message: unknownMessage,
            error: undefined
          };

        default:
          return {
            success: false,
            message: `Acción "${action.accion}" no implementada`,
            error: 'Acción no soportada'
          };
      }

    } catch (error) {
      console.error('❌ [Action Executor] Error:', error);
      return {
        success: false,
        message: 'Ocurrió un error al ejecutar la acción',
        error: (error as Error).message
      };
    }
  }

  /**
   * Crea un nuevo empleado
   */
  private async crearEmpleado(
    action: AIAction,
    userId: string,
    tenantId: string,
    originalPrompt?: string
  ): Promise<ExecutionResult> {
    try {
      const { empleado } = action.entidades || {};

      if (!empleado) {
        return {
          success: false,
          message: 'No se proporcionaron datos del empleado',
          error: 'Empleado requerido'
        };
      }

      // Verificar si el email ya existe
      const existente = await prisma.user.findUnique({
        where: { email: empleado.email }
      });

      if (existente) {
        return {
          success: false,
          message: `Ya existe un empleado con el email ${empleado.email}`,
          error: 'Email duplicado'
        };
      }

      // Buscar supervisor si se especificó
      let supervisorId: string | undefined;
      if (empleado.supervisorEmail) {
        const supervisor = await prisma.user.findFirst({
          where: {
            email: empleado.supervisorEmail,
            tenantId
          }
        });

        if (supervisor) {
          supervisorId = supervisor.id;
        } else {
          console.warn(`⚠️  Supervisor ${empleado.supervisorEmail} no encontrado`);
        }
      }

      // Generar contraseña temporal
      const tempPassword = this.generarPasswordTemporal();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      console.log(`📝 Creando empleado ${empleado.email}...`);

      // Crear el usuario
      const nuevoEmpleado = await prisma.user.create({
        data: {
          firstName: empleado.firstName,
          lastName: empleado.lastName,
          email: empleado.email,
          password: hashedPassword,
          tenantId,
          supervisorId,
          isActive: true,
        },
        include: {
          supervisor: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Crear legajo básico si se proporcionó DNI/CUIL/puesto
      if (empleado.dni || empleado.cuil || empleado.puesto) {
        const numeroLegajo = await this.generarNumeroLegajo(tenantId);

        await prisma.legajo.create({
          data: {
            userId: nuevoEmpleado.id,
            numeroLegajo,
            datosPersonales: empleado.dni || empleado.cuil ? {
              create: {
                dni: empleado.dni,
                cuil: empleado.cuil
              }
            } : undefined,
            datosLaborales: empleado.puesto ? {
              create: {
                puesto: empleado.puesto
              }
            } : undefined
          }
        });
      }

      console.log(`✅ Empleado ${empleado.email} creado exitosamente`);

      const mensaje = this.construirMensajeEmpleado(nuevoEmpleado, tempPassword);

      return {
        success: true,
        message: mensaje,
        data: {
          id: nuevoEmpleado.id,
          email: nuevoEmpleado.email,
          tempPassword
        }
      };

    } catch (error) {
      console.error('❌ Error creando empleado:', error);
      return {
        success: false,
        message: 'No se pudo crear el empleado',
        error: (error as Error).message
      };
    }
  }

  /**
   * Crea una novedad
   */
  private async crearNovedad(
    action: AIAction,
    userId: string,
    tenantId: string,
    originalPrompt?: string
  ): Promise<ExecutionResult> {
    try {
      const { novedad } = action.entidades || {};

      if (!novedad) {
        return {
          success: false,
          message: 'No se proporcionaron datos de la novedad',
          error: 'Novedad requerida'
        };
      }

      // Buscar el tipo de novedad
      const tipoNovedad = await prisma.noveltyType.findFirst({
        where: {
          name: {
            contains: novedad.tipoNovedad,
            mode: 'insensitive'
          },
          tenantId,
          isActive: true
        }
      });

      if (!tipoNovedad) {
        // Listar tipos disponibles
        const tiposDisponibles = await prisma.noveltyType.findMany({
          where: { tenantId, isActive: true },
          select: { name: true }
        });

        return {
          success: false,
          message: `No encontré el tipo de novedad "${novedad.tipoNovedad}". Tipos disponibles: ${tiposDisponibles.map(t => t.name).join(', ')}`,
          error: 'Tipo de novedad no encontrado'
        };
      }

      console.log(`📝 Creando novedad tipo ${tipoNovedad.name}...`);

      // Crear la novedad
      const nuevaNovedad = await prisma.novelty.create({
        data: {
          userId,
          tenantId,
          noveltyTypeId: tipoNovedad.id,
          status: 'PENDING',
          amount: novedad.monto,
          date: novedad.fecha ? parseISO(novedad.fecha) : undefined,
          startDate: novedad.fechaInicio ? parseISO(novedad.fechaInicio) : undefined,
          endDate: novedad.fechaFin ? parseISO(novedad.fechaFin) : undefined,
          notes: novedad.notas || originalPrompt
        },
        include: {
          noveltyType: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`✅ Novedad creada exitosamente`);

      const mensaje = this.construirMensajeNovedad(nuevaNovedad);

      return {
        success: true,
        message: mensaje,
        data: nuevaNovedad
      };

    } catch (error) {
      console.error('❌ Error creando novedad:', error);
      return {
        success: false,
        message: 'No se pudo crear la novedad',
        error: (error as Error).message
      };
    }
  }

  /**
   * Consulta horas trabajadas
   */
  private async consultarHoras(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { consulta } = action.entidades || {};

      const mes = consulta?.mes || new Date().getMonth() + 1;
      const anio = consulta?.anio || new Date().getFullYear();

      const fechaInicio = startOfMonth(new Date(anio, mes - 1));
      const fechaFin = endOfMonth(new Date(anio, mes - 1));

      // Buscar empleado si se especificó
      let empleadoId: string | undefined;
      if (consulta?.empleadoEmail || consulta?.empleadoNombre) {
        const where: any = { tenantId };
        if (consulta.empleadoEmail) {
          where.email = consulta.empleadoEmail;
        } else if (consulta.empleadoNombre) {
          const [firstName, ...lastNameParts] = consulta.empleadoNombre.split(' ');
          where.firstName = { contains: firstName, mode: 'insensitive' };
          if (lastNameParts.length > 0) {
            where.lastName = { contains: lastNameParts.join(' '), mode: 'insensitive' };
          }
        }

        const empleado = await prisma.user.findFirst({ where });
        if (!empleado) {
          return {
            success: false,
            message: `No encontré al empleado especificado`,
            error: 'Empleado no encontrado'
          };
        }
        empleadoId = empleado.id;
      }

      // Consultar checkpoints de jornadas
      const jornadas = await prisma.checkpoint.findMany({
        where: {
          tenantId,
          type: 'JOURNEY_START',
          timestamp: {
            gte: fechaInicio,
            lte: fechaFin
          },
          ...(empleadoId && { userId: empleadoId })
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          journeyAdjustments: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Calcular horas
      const resumen = this.calcularHorasPorEmpleado(jornadas);

      const mensaje = this.construirMensajeHoras(resumen, mes, anio);

      return {
        success: true,
        message: mensaje,
        data: resumen
      };

    } catch (error) {
      console.error('❌ Error consultando horas:', error);
      return {
        success: false,
        message: 'No se pudo consultar las horas',
        error: (error as Error).message
      };
    }
  }

  /**
   * Consulta horas extras
   */
  private async consultarHorasExtras(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { consulta } = action.entidades || {};

      const mes = consulta?.mes || new Date().getMonth() + 1;
      const anio = consulta?.anio || new Date().getFullYear();

      const fechaInicio = startOfMonth(new Date(anio, mes - 1));
      const fechaFin = endOfMonth(new Date(anio, mes - 1));

      // Consultar jornadas
      const jornadas = await prisma.checkpoint.findMany({
        where: {
          tenantId,
          type: 'JOURNEY_START',
          timestamp: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          journeyAdjustments: true
        }
      });

      // Calcular horas extras (simplificado: > 8 horas por día)
      const resumenExtras = this.calcularHorasExtras(jornadas);

      const mensaje = this.construirMensajeHorasExtras(resumenExtras, mes, anio);

      return {
        success: true,
        message: mensaje,
        data: resumenExtras
      };

    } catch (error) {
      console.error('❌ Error consultando horas extras:', error);
      return {
        success: false,
        message: 'No se pudo consultar las horas extras',
        error: (error as Error).message
      };
    }
  }

  /**
   * Consulta información de un empleado
   */
  private async consultarEmpleado(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { consulta } = action.entidades || {};

      const where: any = { tenantId };
      if (consulta?.empleadoEmail) {
        where.email = consulta.empleadoEmail;
      } else if (consulta?.empleadoNombre) {
        const [firstName, ...lastNameParts] = consulta.empleadoNombre.split(' ');
        where.firstName = { contains: firstName, mode: 'insensitive' };
        if (lastNameParts.length > 0) {
          where.lastName = { contains: lastNameParts.join(' '), mode: 'insensitive' };
        }
      } else {
        return {
          success: false,
          message: 'Necesito el email o nombre del empleado',
          error: 'Faltan parámetros'
        };
      }

      const empleado = await prisma.user.findFirst({
        where,
        include: {
          supervisor: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          legajo: {
            include: {
              datosPersonales: true,
              datosLaborales: true
            }
          }
        }
      });

      if (!empleado) {
        return {
          success: false,
          message: 'No encontré al empleado',
          error: 'Empleado no encontrado'
        };
      }

      const mensaje = this.construirMensajeEmpleadoInfo(empleado);

      return {
        success: true,
        message: mensaje,
        data: empleado
      };

    } catch (error) {
      console.error('❌ Error consultando empleado:', error);
      return {
        success: false,
        message: 'No se pudo consultar la información del empleado',
        error: (error as Error).message
      };
    }
  }

  /**
   * Edita datos de un empleado
   */
  private async editarEmpleado(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { edicion } = action.entidades || {};

      if (!edicion?.empleadoEmail || !edicion?.cambios) {
        return {
          success: false,
          message: 'Necesito el email del empleado y los cambios a realizar',
          error: 'Datos incompletos'
        };
      }

      // Buscar empleado
      const empleado = await prisma.user.findFirst({
        where: {
          email: edicion.empleadoEmail,
          tenantId
        },
        include: {
          legajo: {
            include: {
              datosLaborales: true
            }
          }
        }
      });

      if (!empleado) {
        return {
          success: false,
          message: `No encontré al empleado ${edicion.empleadoEmail}`,
          error: 'Empleado no encontrado'
        };
      }

      // Preparar datos a actualizar
      const updateData: any = {};
      if (edicion.cambios.firstName) updateData.firstName = edicion.cambios.firstName;
      if (edicion.cambios.lastName) updateData.lastName = edicion.cambios.lastName;
      if (edicion.cambios.email) updateData.email = edicion.cambios.email;

      // Buscar supervisor si se especificó
      if (edicion.cambios.supervisorEmail) {
        const supervisor = await prisma.user.findFirst({
          where: {
            email: edicion.cambios.supervisorEmail,
            tenantId
          }
        });
        if (supervisor) {
          updateData.supervisorId = supervisor.id;
        }
      }

      // Actualizar usuario
      const empleadoActualizado = await prisma.user.update({
        where: { id: empleado.id },
        data: updateData,
        include: {
          supervisor: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Actualizar datos laborales si es necesario
      if (edicion.cambios.puesto || edicion.cambios.area) {
        if (empleado.legajo?.datosLaborales) {
          await prisma.legajoDatosLaborales.update({
            where: { id: empleado.legajo.datosLaborales.id },
            data: {
              ...(edicion.cambios.puesto && { puesto: edicion.cambios.puesto }),
              ...(edicion.cambios.area && { area: edicion.cambios.area })
            }
          });
        } else if (empleado.legajo) {
          await prisma.legajoDatosLaborales.create({
            data: {
              legajoId: empleado.legajo.id,
              ...(edicion.cambios.puesto && { puesto: edicion.cambios.puesto }),
              ...(edicion.cambios.area && { area: edicion.cambios.area })
            }
          });
        }
      }

      const cambiosRealizados = Object.keys(edicion.cambios).filter(k => edicion.cambios[k as keyof typeof edicion.cambios]);

      const mensaje = `✅ **Empleado actualizado exitosamente**

👤 **Empleado:** ${empleadoActualizado.firstName} ${empleadoActualizado.lastName}
📧 **Email:** ${empleadoActualizado.email}

📝 **Cambios realizados:**
${cambiosRealizados.map(campo => {
  const valor = edicion.cambios[campo as keyof typeof edicion.cambios];
  const nombresCampo: Record<string, string> = {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    puesto: 'Puesto',
    area: 'Área',
    supervisorEmail: 'Supervisor'
  };
  return `• **${nombresCampo[campo] || campo}:** ${valor}`;
}).join('\n')}`;

      return {
        success: true,
        message: mensaje,
        data: empleadoActualizado
      };

    } catch (error) {
      console.error('❌ Error editando empleado:', error);
      return {
        success: false,
        message: 'No se pudo editar el empleado',
        error: (error as Error).message
      };
    }
  }

  /**
   * Desactiva un empleado
   */
  private async desactivarEmpleado(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { desactivacion } = action.entidades || {};

      if (!desactivacion?.empleadoEmail) {
        return {
          success: false,
          message: 'Necesito el email del empleado a desactivar',
          error: 'Email requerido'
        };
      }

      const empleado = await prisma.user.findFirst({
        where: {
          email: desactivacion.empleadoEmail,
          tenantId
        }
      });

      if (!empleado) {
        return {
          success: false,
          message: `No encontré al empleado ${desactivacion.empleadoEmail}`,
          error: 'Empleado no encontrado'
        };
      }

      if (!empleado.isActive) {
        return {
          success: false,
          message: `El empleado ${empleado.firstName} ${empleado.lastName} ya está inactivo`,
          error: 'Empleado ya inactivo'
        };
      }

      await prisma.user.update({
        where: { id: empleado.id },
        data: { isActive: false }
      });

      const mensaje = `✅ **Empleado desactivado exitosamente**

👤 **Empleado:** ${empleado.firstName} ${empleado.lastName}
📧 **Email:** ${empleado.email}
${desactivacion.motivo ? `\n📝 **Motivo:** ${desactivacion.motivo}` : ''}

⚠️ El empleado ya no podrá acceder al sistema.`;

      return {
        success: true,
        message: mensaje,
        data: { empleadoId: empleado.id }
      };

    } catch (error) {
      console.error('❌ Error desactivando empleado:', error);
      return {
        success: false,
        message: 'No se pudo desactivar el empleado',
        error: (error as Error).message
      };
    }
  }

  /**
   * Asigna un supervisor a un empleado
   */
  private async asignarSupervisor(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { asignacion } = action.entidades || {};

      if (!asignacion?.empleadoEmail || !asignacion?.supervisorEmail) {
        return {
          success: false,
          message: 'Necesito el email del empleado y del supervisor',
          error: 'Emails requeridos'
        };
      }

      // Buscar empleado
      const empleado = await prisma.user.findFirst({
        where: {
          email: asignacion.empleadoEmail,
          tenantId
        }
      });

      if (!empleado) {
        return {
          success: false,
          message: `No encontré al empleado ${asignacion.empleadoEmail}`,
          error: 'Empleado no encontrado'
        };
      }

      // Buscar supervisor
      const supervisor = await prisma.user.findFirst({
        where: {
          email: asignacion.supervisorEmail,
          tenantId
        }
      });

      if (!supervisor) {
        return {
          success: false,
          message: `No encontré al supervisor ${asignacion.supervisorEmail}`,
          error: 'Supervisor no encontrado'
        };
      }

      // Actualizar
      await prisma.user.update({
        where: { id: empleado.id },
        data: { supervisorId: supervisor.id }
      });

      const mensaje = `✅ **Supervisor asignado exitosamente**

👤 **Empleado:** ${empleado.firstName} ${empleado.lastName}
👔 **Nuevo supervisor:** ${supervisor.firstName} ${supervisor.lastName}
📧 **Email supervisor:** ${supervisor.email}`;

      return {
        success: true,
        message: mensaje,
        data: { empleadoId: empleado.id, supervisorId: supervisor.id }
      };

    } catch (error) {
      console.error('❌ Error asignando supervisor:', error);
      return {
        success: false,
        message: 'No se pudo asignar el supervisor',
        error: (error as Error).message
      };
    }
  }

  /**
   * Aprueba una novedad
   */
  private async aprobarNovedad(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { aprobacion } = action.entidades || {};

      // Buscar la novedad
      let novedad;

      if (aprobacion?.novedadId) {
        novedad = await prisma.novelty.findFirst({
          where: {
            id: aprobacion.novedadId,
            tenantId,
            status: 'PENDING'
          },
          include: {
            user: true,
            noveltyType: true
          }
        });
      } else if (aprobacion?.empleadoEmail) {
        // Buscar última novedad pendiente del empleado
        const empleado = await prisma.user.findFirst({
          where: { email: aprobacion.empleadoEmail, tenantId }
        });

        if (empleado) {
          novedad = await prisma.novelty.findFirst({
            where: {
              userId: empleado.id,
              tenantId,
              status: 'PENDING',
              ...(aprobacion.tipoNovedad && {
                noveltyType: {
                  name: {
                    contains: aprobacion.tipoNovedad,
                    mode: 'insensitive'
                  }
                }
              })
            },
            include: {
              user: true,
              noveltyType: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
        }
      }

      if (!novedad) {
        return {
          success: false,
          message: 'No encontré ninguna novedad pendiente que coincida',
          error: 'Novedad no encontrada'
        };
      }

      // Aprobar
      const novedadAprobada = await prisma.novelty.update({
        where: { id: novedad.id },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date()
        },
        include: {
          user: true,
          noveltyType: true,
          approvedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const mensaje = `✅ **Novedad aprobada exitosamente**

👤 **Empleado:** ${novedadAprobada.user.firstName} ${novedadAprobada.user.lastName}
📋 **Tipo:** ${novedadAprobada.noveltyType.name}
${novedadAprobada.startDate && novedadAprobada.endDate ? `📅 **Período:** ${new Date(novedadAprobada.startDate).toLocaleDateString('es-AR')} - ${new Date(novedadAprobada.endDate).toLocaleDateString('es-AR')}` : ''}
${novedadAprobada.amount ? `💰 **Monto:** $${novedadAprobada.amount}` : ''}
${aprobacion?.comentario ? `\n💬 **Comentario:** ${aprobacion.comentario}` : ''}

✓ Aprobada por: ${novedadAprobada.approvedBy?.firstName} ${novedadAprobada.approvedBy?.lastName}`;

      return {
        success: true,
        message: mensaje,
        data: novedadAprobada
      };

    } catch (error) {
      console.error('❌ Error aprobando novedad:', error);
      return {
        success: false,
        message: 'No se pudo aprobar la novedad',
        error: (error as Error).message
      };
    }
  }

  /**
   * Rechaza una novedad
   */
  private async rechazarNovedad(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      const { aprobacion } = action.entidades || {};

      // Buscar la novedad (misma lógica que aprobar)
      let novedad;

      if (aprobacion?.novedadId) {
        novedad = await prisma.novelty.findFirst({
          where: {
            id: aprobacion.novedadId,
            tenantId,
            status: 'PENDING'
          },
          include: {
            user: true,
            noveltyType: true
          }
        });
      } else if (aprobacion?.empleadoEmail) {
        const empleado = await prisma.user.findFirst({
          where: { email: aprobacion.empleadoEmail, tenantId }
        });

        if (empleado) {
          novedad = await prisma.novelty.findFirst({
            where: {
              userId: empleado.id,
              tenantId,
              status: 'PENDING',
              ...(aprobacion.tipoNovedad && {
                noveltyType: {
                  name: {
                    contains: aprobacion.tipoNovedad,
                    mode: 'insensitive'
                  }
                }
              })
            },
            include: {
              user: true,
              noveltyType: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
        }
      }

      if (!novedad) {
        return {
          success: false,
          message: 'No encontré ninguna novedad pendiente que coincida',
          error: 'Novedad no encontrada'
        };
      }

      // Rechazar
      const novedadRechazada = await prisma.novelty.update({
        where: { id: novedad.id },
        data: {
          status: 'REJECTED',
          approvedById: userId,
          approvedAt: new Date()
        },
        include: {
          user: true,
          noveltyType: true,
          approvedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const mensaje = `❌ **Novedad rechazada**

👤 **Empleado:** ${novedadRechazada.user.firstName} ${novedadRechazada.user.lastName}
📋 **Tipo:** ${novedadRechazada.noveltyType.name}
${novedadRechazada.startDate && novedadRechazada.endDate ? `📅 **Período:** ${new Date(novedadRechazada.startDate).toLocaleDateString('es-AR')} - ${new Date(novedadRechazada.endDate).toLocaleDateString('es-AR')}` : ''}
${aprobacion?.comentario ? `\n💬 **Motivo del rechazo:** ${aprobacion.comentario}` : ''}

✗ Rechazada por: ${novedadRechazada.approvedBy?.firstName} ${novedadRechazada.approvedBy?.lastName}`;

      return {
        success: true,
        message: mensaje,
        data: novedadRechazada
      };

    } catch (error) {
      console.error('❌ Error rechazando novedad:', error);
      return {
        success: false,
        message: 'No se pudo rechazar la novedad',
        error: (error as Error).message
      };
    }
  }

  /**
   * Lista novedades pendientes de aprobación
   */
  private async listarNovedadesPendientes(
    action: AIAction,
    userId: string,
    tenantId: string
  ): Promise<ExecutionResult> {
    try {
      // Obtener el usuario actual para ver si puede aprobar
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          authorizesNovelties: true,
          superuser: true,
          subordinates: {
            select: { id: true }
          }
        }
      });

      if (!currentUser) {
        return {
          success: false,
          message: 'Usuario no encontrado',
          error: 'Usuario no encontrado'
        };
      }

      // Determinar qué novedades puede ver
      const where: any = {
        tenantId,
        status: 'PENDING'
      };

      // Si no es superuser ni autorizador, solo ve las de sus subordinados
      if (!currentUser.superuser && !currentUser.authorizesNovelties) {
        const subordinadosIds = currentUser.subordinates.map(s => s.id);
        if (subordinadosIds.length === 0) {
          return {
            success: true,
            message: 'No tenés novedades pendientes de aprobación',
            data: []
          };
        }
        where.userId = { in: subordinadosIds };
      }

      const novedades = await prisma.novelty.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          noveltyType: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      if (novedades.length === 0) {
        return {
          success: true,
          message: '✓ No hay novedades pendientes de aprobación',
          data: []
        };
      }

      const mensaje = `📋 **Novedades pendientes de aprobación:** ${novedades.length}

${novedades.map((nov, i) => {
  let periodo = '';
  if (nov.startDate && nov.endDate) {
    periodo = `\n   📅 ${new Date(nov.startDate).toLocaleDateString('es-AR')} - ${new Date(nov.endDate).toLocaleDateString('es-AR')}`;
  } else if (nov.date) {
    periodo = `\n   📅 ${new Date(nov.date).toLocaleDateString('es-AR')}`;
  }

  return `${i + 1}. **${nov.user.firstName} ${nov.user.lastName}** - ${nov.noveltyType.name}${periodo}${nov.amount ? `\n   💰 $${nov.amount}` : ''}
   📝 ${nov.notes || 'Sin notas'}`;
}).join('\n\n')}

💡 **Podés aprobar/rechazar diciendo:**
"Aprobar la novedad de [nombre]"
"Rechazar las vacaciones de [nombre]"`;

      return {
        success: true,
        message: mensaje,
        data: novedades
      };

    } catch (error) {
      console.error('❌ Error listando novedades:', error);
      return {
        success: false,
        message: 'No se pudo obtener la lista de novedades',
        error: (error as Error).message
      };
    }
  }

  // ============ HELPERS ============

  private generarPasswordTemporal(): string {
    return Math.random().toString(36).slice(-8);
  }

  private async generarNumeroLegajo(tenantId: string): Promise<string> {
    const count = await prisma.legajo.count({
      where: {
        user: { tenantId }
      }
    });
    return `LEG-${(count + 1).toString().padStart(5, '0')}`;
  }

  private calcularHorasPorEmpleado(jornadas: any[]): any[] {
    const porEmpleado = new Map<string, any>();

    jornadas.forEach(jornada => {
      const key = jornada.userId;
      if (!porEmpleado.has(key)) {
        porEmpleado.set(key, {
          empleado: `${jornada.user.firstName} ${jornada.user.lastName}`,
          email: jornada.user.email,
          totalHoras: 0,
          jornadas: 0
        });
      }

      const data = porEmpleado.get(key);

      // Calcular horas de la jornada
      const inicio = jornada.journeyAdjustments?.manualStartTime || jornada.timestamp;
      const fin = jornada.journeyAdjustments?.manualEndTime || jornada.endTimestamp;

      if (fin) {
        const horas = differenceInHours(new Date(fin), new Date(inicio));
        data.totalHoras += horas;
        data.jornadas += 1;
      }
    });

    return Array.from(porEmpleado.values());
  }

  private calcularHorasExtras(jornadas: any[]): any[] {
    const porEmpleado = new Map<string, any>();

    jornadas.forEach(jornada => {
      const inicio = jornada.journeyAdjustments?.manualStartTime || jornada.timestamp;
      const fin = jornada.journeyAdjustments?.manualEndTime || jornada.endTimestamp;

      if (fin) {
        const horas = differenceInHours(new Date(fin), new Date(inicio));
        const horasExtras = Math.max(0, horas - 8); // > 8 horas = extras

        if (horasExtras > 0) {
          const key = jornada.userId;
          if (!porEmpleado.has(key)) {
            porEmpleado.set(key, {
              empleado: `${jornada.user.firstName} ${jornada.user.lastName}`,
              email: jornada.user.email,
              horasExtras: 0
            });
          }

          const data = porEmpleado.get(key);
          data.horasExtras += horasExtras;
        }
      }
    });

    return Array.from(porEmpleado.values());
  }

  // ============ MENSAJES ============

  private construirMensajeEmpleado(empleado: any, tempPassword: string): string {
    return `✅ **Empleado creado exitosamente**

👤 **Datos:**
• **Nombre:** ${empleado.firstName} ${empleado.lastName}
• **Email:** ${empleado.email}
• **Estado:** Activo
${empleado.supervisor ? `• **Supervisor:** ${empleado.supervisor.firstName} ${empleado.supervisor.lastName}` : ''}

🔑 **Contraseña temporal:** \`${tempPassword}\`

💡 **Próximos pasos:**
1. Completar el legajo del empleado
2. Asignar lugares de trabajo
3. El empleado debe cambiar su contraseña en el primer login`;
  }

  private construirMensajeNovedad(novedad: any): string {
    const tipo = novedad.noveltyType.name;
    let periodo = '';

    if (novedad.date) {
      periodo = `• **Fecha:** ${new Date(novedad.date).toLocaleDateString('es-AR')}`;
    } else if (novedad.startDate && novedad.endDate) {
      periodo = `• **Desde:** ${new Date(novedad.startDate).toLocaleDateString('es-AR')}
• **Hasta:** ${new Date(novedad.endDate).toLocaleDateString('es-AR')}`;
    }

    return `✅ **Novedad creada exitosamente**

📋 **Tipo:** ${tipo}
${periodo}
${novedad.amount ? `• **Monto:** $${novedad.amount}` : ''}
• **Estado:** Pendiente de aprobación
${novedad.notes ? `\n📝 **Notas:** ${novedad.notes}` : ''}

💡 **Próximos pasos:**
1. Agregar archivos adjuntos si es necesario
2. Esperar la aprobación del supervisor`;
  }

  private construirMensajeHoras(resumen: any[], mes: number, anio: number): string {
    if (resumen.length === 0) {
      return `No se encontraron jornadas registradas para ${mes}/${anio}`;
    }

    const lista = resumen.map(r =>
      `• **${r.empleado}**: ${r.totalHoras} horas (${r.jornadas} jornadas)`
    ).join('\n');

    const totalHoras = resumen.reduce((sum, r) => sum + r.totalHoras, 0);

    return `📊 **Resumen de horas - ${mes}/${anio}**

${lista}

**Total general:** ${totalHoras} horas`;
  }

  private construirMensajeHorasExtras(resumen: any[], mes: number, anio: number): string {
    if (resumen.length === 0) {
      return `No se registraron horas extras en ${mes}/${anio}`;
    }

    const lista = resumen.map(r =>
      `• **${r.empleado}**: ${r.horasExtras} horas extras`
    ).join('\n');

    const totalExtras = resumen.reduce((sum, r) => sum + r.horasExtras, 0);

    return `⏰ **Horas extras a pagar - ${mes}/${anio}**

${lista}

**Total:** ${totalExtras} horas extras

💡 *Nota: El cálculo considera extras toda jornada > 8 horas*`;
  }

  private construirMensajeEmpleadoInfo(empleado: any): string {
    const legajo = empleado.legajo;
    const datosPersonales = legajo?.datosPersonales;
    const datosLaborales = legajo?.datosLaborales;

    return `👤 **Información del empleado**

**Datos básicos:**
• **Nombre:** ${empleado.firstName} ${empleado.lastName}
• **Email:** ${empleado.email}
• **Estado:** ${empleado.isActive ? 'Activo' : 'Inactivo'}
${empleado.supervisor ? `• **Supervisor:** ${empleado.supervisor.firstName} ${empleado.supervisor.lastName}` : ''}

${legajo ? `**Legajo:** ${legajo.numeroLegajo}` : ''}

${datosPersonales ? `
**Datos personales:**
${datosPersonales.dni ? `• **DNI:** ${datosPersonales.dni}` : ''}
${datosPersonales.cuil ? `• **CUIL:** ${datosPersonales.cuil}` : ''}
${datosPersonales.fechaNacimiento ? `• **Fecha Nac.:** ${new Date(datosPersonales.fechaNacimiento).toLocaleDateString('es-AR')}` : ''}
` : ''}

${datosLaborales ? `
**Datos laborales:**
${datosLaborales.puesto ? `• **Puesto:** ${datosLaborales.puesto}` : ''}
${datosLaborales.fechaIngreso ? `• **Fecha Ingreso:** ${new Date(datosLaborales.fechaIngreso).toLocaleDateString('es-AR')}` : ''}
${datosLaborales.area ? `• **Área:** ${datosLaborales.area}` : ''}
` : ''}`;
  }
}

export default ActionExecutorService;
