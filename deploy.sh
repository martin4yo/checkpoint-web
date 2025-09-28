#!/bin/bash

# Script de despliegue para servidor Linux
echo "🚀 Iniciando despliegue de Checkpoint Web..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Generar cliente de Prisma
echo "🗄️ Generando cliente de Prisma..."
npx prisma generate

# Construir la aplicación
echo "🔨 Construyendo aplicación para producción..."
npm run build

# Configurar variables de entorno de producción
echo "⚙️ Configurando variables de entorno..."
if [ ! -f ".env.production" ]; then
    echo "⚠️ Advertencia: No se encontró .env.production"
    echo "Por favor, configura las variables de entorno antes de continuar."
fi

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar la aplicación:"
echo "  npm start"
echo ""
echo "Para usar PM2 (recomendado para producción):"
echo "  npm install -g pm2"
echo "  pm2 start ecosystem.config.js --env production"
echo "  pm2 startup"
echo "  pm2 save"
echo ""
echo "La aplicación estará disponible en: http://149.50.148.198:8086"