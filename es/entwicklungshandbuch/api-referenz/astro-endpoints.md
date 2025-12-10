---
title: Endpoints de API de Astro e Integración Backend
description: Documentación completa para Endpoints de API de Astro, Servicios WFS, API de Overpass e integración con Geoserver
quality:
  completeness: 80
  accuracy: 90
  reviewed: true
  reviewer: null
  reviewDate: null
---

# Endpoints de API de Astro e Integración Backend

> **Estado:** ✅ Totalmente documentado

## Resumen

La aplicación p2d2 utiliza Endpoints de API de Astro para integraciones seguras de backend con servicios externos de geodatos. Estos endpoints proporcionan manejo de CORS, autenticación y un robusto manejo de errores para servicios WFS, API de Overpass e integraciones con Geoserver.

## Avisos de Seguridad

### Estado de las Credenciales

**Nota:** En producción, las credenciales se gestionan exclusivamente a través de variables de entorno (`import.meta.env.WFS_USERNAME`, `import.meta.env.WFS_PASSWORD`). Las credenciales codificadas (hardcoded) *nunca* se utilizan en entornos de producción, sino que representan únicamente soluciones temporales o entornos de desarrollo/prueba y están marcadas con advertencias.

**Archivos Afectados:**

  - `src/pages/api/wfs-proxy.ts` - Espera variables de entorno
  - `src/utils/wfs-auth.ts` - Espera variables de entorno

**Acciones Inmediatas Requeridas:**

1.  Asegurarse de que no queden credenciales codificadas en el código fuente de producción
2.  Configurar correctamente las variables de entorno para todos los entornos
3.  En desarrollo/pruebas, usar advertencias claras al utilizar fallbacks

## Endpoints Principales de la API

### 1. Endpoint de Proxy WFS (`/api/wfs-proxy.ts`)

Proxy seguro para solicitudes de servicio WFS con soporte CORS y autenticación basada en el entorno.

#### Implementación Estándar

```typescript
const WFS_USERNAME = import.meta.env.WFS_USERNAME;
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;
if (!WFS_USERNAME || !WFS_PASSWORD) {
  throw new Error("WFS authentication not configured in environment");
}
```

#### Notas sobre Desarrollo

```typescript
// Dev-Fallback – solo para pruebas locales y con advertencias claras:
const WFS_USERNAME = import.meta.env.WFS_USERNAME || "dev_user";
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD || "dev_password";
```

### 2. Endpoint de Sincronización de Polígonos (`/api/sync-polygons.ts`)

Endpoint de API para la sincronización automática de polígonos con la API de Overpass y WFS-T.

#### Especificación del Endpoint

```typescript
export async function POST({ request }) {
  const { slug, categories } = await request.json();
  const result = await syncKommunePolygons(slug, categories);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500
  });
}
```

## Integraciones de Servicios Backend

### Gestión de Transacciones WFS

El acceso a WFS-T se realiza de forma análoga: Las credenciales siempre provienen de variables `.env`.

## Aspectos de Seguridad

  - Las credenciales nunca deben ser codificadas (hardcoded)
  - Validación de las variables .env al inicio y en cada solicitud
  - Manejo claro de errores en caso de ausencia

## Conclusión

La documentación describe el manejo productivo de credenciales a través de variables de entorno y ofrece las mejores prácticas para desarrollo, pruebas y uso en producción.

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.