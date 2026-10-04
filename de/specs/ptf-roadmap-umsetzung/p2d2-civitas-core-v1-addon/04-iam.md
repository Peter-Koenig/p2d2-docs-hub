---
title: "p2d2-AddOn – IAM / Keycloak (04)"
description: Was das p2d2-AddOn-Installationsskript für die IAM-Komponente tut – Keycloak-OIDC-Client, Client-Rollen, Rollen-Token-Mapper, OSM-IdP-Broker, Demo-Accounts, Rückbau und bekannte Fallstricke
quality:
  completeness: 75
  accuracy: 85
  reviewed: false
  reviewer:
  reviewDate:
---

# 04 – IAM / Keycloak

Modul `addon_25_iam.sh`, Funktionen `install_addon_iam` und `uninstall_addon_iam` mit den Teilfunktionen `ensure_p2d2_oidc_client`, `ensure_p2d2_client_roles`,
`ensure_p2d2_role_token_mapper` und `ensure_osm_identity_provider`.

## Was das Skript tut (Schritt für Schritt)

Das Modul provisioniert die p2d2-Integration **im bestehenden Keycloak** (Realm `cc-prd`), ohne neue Secrets anzulegen — es liest nur das vorhandene Admin-Secret.

1. **Admin-/Master-Token holen** (`_iam_get_token`): `admin-cli`-Password-Grant gegen `https://idm.<DOMAIN>/realms/master/protocol/openid-connect/token`; Credentials aus dem
   Secret `<env>-keycloak-admin` (Keys `MASTER_USERNAME`/`MASTER_PASSWORD`) im Access-Namespace (`ADDON_IAM_NS`, Default `cc-prd-access-stack`).
2. **OIDC-Client anlegen** (`ensure_p2d2_oidc_client`): confidential (`publicClient:false`), `standardFlowEnabled`, 5 Redirect-URIs (je Stage `www/dev/f-de1/f-de2/f-fv.${ADDON_DOMAIN}`)
   plus lokale Dev-Origin (`http://localhost:4321`). Post-Logout-Redirect-URIs werden mit `##` getrennt (nicht mit Leerzeichen — sonst Keycloak-400).
3. **6 Client-Rollen** (`ensure_p2d2_client_roles`): `editor`, `export_admin`, `qs1_reviewer`, `qs2_reviewer`, `osm`, `verwaltung`.
4. **Rollen-Token-Mapper** (`ensure_p2d2_role_token_mapper`): Mapper `client roles` (`oidc-usermodel-client-role-mapper`) schreibt `resource_access.<client_id>.roles` **auch in den
   ID-Token** (`id.token.claim=true`) — entscheidend, da der p2d2-Code ausschließlich das ID-Token dekodiert.
5. **OSM-IdP-Broker** (`ensure_osm_identity_provider`): generischer OAuth2-IdP (Alias `osm`) mit `P2D2_OSM_IDP_CLIENT_ID`/`_SECRET` aus `.env.p2d2-addon`; inkl. IdP-Mapper.
6. **6 Demo-Accounts** (`ADDON_IAM_DEMO_USERS`) mit Rollen-Grants (z. B. `hans` → `editor verwaltung`, `meera` → `osm qs1_reviewer`, `valentina` → `qs2_reviewer qs1_reviewer osm export_admin`).
7. **Rückbau:** entfernt Client, IdP und Demo-Accounts spiegelbildlich.

## Ausgangslage (vorausgesetzt)

- Keycloak (Realm `cc-prd`) läuft im Access-Namespace; das Admin-Secret `<env>-keycloak-admin` ist vorhanden.
- `.env.p2d2-addon` liefert `P2D2_OSM_IDP_CLIENT_ID`/`_SECRET` (und `P2D2_DEMO_PASSWORD` für die Demo-Accounts).

## Zielergebnis

Im Realm `cc-prd`: ein OIDC-Client mit 5 Redirect-URIs + lokaler Dev-Origin, 6 Client-Rollen, der Rollen-Token-Mapper (ID- + Access-Token), der OSM-IdP-Broker und 6 Demo-Accounts
mit Rollen. Die OIDC-Client-Daten werden dem Frontend über das Basis-Secret (`P2D2_BASE_OIDC_ISSUER`/`_CLIENT_ID`/`_CLIENT_SECRET`) bereitgestellt.

## Manuelle Installation / Troubleshooting

- Die IAM-Konfiguration ersetzt die frühere Zitadel-Anbindung durch **Keycloak** als einheitlichen Identity-Provider für alle Stages (ein Realm, ein OIDC-Client).
- Der Token-Mapper muss `id.token.claim=true` setzen, sonst fehlen die Rollen im ID-Token und der Login/Rollenabruf im Frontend schlägt fehl.
- Die Demo-Accounts dienen der QS (`qs1_reviewer`/`qs2_reviewer`) und den Rollen-Tests (`verwaltung`, `osm`, `export_admin`).

## Bekannte Fallstricke

- **Post-Logout-Redirect-URIs** müssen mit `##` (nicht Leerzeichen) getrennt werden — sonst validiert Keycloak den ganzen String als eine URI und liefert HTTP 400 (Turn 75).
- **`clientId`-Query-Filter** filtert je nach Keycloak-Version nicht zuverlässig → volle Client-Liste lesen und clientseitig filtern (`_iam_get_client_uid`).
- **Rollen nur im Access-Token** (Default) reichen nicht — der Mapper muss in den ID-Token schreiben.
- **Passwort-Policy:** Demo-Account-Passwörter müssen die Realm-Policy erfüllen (sonst 400).
- **Keycloak-Verständnis:** Wenn ein Keycloak-Objekt halb angelegt/zersetzt ist, ist ein Neuaufbau vom Scratch oft sicherer als Flickwerk (Turn 75).
