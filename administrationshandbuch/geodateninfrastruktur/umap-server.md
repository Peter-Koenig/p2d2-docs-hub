# uMap-Server (geplant)

uMap ist eine einfache Anwendung zum Erstellen von Karten mit OpenStreetMap-Daten. Die Integration in p2d2 ist für zukünftige Versionen geplant.

## Warum uMap?

- **Einfache Bedienung**: Drag & Drop-Kartenerstellung
- **Einbettbar**: Karten können in Webseiten eingebettet werden
- **Kollaboration**: Gemeinsames Bearbeiten von Karten
- **Export**: GeoJSON, KML, GPX

## Geplante Features

### Community-Karten

Nutzer:innen können eigene thematische Karten erstellen:

- Lieblings-Friedhöfe
- Besondere Grabstätten
- Historische Bedeutung

### Daten-Export

Karten aus uMap können:

- Als GeoJSON exportiert werden
- In p2d2 importiert werden
- Mit OSM-Daten verglichen werden

## Architektur-Idee

```
┌─────────────┐
│   p2d2      │
│  Frontend   │
└──────┬──────┘
       │
       ├──────┐
       │      │
   ┌───▼──┐ ┌─▼──────┐
   │ uMap │ │PostGIS │
   └──────┘ └────────┘
```

## Installation (Entwurf)

```
# uMap-Container
docker run -d \
  --name umap \
  -p 8083:8000 \
  -e UMAP_DB_HOST=postgres \
  -e UMAP_DB_NAME=umap \
  -e UMAP_SETTINGS=/etc/umap/umap.conf \
  yohanboniface/umap
```

## Nächste Schritte

- [ ] Anforderungsanalyse
- [ ] Architektur-Design
- [ ] Prototyp
- [ ] Integration in p2d2
- [ ] User-Testing

::: info Status
uMap-Integration ist für Release v2.0 geplant.
:::
