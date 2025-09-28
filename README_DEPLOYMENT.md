# Guía de Despliegue - Checkpoint Web

## Requisitos del Servidor

- Node.js 18+
- PostgreSQL
- PM2 (para gestión de procesos)
- Nginx (opcional, para proxy reverso)

## Pasos de Despliegue

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 2. Configurar Base de Datos

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE checkpoint_db;
CREATE USER checkpoint_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE checkpoint_db TO checkpoint_user;
\q
```

### 3. Subir Código al Servidor

```bash
# Subir el proyecto a /var/www
scp -r ./checkpoint-web user@149.50.148.198:/var/www/
# O clonar desde GitHub directamente en /var/www
cd /var/www
sudo git clone https://github.com/martin4yo/checkpoint-web.git
sudo chown -R $USER:$USER /var/www/checkpoint-web
```

### 4. Configurar Variables de Entorno

```bash
# Editar .env.production con los datos correctos
DATABASE_URL="postgresql://checkpoint_user:tu_password_seguro@localhost:5432/checkpoint_db"
JWT_SECRET="tu-jwt-secret-muy-seguro-de-al-menos-32-caracteres"
NEXT_PUBLIC_APP_URL="http://149.50.148.198:8086"
PORT=8086
```

### 5. Ejecutar Despliegue

```bash
cd checkpoint-web
chmod +x deploy.sh
./deploy.sh
```

### 6. Ejecutar Migraciones de Base de Datos

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 7. Iniciar con PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

### 8. Configurar Nginx (Opcional)

```nginx
# /etc/nginx/sites-available/checkpoint
server {
    listen 80;
    server_name 149.50.148.198;

    location / {
        proxy_pass http://localhost:8086;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/checkpoint /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Comandos Útiles

```bash
# Ver logs de PM2
pm2 logs checkpoint-web

# Reiniciar aplicación
pm2 restart checkpoint-web

# Ver estado
pm2 status

# Parar aplicación
pm2 stop checkpoint-web

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
```

## Acceso a la Aplicación

Una vez desplegada, la aplicación estará disponible en:
- **Directo**: http://149.50.148.198:8086
- **Con Nginx**: http://149.50.148.198

## Notas de Seguridad

1. Cambiar el `JWT_SECRET` por algo único y seguro
2. Configurar firewall para el puerto 8086
3. Considerar usar HTTPS en producción
4. Respaldar la base de datos regularmente