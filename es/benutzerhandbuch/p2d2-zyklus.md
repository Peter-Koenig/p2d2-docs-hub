---
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König (=> AI-Translation)
  reviewDate: 2025-11-24
---

# El Ciclo p2d2

El ciclo p2d2 describe el flujo de datos bidireccional entre administración, portal OpenData, comunidad p2d2 y plataformas públicas de datos. El proceso consta de **9 pasos**:

![Ciclo p2d2 - Flujo de Datos Bidireccional](/assets/p2d2-zyklus.png)
*Figura: El ciclo p2d2 visualiza el flujo de datos bidireccional entre administración, comunidad p2d2 y plataformas públicas*

## 1. La Administración Crea Datos

El personal administrativo recopila y mantiene datos en **sistemas especializados**:

- Software de gestión de cementerios
- Sistemas GIS de la administración
- Bases de datos especializadas

**Ejemplo**: Se crea un nuevo cementerio en el GIS municipal.

## 2. Publicación Automatizada

Los datos se publican **automáticamente** en el **portal OpenData** del municipio:

- Exportación desde sistemas especializados
- Transformación a formatos OpenData (ej.: GeoJSON, CSV)
- Provisión a través de API del portal

**Ejemplo**: Los datos de cementerios aparecen actualizados diariamente en offenedaten-koeln.de.

## 3. p2d2 Toma los Datos

p2d2 **importa** automáticamente los datos desde el portal OpenData:

- Sincronización regular (ej.: diaria)
- Transformación a modelo de datos unificado
- Almacenamiento en base de datos PostGIS

**Ejemplo**: Los nuevos cementerios se cargan automáticamente en p2d2.

## 4. Los Usuarios Editan los Datos

**Los usuarios de p2d2** revisan y mejoran los datos:

- Corrección de geometrías (límites, entradas)
- Adición de atributos faltantes
- Adición de fotos o descripciones
- Marcado para garantía de calidad

**Ejemplo**: Un usuario corrige la entrada del cementerio y añade horarios de apertura.

## 5. La Comunidad Verifica la Calidad

La **comunidad p2d2** revisa los cambios:

- Revisión por usuarios experimentados
- Verificación de completitud y consistencia
- Aprobación para importación masiva en OSM/WikiData
- O: Rechazo con justificación

**Ejemplo**: Un moderador de la comunidad revisa los cambios y los aprueba.

## 6. Transferencia Automatizada

Después de la aprobación, los datos se **transfieren automáticamente**:

- **OpenStreetMap**: Vía OSM-API o JOSM
- **WikiData**: Vía WikiData-API
- **Otras plataformas**: Según configuración

**Ejemplo**: El cementerio corregido se importa en OSM.

## 7. Los Cambios Activan Notificación

Los cambios en los datos en plataformas públicas activan **notificaciones**:

- Los changesets de OSM son monitoreados
- Las ediciones de WikiData son rastreadas
- El departamento especializado recibe notificación

**Ejemplo**: La administración del cementerio es informada sobre el cambio en OSM.

## 8. La Administración Revisa el Cambio

**El personal administrativo** revisa el cambio:

- Verificación de corrección
- Decisión: Adoptar o rechazar
- Si se adopta: Actualización en el sistema especializado

**Ejemplo**: La administración adopta los horarios de apertura corregidos.

## 9. Ciclo Completo: Datos Mejorados

Los **datos mejorados** están ahora disponibles para todos:

- El sistema especializado tiene datos actuales
- El portal OpenData se actualiza
- p2d2 sincroniza los cambios
- OSM/WikiData tienen datos con calidad garantizada

**Ejemplo**: El cementerio está ahora correcta y actualmente registrado en todos los sistemas.

---

## Ventajas del Ciclo

- **Bidireccionalidad**: Los datos fluyen en ambas direcciones
- **Garantía de Calidad**: La comunidad y la administración verifican juntas
- **Actualidad**: Los cambios se adoptan rápidamente
- **Transparencia**: Todos los pasos son rastreables
- **Eficiencia**: No más trabajo duplicado

## Implementación Técnica

El ciclo es habilitado por varios componentes:

- **Automatización**: Cronjobs, webhooks, APIs
- **Control de Versiones**: Historial de cambios similar a Git
- **Notificaciones**: E-mail, RSS, webhooks
- **Interfaces**: REST-APIs, servicios OGC

::: tip
El ciclo p2d2 es el corazón de la aplicación y diferencia a p2d2 de las herramientas de recolección de datos puras.
:::
