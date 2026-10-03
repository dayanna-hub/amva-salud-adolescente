# Despliegue Neon + Vercel

## Neon

1. Crear un proyecto PostgreSQL para la aplicación o una base de datos aislada dentro de un proyecto autorizado.
2. Obtener una cadena de conexión con SSL.
3. Configurar `DATABASE_URL`.
4. Ejecutar:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Confirmar que existan los 10 municipios en `Municipality`.

## GitHub

Crear un repositorio dedicado, por ejemplo `amva-salud-adolescente`, y subir la rama `main`.

## Vercel

1. Importar el repositorio.
2. Configurar `DATABASE_URL` como variable de entorno.
3. Ejecutar el primer despliegue.
4. Verificar `/api/health`.
5. Mantener datos reales deshabilitados hasta activar autenticación/RBAC.

## Comprobaciones mínimas

- `/api/health` responde `database: connected`.
- Registro individual crea el período y el caso.
- Intentar cargar consolidado para el mismo municipio/mes/evento devuelve conflicto 409.
- Importar el mismo CSV de casos dos veces no incrementa los registros duplicados.
- Reimportar consolidado reemplaza el borrador previo.
- Un período cerrado no admite nuevos registros.
- Dashboard solo usa períodos VALIDATED/CLOSED.
