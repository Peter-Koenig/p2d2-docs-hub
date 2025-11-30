## title: GDI Architecture description: "Spatial Data Infrastructure Architecture for p2d2: Mapserver, PostGIS, OSM Tileserver" status: migrated lastUpdated: 2025-11-17 lang: en quality: completeness: 75 accuracy: 65 reviewed: false reviewer: 'KI (Gemini)'

# Spatial Data Infrastructure (SDI) - p2d2 Architecture

Status: 27.10.2025

  - WiP
  - Prototypical development
  - Currently using [Friedhof Rheinkassel](https://osm.org/go/0GDpvHY26--?m=) as an example

## Overview

The p2d2 Spatial Data Infrastructure is a standards-compliant, scalable SDI solution for capturing, managing, and delivering cemetery data in municipalities. The architecture follows the principles of [GDI-DE (Spatial Data Infrastructure Germany)](https://www.gdi-de.org/) and relies on open standards from the [Open Geospatial Consortium (OGC)](https://www.ogc.org/standards).

## Definition of Spatial Data Infrastructure

According to the German Geodata Access Act (GeoZG), a spatial data infrastructure is:

> "An infrastructure consisting of geodata, metadata, and geodata services, network services and technologies, agreements on shared use, access, and use, as well as coordination and monitoring mechanisms, processes, and procedures, with the aim of making geodata from various sources interoperably available."

## Architecture Components

### 1. Data Storage (Storage Layer)

**PostgreSQL/PostGIS Database**

  - **Purpose:** Persistent storage of all spatial data
  - **Technology:** PostgreSQL 15+ with PostGIS 3.4+ Extension
  - **Data Model:** Container concept (uniform schema for Cemetery, Grave plots, administrative boundaries)
  - **Coordinate Systems:** EPSG:25832 (primary), EPSG:3857, EPSG:4326

**GeoTIFF Raster Data**

  - **Purpose:** Georeferenced cemetery maps as background maps
  - **Format:** Cloud-Optimized GeoTIFF (COG), 8-Bit Grayscale
  - **Resolution:** ~0.02 m/pixel (native scan resolution)
  - **Pyramids:** 5 Overview-Levels with Nearest-Neighbor-Resampling
  - **Compression:** DEFLATE, Tiled (512×512px Blocks)
  - **Storage Location:** `/srv/geoserver/data/friedhofsplaene/`

### 2. Geodata Server (Service Layer)

**GeoServer 2.24+**

  - **Role:** OGC-compliant geodata server
  - **Services:**
      - WMS 1.3.0 (Web Map Service) - Map view
      - WFS 2.0.0 (Web Feature Service) - Vector geometries
      - WFS-T (Transactional) - Live editing (in development)
  - **Projections:** On-the-fly Reprojection between EPSG:25832, 3857, 4326
  - **Styling:** SLD 1.0 (Styled Layer Descriptor) for transparency and symbolization
  - **Endpoint:** `http://192.168.xxx.yyy:8080/geoserver/`
  - **Workspaces:**
      - `Verwaltungsdaten` (WFS Features: Cemeteries, Graves)
      - `friedhofsplaene` (WMS Raster: GeoTIFF Layers)

**GeoServer Configuration Highlights**

  - **Coverage Stores:** Individual GeoTIFFs or ImageMosaic for multi-cemetery support
  - **Default Interpolation:** Nearest Neighbor (critical for black-and-white plans)
  - **SLD Style:** `friedhofsplan_transparent` converts White → Transparent

### 3. Caching & Performance (Middleware Layer)

**MapProxy 1.16+**

  - **Role:** Tile caching, request aggregation, CORS proxy, OSM tile integration
  - **Cache Strategy:**
      - File-based cache under `/srv/mapproxy/cache_data/`
      - TMS (Tile Map Service) Directory-Layout
  - **Grids:**
      - `nrw_grid` (EPSG:25832, 20 Zoom-Levels, √2-factor)
      - `friedhofsplan_grid_utm32` (High-Resolution, 9 Levels, 4.0 → 0.0078 m/px)
      - `osm_grid` (EPSG:3857, Web Mercator for OSM tiles)
  - **Resampling:** Nearest Neighbor (consistent with GeoServer)
  - **Endpoint:** `https://ows.data-dna.eu/`
  - **Services:** WMS, WMTS, TMS

#### OSM Tileserver Integration

**Status:** Infrastructure provisioned, not yet in production

MapProxy serves as a proxy/cache layer for a local OSM tileserver to relieve public OSM servers in the long term:

**Current State:**

  - **Upstream:** OSM community tiles (`tile.openstreetmap.org`) via MapProxy pass-through
  - **Local Tileserver:** Set up (mod_tile + Mapnik + OSM database), but not activated
  - **Endpoint:** `http://192.168.xxx.yyy:8080/tile/%(z)s/%(x)s/%(y)s.png` (internal)

**MapProxy Configuration (current):**

```
sources:
  osm_source:
    type: tile
    grid: osm_grid
    url: http://192.168.xxx.yyy:8080/tile/%(z)s/%(x)s/%(y)s.png  # Local tileserver (prepared)
    # url: http://a.tile.openstreetmap.org/%(z)s/%(x)s/%(y)s.png  # Fallback to OSM
    http:
      headers:
        User-Agent: "p2d2-MapProxy/1.0"

grids:
  osm_grid:
    srs: 'EPSG:3857'
    bbox: [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
    origin: 'nw'
```

**Planned Migration:**

1.  **Phase 1 (current):** OSM community tiles + local MapProxy caching

      - Advantage: Reduced load on OSM through MapProxy cache
      - Disadvantage: Initial requests still go to OSM

2.  **Phase 2 (planned):** Local tileserver in production

      - **Stack:** PostgreSQL/PostGIS + osm2pgsql + Mapnik + mod_tile
      - **Data:** OSM extract for NRW (~5 GB PBF, weekly update)
      - **Seeding:** Pre-caching for Cologne/NRW up to zoom level 16
      - **Advantage:** Complete independence, no load on OSM community

3.  **Phase 3 (future):** Custom OSM styles

      - Customized map stylings for cemetery context
      - Highlighting of Points of Interest (cemeteries, public buildings)

**Motivation:**
The use of public OSM tile servers is only intended for light to moderate use according to the [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). For production applications with many users, the OSM community recommends operating one's own tileserver or using commercial providers. With the local infrastructure, we follow this best practice and sustainably relieve community resources.

**Technical Details (Local Tileserver):**

  - **Software:** mod_tile + renderd + Mapnik
  - **Database:** PostgreSQL 15 + PostGIS 3.4 with OSM schema
  - **Storage Requirement:** ~50 GB for NRW database, ~200 GB for tile cache
  - **Update Strategy:** osmosis for daily diff updates
  - **Documentation:** See `docs/OSM-TILESERVER.md` (in preparation)

**MapProxy Configuration for Cemetery Plans:**

```
sources:
  friedhofsplan_rheinkassel_wms:
    type: wms
    req:
      url: http://192.168.xxx.yyy:8080/geoserver/wms
      layers: friedhofsplaene:rheinkassel_friedhof
      styles: friedhofsplan_transparent
    coverage:
      bbox: [355079.917, 5656115.018, 355310.314, 5656324.347]
      srs: 'EPSG:25832'

grids:
  friedhofsplan_grid_utm32:
    srs: 'EPSG:25832'
    bbox:
    res: [4.0, 2.0, 1.0, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625]
```

### 4. Frontend (Presentation Layer)

**Astro 4.x + OpenLayers 9.x**

  - **Map Library:** OpenLayers 9.1+ (modern WebGL rendering)
  - **Layer Types:**
      - `ImageWMS` for cemetery plans (aspect-ratio correct)
      - `TileWMS` for basemaps (aerial, OSM)
      - `VectorLayer` for WFS features (Cemetery polygons, grave plots)
  - **Coordinate System Handling:**
      - Dynamic CRS Switch (EPSG:3857 ↔ EPSG:25832)
      - Scale-preserving View-Transitions
      - UTM-Resolution arrays for correct zoom levels

**Layer Hierarchy (Z-Index)**

```
Z-Index 15: Labels (planned)
Z-Index 10: WFS Features (Cemetery polygons, grave plots)
Z-Index  5: Cemetery plan (ImageWMS)
Z-Index  1: Aerial (TileWMS)
Z-Index  0: Basemap (TileWMS)
```

**Frontend Configuration**

```
const friedhofsplanLayer = new ImageLayer({
  source: new ImageWMS({
    url: 'https://ows.data-dna.eu/service',
    params: {
      'LAYERS': 'friedhofsplan_rheinkassel',
      'FORMAT': 'image/png',
      'TRANSPARENT': true,
      'VERSION': '1.1.1',
    },
    projection: 'EPSG:25832',
    serverType: 'geoserver',
    ratio: 1.0, // No oversampling
  }),
  extent: [355079.917, 5656115.018, 355310.314, 5656324.347],
  zIndex: 5,
  opacity: 0.7,
  visible: true,
});
```

## Data Flow

### Map View (WMS)

```
Browser (OpenLayers)
  ↓ GetMap-Request (EPSG:25832, BBOX, WIDTH, HEIGHT)
MapProxy (ows.data-dna.eu)
  ↓ Cache-Lookup (Tile-Grid)
  ├─ Cache Hit → Return tile
  └─ Cache Miss → Forward to GeoServer
     GeoServer
       ↓ GeoTIFF Rendering (Nearest-Neighbor)
       ↓ SLD Styling (Transparency)
       └─ PNG Response
     MapProxy
       ↓ Tile-Cache (save)
       └─ Return tile
Browser
  └─ Display in Canvas
```

### Feature Query (WFS)

```
Browser (OpenLayers VectorLayer)
  ↓ GetFeature-Request (CQL_FILTER, outputFormat=json)
WFS-Proxy (/api/wfs-proxy)
  ↓ Basic-Auth-Injection
GeoServer WFS
  ↓ SQL Query to PostGIS
PostGIS
  └─ GeoJSON Response
Browser
  └─ VectorLayer Rendering
```

### Feature Editing (WFS-T, planned)

```
Browser (Draw/Modify-Interactions)
  ↓ WFS-T Transaction (XML)
GeoServer WFS-T
  ↓ INSERT/UPDATE/DELETE
PostGIS
  └─ Persist geometries
```

## Technical Specifications

### Coordinate Systems

| EPSG-Code | Name | Usage | Extent (Germany) |
|-----------|------|------------|---------------------|
| **25832** | ETRS89 / UTM Zone 32N | Primary (NRW, Cologne) | [277000, 5580000, 510000, 5820000] |
| **3857** | Web Mercator | Basemaps (OSM, Aerial) | Worldwide |
| **4326** | WGS 84 | Data import/export | [-180, -90, 180, 90] |

### OGC Standards

| Standard | Version | Usage | Endpoint |
|----------|---------|------------|----------|
| WMS | 1.3.0 | Map View (Raster) | `/geoserver/wms` |
| WFS | 2.0.0 | Feature Download | `/geoserver/ows` |
| WFS-T | 2.0.0 | Feature Editing | `/geoserver/ows` (planned) |
| WMTS | 1.0.0 | Tile Service | `/service?SERVICE=WMTS` |
| TMS | 1.0.0 | Tile Service (REST) | `/tiles/` |
| SLD | 1.0.0 | Map Styling | `/geoserver/styles/` |

### Performance Optimizations

1.  **GeoTIFF Optimization**

      - Cloud-Optimized Format (COG) for HTTP Range-Requests
      - Tiled Structure (512×512px) for fast partial reads
      - DEFLATE Compression (~60% space saving)
      - Overviews with Nearest-Neighbor (no quality loss)

2.  **MapProxy Caching**

      - Meta-Tiles (4×4) for reduced overhead
      - Seeding strategies for hotspots
      - Cache invalidation on data changes

3.  **Frontend Optimization**

      - ImageWMS instead of TileWMS (1 Request instead of 10-20)
      - Custom Resolution arrays for precise zoom levels
      - Layer-Interaction-Manager (Long-Press for Opacity)

## Security & Access Control

### Current Implementation

  - **Read-Only WFS:** Basic Authentication (temporary credentials)
  - **WMS:** Public Access (no auth required)
  - **MapProxy CORS:** Enabled for browser requests

### Planned (Issue #1)

  - **Anonymous GeoServer Access** for public geodata
  - **WFS-T Authentication** via OAuth2/OIDC
  - **Role-Based Access Control (RBAC)** for sensitive data

## Scalability & Extensions

### Current State

  - **1 Cemetery** (Rheinkassel, 230m×210m)
  - **1 GeoTIFF** (~11,000×10,000 pixels)

### Future Extensions

1.  **Multi-Cemetery Support**

      - GeoServer ImageMosaic for all Cologne cemeteries
      - Dynamic Extent [356000, 5644000, 362000, 5653000]
      - Automatic index generation

2.  **Additional Data Layers**

      - Gravestones (Point features)
      - Plantings (Polygon features)
      - Administrative boundaries (OSM import)

3.  **WFS-T Live Editing**

      - Browser-based geometry capturing
      - Conflict-Resolution for concurrent edits
      - Versioning & Rollback

## Deployment & Operations

### Infrastructure

  - **Virtualization:** Proxmox VE 8.x
  - **Network:** OPNsense Firewall
  - **CI/CD:** GitLab CI (Webhook-based)
  - **Monitoring:** Uptime-Checks, Log-Aggregation

### URLs

  - **Production:** `https://www.data-dna.eu`
  - **Development:** `https://dev.data-dna.eu`
  - **Operations:** `https://opn.data-dna.eu` (Feature-Editor)
  - **OWS-Endpoint:** `https://ows.data-dna.eu`

### Backup Strategy

  - **PostGIS:** Daily pg_dump (Full + Incrementals)
  - **GeoTIFFs:** Version control + Offsite-Backup
  - **GeoServer-Config:** Git repository

## Compliance & Standards

  - ✅ **GDI-DE-compliant:** Interoperability with German SDI systems (aspired)
  - ✅ **INSPIRE-compatible:** Metadata according to ISO 19115 (aspired)
  - ✅ **OGC Standards:** WMS, WFS, WMTS, SLD
  - ✅ **Open Source:** All components under OSI-approved licenses

## Resources

  - **GDI-DE Architecture:** [https://www.gdi-de.org/](https://www.gdi-de.org/)
  - **OGC Standards:** [https://www.ogc.org/standards](https://www.ogc.org/standards)
  - **GeoServer Docs:** [https://docs.geoserver.org/](https://docs.geoserver.org/)
  - **MapProxy Docs:** [https://mapproxy.org/docs/](https://mapproxy.org/docs/)
  - **OpenLayers API:** [https://openlayers.org/](https://openlayers.org/)
  - **OSM Tile Usage Policy:** [https://operations.osmfoundation.org/policies/tiles/](https://operations.osmfoundation.org/policies/tiles/)
  - **MapProxy OSM Integration:** [https://wiki.openstreetmap.org/wiki/MapProxy](https://wiki.openstreetmap.org/wiki/MapProxy)

-----

**Version:** 1.0.0 (October 2025)
**Maintainer:** p2d2 Team
**License:** MIT (Code), ODbL (Data)

This complete documentation can be saved directly as `docs/GDI-ARCHITEKTUR.md` in the repository and contains all URLs as inline links instead of footnotes.

## [1](https://www.markdownguide.org/extended-syntax/) [2](https://www.markdownguide.org/basic-syntax/) [3](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) [4](https://www.jetbrains.com/help/hub/markdown-syntax.html) [5](https://www.codecademy.com/resources/docs/markdown/code-blocks) [6](https://learn.microsoft.com/en-us/azure/devops/project/wiki/markdown-guidance?view=azure-devops) [7](https://confluence.atlassian.com/spaces/Bitbucket