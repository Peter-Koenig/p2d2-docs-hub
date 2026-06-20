---
title: Netzwerk, DNS und TLS für das CIVITAS/CORE-Plugin
description: Spezifikation der Netzwerkanbindung, Namensauflösung und Zertifikatsstrategie für die Plugin-VM
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-netzwerk
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Netzwerk, DNS und TLS

Dieses Dokument spezifiziert die Netzwerkanbindung, Namensauflösung, externe Erreichbarkeit und Zertifikatsstrategie für die CIVITAS/CORE-Plugin-VM.

## Netzsegment

Die Plugin-VM wird in ein bestehendes internes VLAN eingebunden. Die Zuordnung erfolgt nach folgender Priorität:

1. **Dediziertes Service-VLAN** (falls vorhanden und vom bestehenden p2d2-Netz trennbar)
2. **Gleiches VLAN wie die p2d2-Frontend-Komponenten** (bei fehlender Segmentierungsmöglichkeit)

Die IP-Adresse wird statisch aus dem jeweiligen Subnetz vergeben. DHCP ist nicht vorgesehen.

### Firewall-Regeln (OPNsense)

- Eingehender Traffic von p2d2-Komponenten (Frontend, GeoServer) auf den Plugin-Port (z. B. 443) wird freigegeben.
- Ausgehender Traffic der Plugin-VM ins Internet (für Updates, API-Zugriffe auf CIVITAS/CORE) wird über eine definierte Proxy-Regel oder direkt freigegeben.
- Administrativer Zugriff (SSH) erfolgt ausschließlich über das Management-VPN.

## Namensauflösung

Die Plugin-VM erhält einen internen DNS-Eintrag im Format:

```
civitas-core-plugin.int.data-dna.eu
```

Die Auflösung erfolgt über den internen DNS-Server (OPNsense oder separater Unbound-Container). Ein öffentlicher DNS-Eintrag ist in dieser Phase nicht vorgesehen.

## Externe Erreichbarkeit

Sofern das Plugin über eine API extern erreichbar sein muss (z. B. für Webhooks von CIVITAS/CORE), wird ein Reverse-Proxy-Eintrag in OPNsense (HAProxy oder Caddy) konfiguriert:

- Subdomain: `civitas-core-plugin.data-dna.eu`
- Ziel: `https://<interne-ip>:<port>`

Die Entscheidung über externe Erreichbarkeit wird mit der Plattformintegration getroffen.

## Reverse-Proxy-Anbindung

Die Anbindung an den bestehenden Reverse-Proxy erfolgt nach dem gleichen Muster wie die bestehenden p2d2-Dienste:

1. OPNsense terminiert eingehendes TLS (Port 443).
2. Der Request wird als HTTP an die interne IP der Plugin-VM weitergeleitet.
3. Die Plugin-VM antwortet auf dem konfigurierten Port.

Alternativ kann die TLS-Terminierung direkt in der Plugin-VM (z. B. durch den Kubernetes-Ingress-Controller) erfolgen. Dies ist eine offene Entscheidung.

## Zertifikatsstrategie

| Variante | Beschreibung | Status |
|----------|--------------|--------|
| **A** | TLS-Terminierung in OPNsense mit Let's Encrypt (Certbot/ACME) | Bevorzugt, da bestehende Infrastruktur genutzt wird |
| **B** | Eigenständiges Zertifikat in der Plugin-VM, ebenfalls Let's Encrypt | Erforderlich, wenn Ende-zu-Ende-TLS verlangt wird |
| **C** | Self-Signed-Zertifikat für interne Kommunikation | Nur für Test- und Entwicklungsphasen |

## Offene Entscheidungen

- Ist eine externe Erreichbarkeit des Plugins erforderlich?
- Erfolgt die TLS-Terminierung in OPNsense oder in der Plugin-VM?
- Wird ein separater DNS-Eintrag für die interne Kommunikation benötigt?

## Risiken

- Bei fehlender Netzsegmentierung kann die Plugin-VM potenziell auf alle internen Dienste zugreifen. Dies erfordert eine nachgelagerte Firewall-Regelung innerhalb des VLANs.
- Eine spätere Änderung der IP-Adresse oder des Netzsegments zieht Anpassungen in OPNsense, DNS und ggf. im Kubernetes-Cluster nach sich.
