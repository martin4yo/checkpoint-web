#!/bin/bash

# Script para matar todos los procesos que usan el puerto 3000

echo "🔍 Buscando procesos en el puerto 3000..."

# Buscar procesos en el puerto 3000
PIDS=$(lsof -ti:3000 2>/dev/null)

if [ -z "$PIDS" ]; then
  echo "✅ No hay procesos usando el puerto 3000"
  exit 0
fi

echo "📋 Procesos encontrados:"
lsof -i:3000

echo ""
echo "💀 Matando procesos: $PIDS"
kill -9 $PIDS 2>/dev/null

# Esperar un momento
sleep 1

# Verificar que se hayan matado
REMAINING=$(lsof -ti:3000 2>/dev/null)

if [ -z "$REMAINING" ]; then
  echo "✅ Puerto 3000 liberado exitosamente"
  exit 0
else
  echo "⚠️  Advertencia: Algunos procesos aún están en el puerto 3000"
  lsof -i:3000
  exit 1
fi
