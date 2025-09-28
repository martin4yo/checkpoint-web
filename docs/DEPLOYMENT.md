# Deployment Guide - Checkpoint System

Guía completa para el despliegue en producción del sistema de checkpoints.

## 🚀 Checklist de Despliegue

### Pre-requisitos
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ configurado
- [ ] Dominio configurado (opcional)
- [ ] SSL/TLS certificado (recomendado)
- [ ] Servidor con al menos 2GB RAM

### Configuración de Base de Datos
- [ ] PostgreSQL corriendo y accesible
- [ ] Base de datos `checkpoint` creada
- [ ] Usuario con permisos apropiados
- [ ] Backup de datos existentes (si aplica)

### Variables de Entorno
- [ ] `DATABASE_URL` configurada
- [ ] `JWT_SECRET` configurado (único y seguro)
- [ ] `NODE_ENV=production`
- [ ] Variables opcionales configuradas

### Aplicación Web
- [ ] Dependencias instaladas (`npm install`)
- [ ] Prisma cliente generado (`npx prisma generate`)
- [ ] Base de datos sincronizada (`npx prisma db push`)
- [ ] Usuario administrativo creado
- [ ] Build de producción (`npm run build`)
- [ ] Archivos estáticos servidos correctamente

### Aplicación Móvil
- [ ] URL del backend actualizada en `api.js`
- [ ] Permisos configurados en `app.json`
- [ ] Build para plataformas objetivo
- [ ] Testing en dispositivos reales

---

## 🌐 Despliegue en Servidor

### 1. Preparación del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

### 2. Configuración de PostgreSQL

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE checkpoint;
CREATE USER checkpoint_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE checkpoint TO checkpoint_user;
\q

# Configurar acceso remoto (si es necesario)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Descomentar: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Añadir: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### 3. Desplegar Aplicación Web

```bash
# Clonar repositorio
git clone <your-repo-url> checkpoint-web
cd checkpoint-web

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env
```

**Configuración `.env` para producción**:
```env
# Base de datos
DATABASE_URL="postgresql://checkpoint_user:secure_password@localhost:5432/checkpoint"

# JWT Secret (generar uno único)
JWT_SECRET="your-super-secure-jwt-secret-here-32-chars-min"

# Entorno
NODE_ENV="production"

# Uploads
UPLOAD_DIR="./public/uploads"

# Opcional: Google Maps
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Puerto (opcional)
PORT=3000
```

```bash
# Generar cliente Prisma
npx prisma generate

# Sincronizar base de datos
npx prisma db push

# Crear usuario inicial
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@checkpoint.com',
      password: hashedPassword
    }
  });
  console.log('Admin creado: admin@checkpoint.com / admin123');
  await prisma.\$disconnect();
}
createAdmin().catch(console.error);"

# Build para producción
npm run build

# Crear directorio para uploads
mkdir -p public/uploads
chmod 755 public/uploads

# Iniciar con PM2
pm2 start npm --name "checkpoint-web" -- start
pm2 save
pm2 startup
```

### 4. Configuración de Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/checkpoint
```

**Configuración Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout para uploads
        client_max_body_size 10M;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    location /uploads/ {
        alias /path/to/checkpoint-web/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/checkpoint /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. SSL/TLS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renovación
sudo crontab -e
# Añadir: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📱 Despliegue de App Móvil

### Build con Expo EAS

```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login a Expo
eas login

# Configurar proyecto
cd checkpoint-app
eas build:configure

# Actualizar URL de producción
nano src/services/api.js
# Cambiar: const API_BASE_URL = 'https://your-domain.com/api/mobile';
```

**Configuración `eas.json`**:
```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

```bash
# Build para Android
eas build --platform android --profile production

# Build para iOS (requiere Apple Developer Account)
eas build --platform ios --profile production

# Build local (alternativa)
npx expo run:android --variant release
```

### Distribución

#### Android (Google Play Store)
```bash
# Generar AAB para Play Store
eas build --platform android --profile production

# O generar APK para distribución directa
eas build --platform android --profile preview
```

#### iOS (App Store)
```bash
# Requiere Apple Developer Account ($99/año)
eas build --platform ios --profile production

# Subir a App Store Connect
eas submit --platform ios
```

#### Distribución Interna
```bash
# Crear build interno
eas build --platform android --profile preview

# Obtener link de descarga
eas build:list
```

---

## 🔒 Configuración de Seguridad

### Firewall (UFW)
```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Permitir PostgreSQL solo local
sudo ufw allow from 127.0.0.1 to any port 5432

# Ver estado
sudo ufw status
```

### SSL Configuration (Nginx)
```nginx
# Configuración SSL segura
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
```

### PostgreSQL Security
```bash
# Cambiar password por defecto
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new-secure-password';

# Configurar pg_hba.conf para mayor seguridad
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Cambiar método de 'trust' a 'md5' para conexiones locales
```

---

## 📊 Monitoreo y Logs

### PM2 Monitoring
```bash
# Ver procesos
pm2 list

# Ver logs
pm2 logs checkpoint-web

# Ver métricas
pm2 monit

# Reiniciar aplicación
pm2 restart checkpoint-web

# Ver logs de errores
pm2 logs checkpoint-web --err
```

### Logs del Sistema
```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Logs del sistema
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### Configurar Log Rotation
```bash
# Configurar logrotate para logs de aplicación
sudo nano /etc/logrotate.d/checkpoint

# Contenido:
/home/deploy/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🔄 CI/CD con GitHub Actions

**`.github/workflows/deploy.yml`**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build application
      run: npm run build

    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/checkpoint-web
          git pull origin main
          npm ci
          npm run build
          npx prisma generate
          npx prisma db push
          pm2 restart checkpoint-web
```

---

## 📋 Backup y Recuperación

### Backup de Base de Datos
```bash
# Crear script de backup
nano /home/deploy/backup-db.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U checkpoint_user checkpoint > $BACKUP_DIR/checkpoint_$DATE.sql

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "checkpoint_*.sql" -mtime +7 -delete

chmod +x /home/deploy/backup-db.sh

# Programar backup diario
crontab -e
# Añadir: 0 2 * * * /home/deploy/backup-db.sh
```

### Restaurar Base de Datos
```bash
# Restaurar desde backup
psql -h localhost -U checkpoint_user checkpoint < /path/to/backup.sql
```

### Backup de Archivos
```bash
# Backup de uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Rsync a servidor remoto
rsync -avz public/uploads/ user@backup-server:/backups/checkpoint/uploads/
```

---

## 🧪 Testing en Producción

### Health Checks
```bash
# Crear endpoint de salud
# En src/app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}

# Test de conexión
curl https://your-domain.com/api/health
```

### Load Testing
```bash
# Instalar artillery
npm install -g artillery

# Crear test básico
nano load-test.yml

config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Test API endpoints"
    flow:
      - post:
          url: "/api/mobile/auth"
          json:
            email: "test@test.com"
            password: "123456"

# Ejecutar test
artillery run load-test.yml
```

---

## ⚠️ Troubleshooting

### Problemas Comunes

**1. Error 502 Bad Gateway**
```bash
# Verificar que la app esté corriendo
pm2 status
pm2 restart checkpoint-web

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

**2. Error de conexión a DB**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Verificar URL de conexión
cat .env | grep DATABASE_URL
```

**3. Uploads no funcionan**
```bash
# Verificar permisos
ls -la public/uploads/
chmod 755 public/uploads/

# Verificar espacio en disco
df -h
```

**4. SSL Certificate Issues**
```bash
# Renovar certificado
sudo certbot renew

# Verificar certificado
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout
```

### Comandos de Diagnóstico
```bash
# Ver uso de recursos
htop
iotop
netstat -tlnp

# Ver logs en tiempo real
multitail /var/log/nginx/access.log ~/.pm2/logs/checkpoint-web-out.log

# Test de conectividad
curl -I https://your-domain.com
nmap -p 80,443 your-domain.com
```

---

**¡Deployment completado! Tu sistema de checkpoints está listo para producción.**