# AMVA Salud Adolescente

Plataforma web para registrar, consolidar y analizar información de morbilidad y mortalidad en adolescentes del Área Metropolitana del Valle de Aburrá.

## Modelo operativo

La plataforma admite dos fuentes oficiales por municipio, mes y tipo de evento:

1. **Casos individuales**: cada fila representa un caso y el sistema genera el consolidado.
2. **Consolidado mensual**: cada fila representa una combinación de variables con `numero_casos`.

La restricción única `municipio + año + mes + tipo_evento` evita mezclar ambos métodos para el mismo período y previene doble conteo.

La **población** se almacena por separado y funciona como denominador de tasas.

## Funcionalidad implementada

- Dashboard conectado a la base de datos con agregación en BD (sin cargar todas las filas en memoria).
- **Autenticación con sesiones firmadas (HMAC-SHA256) y cookies httpOnly**.
- **RBAC con 4 roles**: Super Admin, Admin municipal, Digitador, Analista.
- **Restricción por municipio**: los usuarios no super-admin solo operan sobre su municipio.
- Registro individual de morbilidad y mortalidad.
- Creación automática del período mensual al registrar un caso.
- **Validación server-side de que `eventDate` cae dentro del período del submission** (tanto en `/api/cases` como en `/api/import`).
- **Phase derivada del servidor a partir de la edad** (no se confía del cliente).
- Importación CSV con previsualización y validación.
- Carga de casos individuales, consolidado mensual y población.
- Protección contra mezcla de fuentes.
- Deduplicación de importaciones de casos individuales por huella SHA-256.
- Reimportación del consolidado con reemplazo controlado **solo en DRAFT** (los períodos VALIDATED ya no se pueden sobreescribir).
- Cierre de períodos.
- Base poblacional y cálculo de tasa bruta de mortalidad por 100.000 cuando existe denominador.
- Auditoría de creación, importación y cierre **con atribución de usuario (`userId`) y captura del `beforeData`** en reemplazos.
- **DTOs saneados en `/api/cases` GET** (no expone internals de Prisma).
- **`/api/health` no expone metadatos sensibles** (current_user, IDs de Neon).
- **Guards contra `NaN`** en todos los query params numéricos.
- Tests unitarios (Vitest) para validación y dominio.
- CI con lint, typecheck, tests y build.

## Stack

- Next.js 16 + React 19 + TypeScript (strict)
- Tailwind CSS 3
- PostgreSQL + Neon
- Prisma ORM
- Zod 4
- bcryptjs (hashing de contraseñas)
- Apache ECharts
- Papa Parse
- Vitest (tests)
- GitHub Actions
- Vercel

## Variables de entorno

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="cadena-aleatoria-de-al-menos-32-caracteres"  # usado para firmar cookies de sesión
NEXT_PUBLIC_APP_NAME="AMVA Salud Adolescente"
```

Para generar `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Arranque

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000`. La app redirige a `/login` si no hay sesión.

### Usuarios sembrados (contraseña por defecto: `Cambiar123!`)

| Email | Rol | Municipio |
|---|---|---|
| admin@amva.gov.co | SUPER_ADMIN | (global) |
| medellin@amva.gov.co | ADMIN_MUNICIPAL | Medellín |
| caldas@amva.gov.co | DIGITADOR | Caldas |
| analista@amva.gov.co | ANALISTA | (global) |

> ⚠️ **Rota la contraseña en el primer inicio de sesión.**

## Flujo de prueba recomendado

1. Iniciar sesión con `admin@amva.gov.co` / `Cambiar123!`.
2. Entrar a **Carga mensual → Población** y cargar `public/templates/poblacion.csv`.
3. Entrar a **Registrar caso** y crear un caso individual.
4. Revisarlo en **Casos**.
5. Ir a **Consolidados** y cerrar el período.
6. Revisar el **Dashboard**; los indicadores solo cuentan períodos validados/cerrados.
7. Revisar **Auditoría** — debe mostrar el usuario que ejecutó cada acción.

## Plantillas

- `/templates/casos_individuales.csv`
- `/templates/consolidado_mensual.csv`
- `/templates/poblacion.csv`

## Tests

```bash
npm run test        # Vitest, una sola pasada
npm run test -- --watch
```

## Antes de producción

- ✅ ~~Activar autenticación y RBAC.~~ (ahora implementado)
- Rotar las contraseñas sembradas por defecto.
- Configurar `AUTH_SECRET` en Vercel con un secreto fuerte.
- Definir formalmente fórmulas y denominadores de cada indicador.
- Acordar catálogos oficiales: CIE-10, etnia, nivel educativo, régimen y zona.
- Cargar la base poblacional oficial seleccionada por el proyecto.
- Aplicar política de conservación, respaldo y tratamiento de datos.
- Ejecutar pruebas de seguridad, permisos por municipio y auditoría.
- Considerar añadir rate limiting en `/api/import`.
- Considerar añadir CSRF tokens en los formularios (la sesión por cookie httpOnly sameSite=lax mitiga la mayoría de vectores CSRF).
