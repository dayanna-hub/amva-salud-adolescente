# Infraestructura Neon

La base de datos de producción del proyecto está en la organización **NEXO STUDIO** de Neon.

- Proyecto: `amva-salud-adolescente`
- Project ID: `noisy-bonus-40050798`
- Rama principal: `production`
- Branch ID: `br-divine-lab-b4in309p`
- Base de datos: `neondb`
- Región: AWS US East 2 (Ohio)
- Plan: Free

## Estado actual

El esquema inicial de la aplicación está aplicado y contiene las tablas:

- `Municipality`
- `User`
- `Submission`
- `CaseRecord`
- `ConsolidatedRow`
- `Population`
- `AuditLog`

Los 10 municipios del Área Metropolitana del Valle de Aburrá están cargados.

Managed Better Auth está habilitado en la rama `production`.

## Variables requeridas

No se deben guardar credenciales reales en GitHub.

```bash
DATABASE_URL="postgresql://..."
NEON_AUTH_BASE_URL="https://.../neondb/auth"
NEON_AUTH_COOKIE_SECRET="..."
NEXT_PUBLIC_APP_NAME="AMVA Salud Adolescente"
```

La cadena de conexión debe configurarse como secreto/variable de entorno en Vercel.

## Seguridad

No introducir información real de salud identificable hasta que el login, los roles y la separación por municipio estén activos y probados.
