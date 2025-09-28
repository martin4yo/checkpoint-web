#!/bin/bash

# Script de configuración automática para servidor de producción
# Checkpoint Web Application
# Para ejecutar: sudo ./setup-production.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
DB_NAME="checkpoint_db"
DB_USER="checkpoint_user"
DB_PASSWORD=""
JWT_SECRET=""
APP_DIR="/var/www/checkpoint-web"
NGINX_SITE="checkpoint-web"

echo -e "${BLUE}🚀 Configuración automática de Checkpoint Web${NC}"
echo "======================================================="

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script debe ejecutarse como root (sudo)"
   exit 1
fi

# Solicitar configuraciones
echo ""
log_info "Configuración de la aplicación:"
read -p "🔐 Contraseña para la base de datos PostgreSQL: " -s DB_PASSWORD
echo ""
read -p "🔑 JWT Secret (mínimo 32 caracteres): " -s JWT_SECRET
echo ""

if [ ${#JWT_SECRET} -lt 32 ]; then
    log_error "JWT Secret debe tener al menos 32 caracteres"
    exit 1
fi

# 1. Actualizar sistema
log_info "Actualizando sistema..."
apt update && apt upgrade -y
log_success "Sistema actualizado"

# 2. Instalar dependencias si no están instaladas
log_info "Verificando dependencias..."

# Node.js (si no está instalado)
if ! command -v node &> /dev/null; then
    log_info "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log_success "Node.js instalado"
else
    log_success "Node.js ya está instalado"
fi

# PostgreSQL (si no está instalado)
if ! command -v psql &> /dev/null; then
    log_info "Instalando PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    log_success "PostgreSQL instalado"
else
    log_success "PostgreSQL ya está instalado"
fi

# PM2 (si no está instalado)
if ! command -v pm2 &> /dev/null; then
    log_info "Instalando PM2..."
    npm install -g pm2
    log_success "PM2 instalado"
else
    log_success "PM2 ya está instalado"
fi

# Nginx (si no está instalado)
if ! command -v nginx &> /dev/null; then
    log_info "Instalando Nginx..."
    apt install -y nginx
    log_success "Nginx instalado"
else
    log_success "Nginx ya está instalado"
fi

# 3. Configurar PostgreSQL
log_info "Configurando base de datos PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Crear usuario y base de datos
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

log_success "Base de datos configurada"

# 4. Crear directorio de aplicación si no existe
if [ ! -d "$APP_DIR" ]; then
    log_info "Creando directorio de aplicación..."
    mkdir -p $APP_DIR
    log_success "Directorio creado en $APP_DIR"
fi

# 5. Clonar repositorio (si no existe)
if [ ! -f "$APP_DIR/package.json" ]; then
    log_info "Clonando repositorio..."
    cd /var/www
    git clone https://github.com/martin4yo/checkpoint-web.git
    log_success "Repositorio clonado"
else
    log_info "Actualizando repositorio..."
    cd $APP_DIR
    git pull origin master
    log_success "Repositorio actualizado"
fi

# 6. Configurar permisos
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# 7. Instalar dependencias de Node.js
log_info "Instalando dependencias de Node.js..."
cd $APP_DIR
npm install --production
log_success "Dependencias instaladas"

# 8. Configurar variables de entorno
log_info "Configurando variables de entorno..."
cat > $APP_DIR/.env.production << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# Next.js Configuration
NEXT_PUBLIC_APP_URL="http://149.50.148.198:8086"
PORT=8086

# Node Environment
NODE_ENV=production
EOF

chown www-data:www-data $APP_DIR/.env.production
chmod 600 $APP_DIR/.env.production

log_success "Variables de entorno configuradas"

# 9. Generar Prisma y ejecutar migraciones
log_info "Configurando base de datos con Prisma..."
npx prisma generate
npx prisma migrate deploy
log_success "Base de datos configurada con Prisma"

# 10. Construir aplicación
log_info "Construyendo aplicación..."
npm run build
log_success "Aplicación construida"

# 11. Configurar PM2
log_info "Configurando PM2..."
pm2 delete checkpoint-web 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
log_success "PM2 configurado"

# 12. Configurar Nginx
log_info "Configurando Nginx..."
cat > /etc/nginx/sites-available/$NGINX_SITE << EOF
server {
    listen 80;
    server_name 149.50.148.198;

    # Logs
    access_log /var/log/nginx/checkpoint-access.log;
    error_log /var/log/nginx/checkpoint-error.log;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:8086;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Serve static files directly
    location /_next/static {
        alias $APP_DIR/.next/static;
        expires 365d;
        access_log off;
    }

    location /uploads {
        alias $APP_DIR/public/uploads;
        expires 30d;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Activar sitio
ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Probar configuración y reiniciar
nginx -t
systemctl reload nginx
systemctl enable nginx

log_success "Nginx configurado"

# 13. Configurar firewall (si ufw está disponible)
if command -v ufw &> /dev/null; then
    log_info "Configurando firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8086/tcp
    ufw --force enable
    log_success "Firewall configurado"
fi

# 14. Crear scripts de gestión
log_info "Creando scripts de gestión..."

# Script de logs
cat > /usr/local/bin/checkpoint-logs << 'EOF'
#!/bin/bash
echo "=== Logs de PM2 ==="
pm2 logs checkpoint-web --lines 50
echo ""
echo "=== Logs de Nginx ==="
tail -n 20 /var/log/nginx/checkpoint-error.log
EOF

# Script de restart
cat > /usr/local/bin/checkpoint-restart << 'EOF'
#!/bin/bash
echo "Reiniciando Checkpoint Web..."
pm2 restart checkpoint-web
nginx -t && systemctl reload nginx
echo "Aplicación reiniciada"
EOF

# Script de status
cat > /usr/local/bin/checkpoint-status << 'EOF'
#!/bin/bash
echo "=== Estado de PM2 ==="
pm2 status
echo ""
echo "=== Estado de Nginx ==="
systemctl status nginx --no-pager -l
echo ""
echo "=== Puerto 8086 ==="
netstat -tlnp | grep :8086 || echo "Puerto 8086 no está en uso"
EOF

chmod +x /usr/local/bin/checkpoint-*
log_success "Scripts de gestión creados"

# Resumen final
echo ""
echo "======================================================="
log_success "🎉 ¡Configuración completada exitosamente!"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "• Aplicación: http://149.50.148.198:8086"
echo "• Nginx Proxy: http://149.50.148.198"
echo "• Base de datos: PostgreSQL ($DB_NAME)"
echo "• Directorio: $APP_DIR"
echo ""
echo -e "${BLUE}🛠️  Comandos útiles:${NC}"
echo "• Ver logs: checkpoint-logs"
echo "• Reiniciar: checkpoint-restart"
echo "• Ver estado: checkpoint-status"
echo "• PM2 directo: pm2 status"
echo ""
echo -e "${BLUE}🔗 URLs de acceso:${NC}"
echo "• Aplicación: http://149.50.148.198"
echo "• Aplicación directa: http://149.50.148.198:8086"
echo ""
log_warning "¡No olvides configurar SSL/HTTPS para producción!"
echo "======================================================="