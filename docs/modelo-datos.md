# Modelo de datos

## Entidades principales

### Municipality
Catálogo de los diez municipios del Área Metropolitana del Valle de Aburrá.

### Submission
Representa el reporte oficial de un municipio para un año, mes y tipo de evento.

Restricción crítica:

```text
municipalityId + year + month + eventType = único
```

Esto impide que para el mismo evento mensual se contabilicen simultáneamente casos individuales y consolidado.

Campos relevantes:

- `eventType`: MORBIDITY | MORTALITY
- `sourceType`: INDIVIDUAL_CASES | MONTHLY_CONSOLIDATED
- `inputMethod`: FORM | CSV | XLSX
- `status`: DRAFT | IN_REVIEW | VALIDATED | CLOSED

### CaseRecord
Registro individual sin identificadores personales directos. Guarda edad, fase de adolescencia, sexo, zona, diagnóstico/CIE-10 o causa de defunción, nivel educativo, estrato, etnia y régimen.

Los casos importados reciben `sourceFingerprint` para evitar duplicar la misma fila si se carga nuevamente el archivo.

### ConsolidatedRow
Fila agregada del reporte mensual. Guarda las dimensiones disponibles y `caseCount`.

Las reimportaciones de un consolidado abierto reemplazan las filas anteriores del mismo `Submission`, evitando sumar dos veces una corrección mensual.

### Population
Denominadores por municipio, año, edad y sexo.

Restricción:

```text
municipalityId + year + age + sex = único
```

### AuditLog
Trazabilidad de operaciones críticas.

## Adolescencia

Según la definición utilizada por el proyecto:

- 10–13: EARLY_10_13
- 14–17: MIDDLE_14_17
- 18–19: LATE_18_19

La fase se deriva de la edad y no debe ser digitada de manera independiente.

## Datos identificables

El modelo actual evita nombre, documento, dirección, teléfono y otros identificadores directos del adolescente. Si el alcance cambia y se incorporan datos personales o clínicos identificables, debe revisarse la arquitectura de seguridad y cumplimiento antes de usarlos.
