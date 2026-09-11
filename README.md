# DOC-CAPA

Aplicación web estática para gestionar la **Detección de Necesidades de Capacitación Docente (DNC)** del ITSQMET por período académico y generar el documento institucional asociado.

## Flujo operativo

Período global → Carreras → Cinco fuentes del diagnóstico → Cinco necesidades candidatas por carrera → Priorización y validación del coordinador → Resultados → Capacitación genérica y específicas → Anexos → Validación → Aprobación → PDF.

## Arquitectura

La aplicación se ejecuta en el navegador, sin backend. `app.js` contiene el estado base y los renderizadores institucionales iniciales. `results.js` carga secuencialmente los módulos del DNC. `document-core.js` administra el manifiesto documental, diagnóstico por sección, trazabilidad y versionado técnico. `dnc-calculations.js` expone cálculos canónicos compartidos. `dnc-manifest.js` registra el documento DNC y sus 11 secciones. `institutional-hardening.js` añade controles de integridad documental, contexto por período, validación CACES auditable, modo de importación, snapshots oficiales en IndexedDB y controles de consistencia adicionales.

El orden de carga en `results.js` es parte del contrato técnico y no debe modificarse sin ejecutar las pruebas.

## Persistencia

- Estado de trabajo y registro de períodos: `localStorage`.
- Contexto institucional por período: `doc-capa-period-context-v1`.
- Trazabilidad de importaciones: `doc-capa-import-trace-v2`.
- Metadatos de versiones oficiales: `doc-capa-official-history-v1` y `doc-capa-document-versions-v1`.
- Copias oficiales inmutables del estado y PDF, además de respaldos de trabajo: `IndexedDB`, base `doc-capa-official-v1`.

La aplicación muestra una alerta cuando el uso estimado de `localStorage` se aproxima a límites típicos del navegador. Las copias oficiales se guardan en IndexedDB para evitar duplicar imágenes y bases maestras en `localStorage`.

## Importaciones Excel

El modo predeterminado es **Reemplazar datos de esta plantilla**, para evitar que queden registros obsoletos cuando una fila desaparece de un archivo corregido. Existe un modo avanzado **Combinar con datos existentes**.

Las necesidades candidatas validan carrera, evidencia, máximo de cinco por carrera, valores permitidos de impacto/pertinencia/alineación, estado de validación del coordinador y coherencia de la ganadora.

## Aprobación y auditoría

Al aprobar un DNC sin pendientes, la aplicación registra una versión oficial con:

- período;
- versión del Core y de la plantilla;
- snapshot completo del estado y contexto institucional;
- hash SHA-256 de los datos;
- copia del PDF oficial;
- hash SHA-256 del PDF;
- fecha de aprobación.

Las versiones oficiales se almacenan en IndexedDB y pueden descargarse desde **Diagnóstico → Historial oficial**. Reabrir el DNC no modifica las versiones oficiales previas.

## Base legal controlada

La Base Legal utiliza referencias verificadas a la Constitución, la LOES y el **Modelo de Evaluación Externa 2024 con Fines de Acreditación para los Institutos Superiores Técnicos y Tecnológicos** del CACES. El modelo CACES debe validarse explícitamente por período; la aplicación ya no lo considera validado por defecto.

## Desarrollo y pruebas

Antes de fusionar cambios a `main`, GitHub Actions ejecuta:

```bash
node --check *.js
node tests/architecture-smoke.mjs
node tests/calculations-smoke.mjs
node tests/hardening-smoke.mjs
```

Los cambios deben entrar mediante una rama y Pull Request. El CI valida sintaxis, arquitectura, cálculos y controles institucionales antes del despliegue a GitHub Pages.

## Limitaciones conocidas

La aplicación continúa siendo de navegador único y no implementa autenticación, firma electrónica ni permisos multiusuario. La aprobación interna de DOC-CAPA controla el flujo documental, pero no sustituye una firma institucional o un sistema corporativo de gestión documental.
