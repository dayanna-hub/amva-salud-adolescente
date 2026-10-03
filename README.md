# AMVA Salud Adolescente

Plataforma web para registrar, consolidar y analizar información de morbilidad y mortalidad en adolescentes del Área Metropolitana del Valle de Aburrá.

## Modelo operativo

La plataforma admite dos fuentes oficiales por municipio, mes y tipo de evento:

1. **Casos individuales**: cada fila representa un caso y el sistema genera el consolidado.
2. **Consolidado mensual**: cada fila representa una combinación de variables con `numero_casos`.

La restricción única `municipio + año + mes + tipo_evento` evita mezclar ambos métodos para el mismo período y previene doble conteo.

La **población** se almacena por separado y funciona como denominador de tasas.

## Funcionalidad implementada

- Dashboard conectado a la base de datos.
- Registro individual de morbilidad y mortalidad.
- Creación automática del período mensual al registrar un caso.
- Importación CSV con previsualización y validación.
- Carga de casos individuales, consolidado mensual y población.
- Protección contra mezcla de fuentes.
- Deduplicación de importaciones de casos individuales por huella SHA-256.
- Reimportación del consolidado con reemplazo controlado del borrador.
- Cierre de períodos.
- Base poblacional y cálculo de tasa bruta de mortalidad por 100.000 cuando existe denominador.
- Auditoría de creación, importación y cierre.
- Roles de datos preparados: Super Admin, Admin municipal, Digitador y Analista.
- CI para lint, typecheck y build.

> La autenticación/RBAC debe activarse antes de usar información real. La versión actual no debe exponerse a datos personales o clínicos identificables.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- PostgreSQL + Neon
- Prisma ORM
- Zod
- Apache ECharts
- Papa Parse
- GitHub Actions
- Vercel

## Variables de entorno

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_NAME="AMVA Salud Adolescente"
```

## Arranque

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000`.

## Flujo de prueba recomendado

1. Entrar a **Carga mensual → Población** y cargar `public/templates/poblacion.csv`.
2. Entrar a **Registrar caso** y crear un caso individual.
3. Revisarlo en **Casos**.
4. Ir a **Consolidados** y cerrar el período.
5. Revisar el **Dashboard**; los indicadores solo cuentan períodos validados/cerrados.
6. Revisar **Auditoría**.

## Plantillas

- `/templates/casos_individuales.csv`
- `/templates/consolidado_mensual.csv`
- `/templates/poblacion.csv`

## Antes de producción

- Activar autenticación y RBAC.
- Definir formalmente fórmulas y denominadores de cada indicador.
- Acordar catálogos oficiales: CIE-10, etnia, nivel educativo, régimen y zona.
- Cargar la base poblacional oficial seleccionada por el proyecto.
- Aplicar política de conservación, respaldo y tratamiento de datos.
- Ejecutar pruebas de seguridad, permisos por municipio y auditoría.
"# amva-salud-adolescente" 
"# amva-salud-adolescente" 
