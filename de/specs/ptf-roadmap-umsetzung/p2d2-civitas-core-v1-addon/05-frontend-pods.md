---
title: "p2d2-AddOn – Frontend-Pods (05)"
description: Was das p2d2-AddOn-Installationsskript für die Frontend-Komponente tut – fünf Stage-Pods (Astro), Secrets, Stage-Manifeste, Ingress, Image-Builds, Rückbau und bekannte Fallstricke
quality:
  completeness: 80
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# 05 – Frontend-Pods (5 Stages)

Modul `addon_30_frontend.sh`, Funktionen `apply_addon_secrets`, `ensure_addon_frontend_ingress`, `install_addon_frontend_build`, `install_addon_frontend` und
`uninstall_addon_frontend`.

## Was das Skript tut (Schritt für Schritt)

Das Modul deployt das p2d2-Frontend (Astro SSR, node) als **fünf eigenständige, image-basierte Pods** — je einer pro Stage — inklusive Secrets, Manifesten und Ingress.

1. **Secrets befüllen** (`apply_addon_secrets`): aus `.env.p2d2-addon` werden atomar (nur bei Erstanlage) erzeugt:
   - das **Basis-Secret** `p2d2-base-secret` (`ALTCHA_HMAC_KEY`, `SMTP_PASS`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`) und
   - je Stage ein **Stage-Secret** (`p2d2-main-secret`, `p2d2-dev-secret`, `p2d2-f-de1-secret`, `p2d2-f-de2-secret`, `p2d2-f-fv-secret`) mit `DB_PASSWORD`, `WFST_PASSWORD`,
     `WFST_PW_<KEY>` und `SESSION_SECRET`. Leere/`CHANGEME`-Werte brechen fail-fast ab.
2. **Basis-ConfigMap** (`base.yaml`, `p2d2-base-config`) anwenden — nicht-sensible Werte (`DB_HOST`, `DB_PORT`, `DB_NAME`, `PUBLIC_WFST_ENDPOINT`, `PUBLIC_MAPSERVER_URL`,
   SMTP-Host/Port/User, …).
3. **Stage-Manifeste** (`stages/<stage>.yaml`) anwenden — je Stage ConfigMap + Deployment + Service (image-basiert, `node dist/server/entry.mjs`, Port 4321).
4. **Ingress je Stage** (`ensure_addon_frontend_ingress`): nginx-Ingress (Klasse `nginx`), `cert-manager`-Cluster-Issuer `letsencrypt-prod`, TLS-Secret `<host>-tls`,
   `ssl-redirect`; mit RBAC-Selbstprüfung (`can-i create ingresses`).
5. **Image-Builds** (`install_addon_frontend_build`): läuft **vor** `install_addon_frontend`; baut die fünf Runtime-Images auf dem k3s-Node über `frontend/build-stage.sh <stage>`
   und importiert sie in den containerd-Store (`IfNotPresent`).

**Stage-Mapping:**

| Stage | Deployment/Service | Host | `PUBLIC_SITE_URL` |
|---|---|---|---|
| main | `p2d2-main` | `www.${ADDON_DOMAIN}` | `https://www.udp.data-dna.eu` |
| dev | `p2d2-dev` | `dev.${ADDON_DOMAIN}` | `https://dev.udp.data-dna.eu` |
| de1 | `p2d2-f-de1` | `f-de1.${ADDON_DOMAIN}` | `https://f-de1.udp.data-dna.eu` |
| de2 | `p2d2-f-de2` | `f-de2.${ADDON_DOMAIN}` | `https://f-de2.udp.data-dna.eu` |
| fv | `p2d2-f-fv` | `f-fv.${ADDON_DOMAIN}` | `https://f-fv.udp.data-dna.eu` |

**Rückbau** (`uninstall_addon_frontend`): entfernt je Stage Deployment/Service/ConfigMap/Secret/Ingress/TLS-Secret/Alt-PVC, danach Basis-ConfigMap/-Secret, den
Webhook-Controller (Deployment/Service/SA/Role/RoleBinding), die `p2d2-*-builder`-Jobs und die Shared-Infra-Secrets `p2d2-builder-git-auth`/`p2d2-webhook-secrets`.

## Ausgangslage (vorausgesetzt)

- k3s-Cluster mit Docker/`k3s ctr` auf dem Node für den Image-Build (`build-stage.sh`).
- Die Module 00–25 sind abgeschlossen (DB-Schemata, GeoServer-Workspaces, MapProxy, Keycloak-OIDC-Client), da die Frontend-Secrets/-ConfigMap darauf verweisen.
- `.env.p2d2-addon` liefert die `P2D2_*`-Werte (inkl. `P2D2_GITHUB_TOKEN`/`P2D2_GITLAB_TOKEN` für den Build).

## Zielergebnis

Fünf laufende Frontend-Pods (je `1/1 ready`), je mit eigenem Ingress und Let's-Encrypt-TLS, unter den fünf Stage-URLs. Das `main`-Frontend dient als Produktivinstanz, `dev`/`de1`/`de2`/`fv`
als Entwicklungs-/Team-Stages.

## Manuelle Installation / Troubleshooting

- **Image-basierte Auslieferung** (statt früherem `node:20-slim` + PVC): das Image wird per `build-stage.sh <stage>` auf dem k3s-Node gebaut (`npm ci` + `npm run build:<stage>`) und per
  `k3s ctr -n k8s.io images import` importiert.
- **Einzel-Build:** `overlay_addon_V1s/k8s/frontend/build-stage.sh main|dev|de1|de2|fv` (Token aus `.env.p2d2-addon`).
- **Ingress manuell:** `kubectl apply` des von `ensure_addon_frontend_ingress` erzeugten Manifestes, falls die RBAC-Selbstprüfung greift.

## Bekannte Fallstricke

- **Fail-Fast ohne `ADDON_NS`/`ADDON_DOMAIN`:** das Modul bricht ab, wenn die Variablen nicht vom Hauptskript exportiert sind (verhindert Secret-Überschreibung im falschen Namespace, Turn 57).
- **Env-Vars-Pipeline:** `.env.p2d2-addon` ist die einzige Quelle der Wahrheit; Secrets werden nur bei Erstanlage geschrieben (kein Überschreiben bestehender Werte).
- **`WFST_PASSWORD`/`WFST_PW_<KEY>`** sind derselbe Wert (GeoServer-WFS-T-Passwort) — nur einmal pflegen (Turn 61).
- **Kubeconfig:** Default ist die VM-Standard-Kubeconfig (volle Rechte); die eingeschränkte sdt-Test-SA nur explizit via `KUBECONFIG=…` (Turn 70).
- **Image-Import-Namespace `k8s.io` ist zwingend** — sonst sieht das kubelet das Image nicht (`ImagePullBackOff`).
- **Clean Teardown:** der Rückbau entfernt auch Alt-PVCs/Webhook-Controller/Shared-Secrets, damit keine „Altlasten" bleiben (Turn 63/65).
