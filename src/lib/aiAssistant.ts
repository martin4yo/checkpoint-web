import Anthropic from '@anthropic-ai/sdk';

/**
 * AI Assistant Service para Checkpoint
 *
 * Servicio para procesar comandos de lenguaje natural
 * y ejecutar acciones en Checkpoint (crear empleados, novedades, consultas, etc.)
 */

interface AIAction {
  accion:
    | 'crear_empleado'
    | 'editar_empleado'
    | 'desactivar_empleado'
    | 'asignar_supervisor'
    | 'crear_novedad'
    | 'aprobar_novedad'
    | 'rechazar_novedad'
    | 'listar_novedades_pendientes'
    | 'consultar_horas'
    | 'consultar_horas_extras'
    | 'consultar_empleado'
    | 'unknown';
  entidades?: {
    // Para crear_empleado
    empleado?: {
      firstName: string;
      lastName: string;
      email: string;
      dni?: string;
      cuil?: string;
      puesto?: string;
      supervisorEmail?: string;
    };

    // Para editar_empleado
    edicion?: {
      empleadoEmail: string;
      cambios: {
        firstName?: string;
        lastName?: string;
        email?: string;
        puesto?: string;
        area?: string;
        supervisorEmail?: string;
      };
    };

    // Para desactivar_empleado
    desactivacion?: {
      empleadoEmail: string;
      motivo?: string;
    };

    // Para asignar_supervisor
    asignacion?: {
      empleadoEmail: string;
      supervisorEmail: string;
    };

    // Para crear_novedad
    novedad?: {
      tipoNovedad: string; // nombre del tipo de novedad
      fecha?: string;
      fechaInicio?: string;
      fechaFin?: string;
      monto?: number;
      notas?: string;
    };

    // Para aprobar/rechazar novedad
    aprobacion?: {
      novedadId?: string;
      empleadoEmail?: string;
      tipoNovedad?: string;
      comentario?: string;
    };

    // Para consultas
    consulta?: {
      empleadoEmail?: string;
      empleadoNombre?: string;
      mes?: number;
      anio?: number;
      tipo?: 'todas' | 'extras' | 'normales';
    };
  };
  error?: string;
}

interface UserContext {
  userId: string;
  tenantId: string;
  userName: string;
  userEmail: string;
  isSuperuser: boolean;
}

interface AIResponse {
  success: boolean;
  action: AIAction;
  rawResponse?: string;
  error?: string;
}

class AIAssistantService {
  private anthropic: Anthropic;
  private model: string = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY no configurada');
      throw new Error('ANTHROPIC_API_KEY no está configurada en .env');
    }

    this.anthropic = new Anthropic({ apiKey });
    console.log('✅ AI Assistant Service inicializado');
  }

  /**
   * Procesa un comando de lenguaje natural
   */
  async processCommand(message: string, context: UserContext): Promise<AIResponse> {
    try {
      console.log('\n🤖 [AI Assistant] Procesando comando...');
      console.log(`   Usuario: ${context.userName} (${context.userEmail})`);
      console.log(`   Tenant: ${context.tenantId}`);
      console.log(`   Mensaje: "${message}"`);

      const systemPrompt = this.buildSystemPrompt(context);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      const rawResponse = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      console.log(`📤 Respuesta de Claude recibida (${rawResponse.length} caracteres)`);
      console.log(`📄 Contenido completo de Claude:`, rawResponse);

      const action = this.parseAIResponse(rawResponse);

      console.log(`✅ Acción identificada: ${action.accion}`);
      if (action.error) {
        console.log(`💬 Mensaje de error/pregunta: "${action.error}"`);
      }
      console.log(`📦 Action completa:`, JSON.stringify(action, null, 2));

      return {
        success: true,
        action,
        rawResponse
      };

    } catch (error) {
      console.error('❌ Error procesando comando:', error);
      return {
        success: false,
        action: { accion: 'unknown', error: (error as Error).message },
        error: (error as Error).message
      };
    }
  }

  /**
   * Construye el prompt del sistema con instrucciones y contexto
   */
  private buildSystemPrompt(context: UserContext): string {
    return `Eres un asistente IA para Checkpoint, un sistema de gestión de personal, legajos, jornadas y fichajes.

TU MISIÓN:
Interpretar comandos en lenguaje natural del usuario y convertirlos en acciones estructuradas en formato JSON.

CONTEXTO DEL USUARIO:
- Nombre: ${context.userName}
- Email: ${context.userEmail}
- Es Superusuario: ${context.isSuperuser ? 'Sí' : 'No'}
- Empresa: ${context.tenantId}

ACCIONES DISPONIBLES:

1. "crear_empleado" - Crear un nuevo empleado con datos básicos
2. "editar_empleado" - Modificar datos de un empleado existente
3. "desactivar_empleado" - Dar de baja a un empleado
4. "asignar_supervisor" - Asignar o cambiar supervisor de un empleado
5. "crear_novedad" - Crear una novedad (vacaciones, licencias, rendiciones, etc.)
6. "aprobar_novedad" - Aprobar una novedad pendiente
7. "rechazar_novedad" - Rechazar una novedad pendiente
8. "listar_novedades_pendientes" - Ver novedades que requieren aprobación
9. "consultar_horas" - Consultar horas trabajadas de empleados
10. "consultar_horas_extras" - Consultar horas extras a pagar
11. "consultar_empleado" - Obtener información de un empleado
12. "unknown" - Cuando no puedas identificar la acción

FORMATO DE RESPUESTA (JSON estricto):

Para "crear_empleado":
{
  "accion": "crear_empleado",
  "entidades": {
    "empleado": {
      "firstName": "Nombre",
      "lastName": "Apellido",
      "email": "email@empresa.com",
      "dni": "30123456" (opcional),
      "cuil": "20-30123456-7" (opcional),
      "puesto": "Desarrollador" (opcional),
      "supervisorEmail": "supervisor@empresa.com" (opcional)
    }
  }
}

Para "editar_empleado":
{
  "accion": "editar_empleado",
  "entidades": {
    "edicion": {
      "empleadoEmail": "juan@empresa.com",
      "cambios": {
        "firstName": "Nuevo nombre" (opcional),
        "lastName": "Nuevo apellido" (opcional),
        "puesto": "Nuevo puesto" (opcional),
        "area": "Nueva área" (opcional),
        "supervisorEmail": "nuevo.supervisor@empresa.com" (opcional)
      }
    }
  }
}

Para "desactivar_empleado":
{
  "accion": "desactivar_empleado",
  "entidades": {
    "desactivacion": {
      "empleadoEmail": "empleado@empresa.com",
      "motivo": "Razón de la baja" (opcional)
    }
  }
}

Para "asignar_supervisor":
{
  "accion": "asignar_supervisor",
  "entidades": {
    "asignacion": {
      "empleadoEmail": "empleado@empresa.com",
      "supervisorEmail": "supervisor@empresa.com"
    }
  }
}

Para "crear_novedad":
{
  "accion": "crear_novedad",
  "entidades": {
    "novedad": {
      "tipoNovedad": "Vacaciones" | "Licencia" | "Rendición" | "Otro",
      "fecha": "2025-12-15" (para fecha única, formato ISO),
      "fechaInicio": "2025-12-15" (para rango),
      "fechaFin": "2025-12-20" (para rango),
      "monto": 5000 (opcional, para rendiciones),
      "notas": "Descripción o justificación"
    }
  }
}

Para "consultar_horas":
{
  "accion": "consultar_horas",
  "entidades": {
    "consulta": {
      "empleadoEmail": "juan@empresa.com" (opcional, si no se especifica, todos),
      "empleadoNombre": "Juan Pérez" (opcional, alternativa a email),
      "mes": 12 (opcional, mes actual por defecto),
      "anio": 2025 (opcional, año actual por defecto),
      "tipo": "todas" | "extras" | "normales"
    }
  }
}

Para "consultar_horas_extras":
{
  "accion": "consultar_horas_extras",
  "entidades": {
    "consulta": {
      "mes": 12 (opcional),
      "anio": 2025 (opcional)
    }
  }
}

Para "aprobar_novedad":
{
  "accion": "aprobar_novedad",
  "entidades": {
    "aprobacion": {
      "novedadId": "cm..." (si se especifica ID exacto),
      "empleadoEmail": "empleado@empresa.com" (si se aprueba por empleado),
      "tipoNovedad": "Vacaciones" (si se aprueba por tipo),
      "comentario": "Comentario opcional de aprobación"
    }
  }
}

Para "rechazar_novedad":
{
  "accion": "rechazar_novedad",
  "entidades": {
    "aprobacion": {
      "novedadId": "cm..." (si se especifica ID exacto),
      "empleadoEmail": "empleado@empresa.com" (si se rechaza por empleado),
      "tipoNovedad": "Vacaciones" (si se rechaza por tipo),
      "comentario": "Motivo del rechazo"
    }
  }
}

Para "listar_novedades_pendientes":
{
  "accion": "listar_novedades_pendientes",
  "entidades": {}
}

Para "consultar_empleado":
{
  "accion": "consultar_empleado",
  "entidades": {
    "consulta": {
      "empleadoEmail": "juan@empresa.com" (requerido o empleadoNombre),
      "empleadoNombre": "Juan Pérez"
    }
  }
}

Para "unknown":
{
  "accion": "unknown",
  "error": "Formula tu respuesta como PREGUNTA al usuario pidiendo la información que falta. Ejemplos: '¿Cuál es el nombre y email del empleado?', '¿Qué querés consultar?', '¿De qué empleado querés ver las horas?'"
}

REGLAS IMPORTANTES:
- Responde SOLO con el JSON, sin texto adicional
- Si falta información crítica, usa "unknown" y explica qué falta EN FORMA DE PREGUNTA
- Para fechas, usa formato ISO (YYYY-MM-DD)
- Para nombres, separa firstName y lastName
- El email es obligatorio para crear empleados
- Intenta inferir el tipo de novedad del contexto (vacaciones, licencia, rendición, etc.)
- Si el usuario no especifica mes/año para consultas, asume el actual
- Si el usuario dice "crear empleado" o "nuevo empleado" SIN datos, usa "unknown" y preguntá qué información necesitás
- Si el usuario pide listar o consultar algo, identificá la acción aunque sea vaga
- Sé FLEXIBLE con la interpretación del comando

EJEMPLOS:

Usuario: "Crear un empleado Juan Pérez, email juan.perez@empresa.com, DNI 30123456"
Respuesta:
{
  "accion": "crear_empleado",
  "entidades": {
    "empleado": {
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@empresa.com",
      "dni": "30123456"
    }
  }
}

Usuario: "Necesito cargar vacaciones del 15 al 20 de diciembre"
Respuesta:
{
  "accion": "crear_novedad",
  "entidades": {
    "novedad": {
      "tipoNovedad": "Vacaciones",
      "fechaInicio": "2025-12-15",
      "fechaFin": "2025-12-20",
      "notas": "Solicitud de vacaciones"
    }
  }
}

Usuario: "Cuántas horas trabajó Juan Pérez este mes?"
Respuesta:
{
  "accion": "consultar_horas",
  "entidades": {
    "consulta": {
      "empleadoNombre": "Juan Pérez",
      "tipo": "todas"
    }
  }
}

Usuario: "Dame un resumen de horas extras a pagar de diciembre"
Respuesta:
{
  "accion": "consultar_horas_extras",
  "entidades": {
    "consulta": {
      "mes": 12,
      "anio": 2025
    }
  }
}

Usuario: "Necesito hacer una rendición de $5000 por gastos de viaje del 10 de diciembre"
Respuesta:
{
  "accion": "crear_novedad",
  "entidades": {
    "novedad": {
      "tipoNovedad": "Rendición",
      "fecha": "2025-12-10",
      "monto": 5000,
      "notas": "Gastos de viaje"
    }
  }
}

Usuario: "Quiero crear un empleado nuevo"
Respuesta:
{
  "accion": "unknown",
  "error": "¿Cuál es el nombre, apellido y email del nuevo empleado?"
}

Usuario: "Crear empleado"
Respuesta:
{
  "accion": "unknown",
  "error": "Perfecto, ¿cuáles son los datos del empleado? Necesito al menos nombre, apellido y email."
}

Usuario: "Qué novedades tengo?"
Respuesta:
{
  "accion": "listar_novedades_pendientes",
  "entidades": {}
}

Usuario: "Mostrame las horas"
Respuesta:
{
  "accion": "consultar_horas",
  "entidades": {
    "consulta": {
      "tipo": "todas"
    }
  }
}

AHORA PROCESA EL MENSAJE DEL USUARIO Y RESPONDE SOLO CON EL JSON.`;
  }

  /**
   * Parsea la respuesta de Claude y extrae el JSON
   */
  private parseAIResponse(response: string): AIAction {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.warn('⚠️  No se encontró JSON en la respuesta');
        return {
          accion: 'unknown',
          error: 'No se pudo parsear la respuesta de IA'
        };
      }

      const action: AIAction = JSON.parse(jsonMatch[0]);

      if (!action.accion) {
        throw new Error('Respuesta sin campo "accion"');
      }

      return action;

    } catch (error) {
      console.error('❌ Error parseando respuesta de IA:', error);
      return {
        accion: 'unknown',
        error: `Error parseando respuesta: ${(error as Error).message}`
      };
    }
  }

  /**
   * Valida que una acción sea válida y tenga los datos mínimos requeridos
   */
  validateAction(action: AIAction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (action.accion === 'crear_empleado') {
      if (!action.entidades?.empleado) {
        errors.push('Datos del empleado requeridos');
      } else {
        const emp = action.entidades.empleado;
        if (!emp.firstName) errors.push('Nombre requerido');
        if (!emp.lastName) errors.push('Apellido requerido');
        if (!emp.email) errors.push('Email requerido');
      }
    }

    if (action.accion === 'crear_novedad') {
      if (!action.entidades?.novedad) {
        errors.push('Datos de la novedad requeridos');
      } else {
        const nov = action.entidades.novedad;
        if (!nov.tipoNovedad) errors.push('Tipo de novedad requerido');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default AIAssistantService;
