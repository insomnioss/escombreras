# Escombreras — puesta en marcha

## 1. Crear la base de datos

1. Abre tu proyecto en Supabase.
2. Ve a **SQL Editor** → **New query**.
3. Copia y ejecuta todo el contenido de `supabase-schema.sql`.

## 2. Crear y habilitar al primer administrador

1. Abre el sitio localmente y usa **Crear cuenta de empresa**.
2. Confirma el correo si Supabase lo solicita.
3. En SQL Editor, ejecuta (con tu correo real):

```sql
update public.profiles
set role = 'admin', active = true
where email = 'TU_CORREO@EJEMPLO.CL';
```

4. Cierra sesión e ingresa otra vez. Verás **Usuarios y roles**.
5. Los nuevos registros quedan inactivos por seguridad. Desde ese panel asígnales el rol y actívalos.

## 3. Configuración de Auth

En Supabase, ve a **Authentication → URL Configuration**:

- Agrega tu URL de Cloudflare Pages en **Site URL** (por ejemplo `https://escombreras.pages.dev`).
- Agrega también esa URL en **Redirect URLs**.
- Durante pruebas locales agrega `http://localhost:8787` si usas un servidor local.

En **Authentication → Providers → Email**, deja habilitado Email. Puedes mantener la confirmación de correo habilitada.

## 4. Publicar en Cloudflare Pages

1. Sube estos archivos a tu repositorio de GitHub.
2. En Cloudflare Pages: **Create application → Pages → Connect to Git**.
3. Selecciona el repositorio.
4. Configuración:
   - Framework preset: `None`.
   - Build command: dejar vacío.
   - Build output directory: `/`.
5. Pulsa **Save and Deploy**.
6. Copia la URL resultante y configúrala en Supabase como se indica en el paso 3.

## Seguridad

- `supabase-config.js` contiene solo URL y clave `anon`, que son públicas por diseño.
- Nunca subas ni compartas `service_role`, contraseña de base de datos ni tokens personales.
- Los roles y activaciones se aplican mediante una función SQL que solo puede ejecutar una cuenta administradora.

## Estado de esta entrega

Ya operativo: registro, inicio/cierre de sesión, persistencia de sesión, perfiles, activación y roles administrados desde Supabase.

La siguiente implementación conecta obras, escombreras y solicitudes del panel a las tablas reales creadas en el esquema. Los paneles actuales siguen mostrando datos de muestra para esas operaciones.
