# Documentación del Proyecto Checkpoint Web

Este directorio contiene toda la documentación técnica del proyecto.

---

## 📄 Archivos Disponibles

### [CONTEXT.md](./CONTEXT.md)
**Contexto completo del proyecto** - Leer primero para entender la arquitectura

Contiene:
- Información general del proyecto
- Stack tecnológico
- Arquitectura y estructura
- Esquema de base de datos
- Endpoints API
- Variables de entorno
- Comandos útiles
- Estado actual
- Flujo de trabajo
- Troubleshooting

**📌 Úsalo para:** Retomar el trabajo después de un tiempo sin trabajar en el proyecto

---

### [CHANGELOG-2025-12-04.md](./CHANGELOG-2025-12-04.md)
**Registro de cambios del 4 de Diciembre 2025**

Contiene:
- Problemas resueltos en detalle
- Código específico modificado
- Arquitectura del TenantSelector
- Flujos de inicialización
- Prevención de loops infinitos
- Patrones de diseño aplicados
- Testing checklist
- Trabajo futuro sugerido

**📌 Úsalo para:** Entender qué se hizo y por qué en esta sesión específica

---

## 🗂️ Organización de la Documentación

```
docs/
├── README.md                    # Este archivo
├── CONTEXT.md                   # Contexto general del proyecto
├── CHANGELOG-2025-12-04.md      # Cambios del 4 dic 2025
└── [futuros changelogs]         # Próximas sesiones
```

---

## 🔍 Cómo Usar Esta Documentación

### Caso 1: Primera vez en el proyecto
1. Lee `CONTEXT.md` de principio a fin
2. Configura tu entorno siguiendo las instrucciones
3. Ejecuta los comandos de la sección "Para Continuar Trabajando"

### Caso 2: Retomando después de un tiempo
1. Lee `CONTEXT.md` → sección "Estado Actual del Proyecto"
2. Lee el último `CHANGELOG-*.md`
3. Ejecuta `git pull` y `npm install`
4. Verifica que todo funciona con `npm run dev`

### Caso 3: Investigando un bug
1. Revisa `CONTEXT.md` → sección "Bugs Conocidos"
2. Busca en los CHANGELOGs si ya se resolvió algo similar
3. Usa la sección "Troubleshooting" del CONTEXT

### Caso 4: Agregando nueva funcionalidad
1. Lee `CONTEXT.md` → "Arquitectura del Proyecto"
2. Revisa endpoints y esquema de base de datos existentes
3. Sigue el "Flujo de Trabajo Recomendado"
4. Al finalizar, crea un nuevo CHANGELOG con la fecha

---

## 📝 Convenciones para Nuevos Changelogs

Al crear un nuevo changelog, usar este formato de nombre:
```
CHANGELOG-YYYY-MM-DD.md
```

Estructura sugerida:
```markdown
# Changelog - DD de MMMM YYYY

## Resumen de Cambios
[Descripción breve]

## 🔧 Problemas Resueltos
### 1. Título del problema
**Problema:** ...
**Solución:** ...
**Archivos modificados:** ...
**Código:** ...

## 📁 Archivos Modificados
[Tabla con archivos y cambios]

## 🚀 Commits
[Lista de commits]

## ✅ Testing Checklist
- [ ] ...

## 🔜 Trabajo Futuro
[Pendientes y sugerencias]
```

---

## 🔄 Mantenimiento de la Documentación

### Actualizar CONTEXT.md cuando:
- Se agrega una nueva funcionalidad importante
- Cambia la arquitectura del proyecto
- Se agregan nuevos endpoints API
- Cambia el esquema de base de datos
- Se actualiza el stack tecnológico

### Crear nuevo CHANGELOG cuando:
- Se completa una sesión de trabajo significativa
- Se resuelven bugs importantes
- Se implementan features nuevas
- Se hacen refactors grandes

### Actualizar README.md cuando:
- Se agregan nuevos tipos de documentación
- Cambian las convenciones
- Se necesitan nuevas secciones

---

## 📚 Recursos Externos

### Documentación Oficial
- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Anthropic Claude](https://docs.anthropic.com)

### Tutoriales Útiles
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [JWT Authentication](https://jwt.io/introduction)

---

## ⚡ Quick Reference

### Variables de Entorno Esenciales
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### Comandos Más Usados
```bash
npm run dev          # Desarrollo
npm run build        # Compilar
npx prisma studio    # Ver base de datos
git status           # Estado de Git
```

### Endpoints Críticos
```
GET  /api/auth/me
GET  /api/tenants
GET  /api/users
POST /api/chat
```

---

**Última actualización:** 4 de Diciembre 2025
**Mantenido por:** Claude Code + Equipo de desarrollo
