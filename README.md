# DOC-CAPA

Aplicación web estática para gestionar la **Detección de Necesidades de Capacitación Docente (DNC)** del ITSQMET por período académico y generar el documento institucional asociado.

## Flujo operativo

Período global → Portada y cabecera → Carreras → Cinco fuentes del diagnóstico → Cinco necesidades candidatas por carrera → Priorización y validación del coordinador → Resultados → Capacitación genérica y específicas → Anexos → Validación → Aprobación → PDF.

## Arquitectura

La aplicación se ejecuta en el navegador, sin backend. `app.js` contiene el estado base y los renderizadores institucionales iniciales. `results.js` carga secuencialmente los módulos del DNC. `document-core.js` administra el manifiesto documental, diagnóstico por sección, trazabilidad y versionado técnico. `dnc-calculations.js` expone los cálculos canónicos compartidos y se carga antes de Resumen, Conclusiones y Recomendaciones para que esas secciones no mantengan una segunda lógica de cálculo.

Los controles institucionales se cargan directamente y en orden desde `results.js`: `institutional-governance.js`, `import-hardening.js` y `official-snapshots.js`. `document-layout.js` fija Portada y Cabecera. `document-pdf-engine.js` es el punto final de generación del PDF completo y consume el manifiesto documental, sin depender de los antiguos encadenados de `downloadPdf`. `svd-ui.js` se carga al final y constituye la navegación visible definitiva.

El orden de carga en `results.js` es parte del contrato técnico y no debe modificarse sin ejecutar las pruebas.

## SVD 2.0 · navegación visual

La interfaz sigue la lógica **Período → Documentos → Secciones → Contenido**:

- el período global permanece visible en la zona superior;
- los documentos aparecen en un panel horizontal superior;
- el DNC se abre directamente, sin dashboard inicial obligatorio;
- las secciones del documento aparecen como pestañas compactas;
- Portada y Cabecera forman parte de esas pestañas de trabajo;
- Períodos, Diagnóstico y Configuración permanecen como utilidades secundarias;
- los títulos y tarjetas son compactos y las señales de estado usan verde para completo, amarillo para pendiente y rojo únicamente para error o bloqueo.

Los nodos heredados de `sidebar` e `Inicio` pueden existir durante el arranque porque módulos históricos todavía los consultan, pero **SVD 2.0 los elimina físicamente del DOM al finalizar la inicialización**. Ya no quedan ocultos esperando reaparecer por CSS. Si un módulo anterior falla, el cargador intenta inicializar SVD 2.0 de todos modos y muestra un estado de error en lugar de restaurar silenciosamente la interfaz vieja.

En pantallas pequeñas se conserva la misma lógica y los paneles horizontales pueden desplazarse sin cambiar el orden mental de la aplicación.

## Portada y cabecera

La interfaz dispone de dos apartados independientes:

- **Portada:** título, subtítulo y responsables de elaboración, revisión y aprobación.
- **Cabecera:** unidad responsable, nombre del documento, código base, período y logotipo institucional.

Ambos componentes se almacenan en `state.documentMeta`, quedan asociados al período activo y forman parte del snapshot oficial cuando se aprueba el DNC. La portada sigue siendo una sección real del manifiesto documental; la cabecera es un componente reutilizable y no una sección numerada del contenido.

## Cálculos y secciones derivadas

`dnc-calculations.js` es la fuente compartida para carreras analizadas, clusters, recurrencia, necesidad base, alcance, resultados por carrera y capacitaciones específicas. **Resumen Ejecutivo, Conclusiones y Recomendaciones consumen `window.DOC_CAPA_DNC`** y ya no recalculan clusters o alcance de forma independiente.

La Sección 5 (Resultados) continúa siendo el módulo operativo donde se capturan y presentan los resultados de base; las secciones posteriores solo derivan contenido a partir de esa información.

## PDF documental

`document-pdf-engine.js` construye el PDF completo siguiendo el orden del manifiesto registrado por el Core. Usa los renderizadores institucionales exactos disponibles para Portada y secciones iniciales, y el renderer documental genérico para las secciones derivadas restantes. El motor expone `window.DOC_CAPA_PDF` y fija `window.downloadPdf` como salida pública final.

Los módulos de secciones ya no necesitan interceptar `jsPDF.API.save` para agregarse al documento final. Las versiones oficiales continúan capturando el PDF resultante y su hash mediante `official-snapshots.js`.

## Persistencia

- Estado de trabajo y registro de períodos: `localStorage`.
- Contexto institucional por período, incluida la estructura de portada/cabecera: `doc-capa-period-context-v1`.
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

Antes de fusionar cambios a `main`, GitHub Actions ejecuta validación de sintaxis y pruebas de arquitectura, cálculos, controles institucionales, estructura documental, navegación SVD 2.0, limpieza de runtime, motor PDF y secciones derivadas canónicas.

Los cambios deben entrar mediante una rama y Pull Request antes del despliegue a GitHub Pages.

## Limitaciones conocidas

La aplicación continúa siendo de navegador único y no implementa autenticación, firma electrónica ni permisos multiusuario. La aprobación interna de DOC-CAPA controla el flujo documental, pero no sustituye una firma institucional o un sistema corporativo de gestión documental.
