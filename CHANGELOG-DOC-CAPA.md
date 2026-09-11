# DOC-CAPA · cierre de estructura documental

## 2026-09-11

- Se crean apartados visibles e independientes para **Portada** y **Cabecera**.
- Portada y cabecera se almacenan en `state.documentMeta` y quedan asociadas al período.
- Se elimina el loader intermedio `institutional-hardening.js`; los controles institucionales se cargan directamente y en orden.
- `document-layout.js` se carga al final para fijar la salida pública de vista completa y PDF.
- La portada del manifiesto se vuelve a registrar con el renderer canónico configurable.
- Se unifican los botones de descarga DNC en un único punto público de entrada.
- Se añaden pruebas de estructura documental, salida pública y persistencia por período.
