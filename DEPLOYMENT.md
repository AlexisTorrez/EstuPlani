# 🚀 Guía de Despliegue 100% Gratuito de EstuPlani

Esta guía te explica paso a paso cómo dejar tu aplicación funcionando en la nube con **$0 de costo** y **sin mantenimiento manual**.

---

## 🏛️ Arquitectura de Producción Gratuita

| Componente | Plataforma | Plan Gratuito | Ventaja Clave |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Hobby (Gratis de por vida) | CDN ultra-rápida, SSL automático, deploy continuo con cada `git push`. |
| **Backend** | **Render.com** | Free Web Service (Docker) | Compatible con Docker y Rust nativo, HTTPS gratuito. |
| **Base de Datos** | **Neon.tech** | Free Tier (0.5 GB Postgres) | **No se pausa ni se duerme** (a diferencia de Supabase tras 7 días). |
| **Keep-Alive** (Opcional) | **UptimeRobot** | Free (50 monitores) | Envía un ping a `/api/health` cada 5 min para que Render no se duerma. |

---

## 📋 Paso 1: Base de Datos en Neon.tech (2 minutos)

1. Entra a [neon.tech](https://neon.tech) y regístrate gratis con tu cuenta de GitHub o Google.
2. Haz clic en **Create Project**, asígnale el nombre `estuplani` y selecciona la región más cercana (ej: `US East (Ohio)` o `South America (São Paulo)` si está disponible).
3. Al crearse, en el Dashboard verás **Connection Details**.
4. Asegúrate de que esté seleccionada la pestaña **Postgres** y copia la cadena de conexión (Connection String).
   - Tendrá un formato similar a:
     ```text
     postgres://alexis:AbCd1234@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
5. *(¡Listo! No necesitas crear tablas manualmente: el backend en Rust ejecutará automáticamente las migraciones en el primer inicio).*

---

## 📋 Paso 2: Subir tu Código a GitHub (1 minuto)

Asegúrate de que tus últimos cambios estén confirmados y subidos a tu repositorio de GitHub:

```bash
git add .
git commit -m "feat: configuracion para despliegue en la nube gratuito"
git push origin main
```

---

## 📋 Paso 3: Desplegar el Backend en Render.com (3 minutos)

1. Entra a [render.com](https://render.com) e inicia sesión con tu GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub `EstuPlani`.
4. Completa la configuración básica:
   - **Name**: `estuplani-backend` (o el nombre que prefieras).
   - **Region**: Selecciona la misma región de tu base de datos (ej: `Ohio (US East)`).
   - **Language / Runtime**: Selecciona **Docker**.
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `backend`
   - **Instance Type**: **Free**
5. En la sección **Environment Variables**, añade las siguientes variables:
   - `DATABASE_URL` = *(Pega aquí la URL que copiaste de Neon en el Paso 1)*
   - `ENVIRONMENT` = `production`
   - `JWT_SECRET` = *(Genera una cadena alfanumérica larga de más de 32 caracteres, ej: `mi_clave_secreta_super_segura_estuplani_2026_prod`)*
   - `GOOGLE_CLIENT_ID` = `949846669614-icsrqgrsg1bm0fsutq9dhsv5j9kqnt8g.apps.googleusercontent.com`
   - `FRONTEND_URL` = `*` *(o déjalo en `*` temporalmente hasta tener la URL de Vercel)*
   - `PORT` = `3001`
6. Haz clic en **Create Web Service**.
7. Render compilará la imagen de Docker en Rust. Cuando termine y esté en verde (**Live**), copia la URL que te asigna Render, por ejemplo:
   ```text
   https://estuplani-backend.onrender.com
   ```
8. Puedes probar que funciona abriendo en tu navegador:
   `https://estuplani-backend.onrender.com/api/health`
   *(Debe responder: `{"service":"EstuPlani API (Rust Axum)","status":"ok"}`)*.

---

## 📋 Paso 4: Desplegar el Frontend en Vercel (2 minutos)

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **Add New...** -> **Project**.
3. Selecciona tu repositorio `EstuPlani` y haz clic en **Import**.
4. En la pantalla de configuración:
   - **Framework Preset**: Detectará automáticamente **Vite**.
   - **Root Directory**: Haz clic en **Edit** y selecciona la carpeta **`frontend`**.
5. Despliega la sección **Environment Variables** y añade:
   - `VITE_GOOGLE_CLIENT_ID` = `949846669614-icsrqgrsg1bm0fsutq9dhsv5j9kqnt8g.apps.googleusercontent.com`
   - `VITE_API_URL` = *(Pega la URL del backend de Render del Paso 3, ej: `https://estuplani-backend.onrender.com`)*
6. Haz clic en **Deploy**.
7. En menos de 30 segundos tu frontend estará en vivo en una URL como:
   ```text
   https://estuplani.vercel.app
   ```

---

## 📋 Paso 5: Autorizar el Dominio en Google Cloud Console (1 minuto)

Para que el inicio de sesión con Google funcione en tu dominio de Vercel:

1. Ve a [Google Cloud Console - Credenciales](https://console.cloud.google.com/apis/credentials).
2. Haz clic en tu ID de cliente de OAuth 2.0 (el que creaste para la aplicación web).
3. En la sección **Orígenes autorizados de JavaScript**, haz clic en **+ AGREGAR URI** y añade:
   - Tu dominio de Vercel: `https://estuplani.vercel.app`
4. Haz clic en **Guardar**.

---

## ⚡ Paso 6 (Opcional): Mantener el Backend Activo 24/7 (Cero Latencia)

Los servicios gratuitos de Render entran en reposo si pasan 15 minutos sin visitas. Al recibir una nueva visita, pueden tardar unos 30-45 segundos en reactivarse ("cold start").

Para que esté **siempre despierto al instante de forma gratuita**:
1. Entra a [uptimerobot.com](https://uptimerobot.com) y crea una cuenta gratuita.
2. Haz clic en **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `EstuPlani Health`
   - **URL (or IP)**: `https://estuplani-backend.onrender.com/api/health`
   - **Monitoring Interval**: Cada 5 o 10 minutos.
3. Haz clic en **Create Monitor**.
4. ¡Listo! UptimeRobot hará un ping continuo a la ruta de salud de tu API, manteniéndola activa 24/7 sin que se duerma.

---

## 🔄 ¿Cómo actualizo la aplicación en el futuro?

Cada vez que quieras hacer mejoras en el código:
```bash
git add .
git commit -m "nuevas mejoras"
git push origin main
```
Tanto Vercel como Render detectarán el `git push` y se actualizarán automáticamente sin que tengas que tocar nada.
