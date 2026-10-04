---
title: SSH-Zugang zur VM
description: Installations-Key und VM_SSH_PUBKEY für den SSH-Zugang vom Proxmox-Host in die CIVITAS/CORE-VM.
status: draft
lastUpdated: 2026-10-04
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-ssh-zugang
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-umgebungsvariablen
quality:
  completeness: 80
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# SSH-Zugang zur VM

Dieses Dokument beschreibt, wie das Installationsskript den SSH-Zugang vom
Proxmox-Host in die CIVITAS/CORE-VM aufbaut.

## Befund (alt)

`01_config.sh` setzte `SSH_PUBKEY_PATH="${HOME}/.ssh/authorized_keys"`.
`00_provision_vm.sh` übergab diese Datei per `qm set --sshkeys` vollständig an
die VM. Das ist keine einzelne Public-Key-Datei, sondern die Liste aller
Schlüssel, die sich als root am Proxmox-Host anmelden dürfen. Auf PVE-Knoten ist
`/root/.ssh/authorized_keys` ein Symlink auf `/etc/pve/priv/authorized_keys`,
das im Cluster repliziert wird. Die VM vertraute damit allen Cluster-Knoten und
allen Admin-Keys. Die Variable ist entfernt.

## Konzept

Das Skript verwendet einen eigenen Installations-Key für die Verbindung vom Host
in die VM. Zusätzlich kann der Betreiber über `VM_SSH_PUBKEY` eigene öffentliche
Schlüssel für den direkten Login hinterlegen.

- Installations-Key: ed25519, ohne Passphrase, Kommentar `civitas-install-<VM_ID>`,
  Ablage unter `INSTALL_KEY_DIR` (Default `${HOME}/.local/share/civitas-install/<VM_ID>`).
  Verzeichnis-Rechte 700, Private-Key 600. Ein vorhandenes Paar wird wiederverwendet.
- `VM_SSH_PUBKEY` (optional): ein oder mehrere öffentliche Schlüssel, eine Zeile
  pro Key. Erlaubte Typen: `ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp256`,
  `ecdsa-sha2-nistp384`, `ecdsa-sha2-nistp521`, `sk-ssh-ed25519@openssh.com`,
  `sk-ecdsa-sha2-nistp256@openssh.com`. Abgelehnt werden private Schlüssel,
  Werte mit `CHANGEME` und Zeilen mit authorized_keys-Optionen (`command=`,
  `from=`). Leer- und `#`-Zeilen werden ignoriert.

## Zugangsregel

Mindestens `VM_SSH_PUBKEY` oder `ROOT_PASSWORD` muss gesetzt sein, sonst
bricht `init_ssh_access` vor jeder VM-Änderung ab. Der Installations-Key
zählt dabei nicht. `ROOT_PASSWORD` wirkt auf die Konsole der VM.

## Zwei Schlüsselarten

| Aspekt | Installations-Key | Admin-Schlüssel |
|---|---|---|
| Erzeuger | Skript auf dem Proxmox-Knoten | Administrator auf seiner Workstation |
| Ort des privaten Schlüssels | `INSTALL_KEY_DIR` auf dem Knoten | `~/.ssh/` auf der Workstation |
| Ort des öffentlichen Schlüssels | per `--sshkeys` in die VM injiziert | `VM_SSH_PUBKEY` in `${HOME}/.env-v1s.local` |
| Zweck | Host-Hop des Installers | direkter Login des Administrators |

## Admin-Schlüsselpaar erzeugen

Der Administrator erzeugt das Paar auf seiner Workstation:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/<schluesselname> -C "<kommentar>"
```

Der private Schlüssel bleibt unter `~/.ssh/` auf der Workstation. Er verlässt
sie nicht und steht nie in einer `.env`-Datei. Der öffentliche Schlüssel
(`<schluesselname>.pub`) wird in `VM_SSH_PUBKEY` eingetragen, eine Zeile pro
Schlüssel, in der Datei `${HOME}/.env-v1s.local` auf dem Proxmox-Knoten.
Mehrere Administratoren tragen mehrere Zeilen ein. Die erlaubten Schlüsseltypen
und die Ablehnungsregeln stehen oben im Abschnitt Konzept.

## Wirkung von `VM_SSH_PUBKEY`

`provision_vm` baut aus dem Installations-Pubkey und den Zeilen aus
`VM_SSH_PUBKEY` die `--sshkeys`-Datei für Cloud-Init. Der Eintrag wirkt bei der
Neuanlage der VM. Zur Wirkung bei einer bestehenden VM liegt kein Beleg vor.

## Ablauf in Phase -1 und im VM-Hop

`init_ssh_access` läuft im Host-Zweig des Installers vor `provision_vm` und ist
idempotent. Es validiert `VM_SSH_PUBKEY` vor jeder VM-Änderung. Mindestens
`VM_SSH_PUBKEY` oder `ROOT_PASSWORD` muss gesetzt sein, sonst bricht
`init_ssh_access` ab. Der Installations-Key zählt dabei nicht.

In `provision_vm` (Schritt 6) wird die `--sshkeys`-Datei temporär (0600) aus dem
Installations-Pubkey und den Zeilen aus `VM_SSH_PUBKEY` gebaut, per
`qm set --sshkeys` übergeben und danach gelöscht.

Alle `ssh`/`scp`-Aufrufe vom Host in die VM verwenden:

```text
-i <Installations-Key> -o IdentitiesOnly=yes -o BatchMode=yes
-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=${INSTALL_KEY_DIR}/known_hosts
```

## Host-Key-Prüfung

Bei einer frisch angelegten VM wird ein alter Eintrag der VM-IP aus der
`known_hosts`-Datei entfernt, damit `accept-new` den neuen Host-Key annimmt.
Ein geänderter Host-Key führt zu einem harten Fehler. Der Hinweis lautet dann:

```text
ssh-keygen -R <IP> -f <INSTALL_KEY_DIR>/known_hosts
```

## Altbestand-Migration

Kennt eine mit dem alten Verfahren angelegte VM den Installations-Key nicht,
versucht `ensure_vm_ssh_access` den Zugang über den bisherigen Weg (ohne
`-i`) und trägt den Installations-Pubkey einmalig in `~/.ssh/authorized_keys`
der VM nach. Dazu erscheint eine Warnung. Scheitern beide Wege, bricht der Lauf
mit einer Fehlermeldung ab.

## `VM_REMOVE_INSTALL_KEY`

`VM_REMOVE_INSTALL_KEY=true` entfernt am Ende des Host-Laufs die Zeile mit
`civitas-install-<VM_ID>` aus der `authorized_keys` der VM, aber nur, wenn
`VM_SSH_PUBKEY` gesetzt ist. Sonst bliebe kein SSH-Zugang.

Nicht verifiziert: ob `--sshkeys` nur beim ersten Boot greift und ob ein
späterer Neustart einen so entfernten Key wieder einträgt. Ein Live-Test auf
Proxmox steht aus.

## Zugang im Standalone-Betrieb

Port 8022 des Knotens von
[udp.projekte-koenig.eu](https://udp.projekte-koenig.eu/) führt per DNAT zu
Port 22 der VM. Verbindung:

```bash
ssh -p 8022 -i ~/.ssh/<schluesselname> root@udp.projekte-koenig.eu
```

Beispiel für `~/.ssh/config`:

```text
Host udp.projekte-koenig.eu
    HostName udp.projekte-koenig.eu
    Port 8022
    User root
    IdentityFile ~/.ssh/<schluesselname>
    IdentitiesOnly yes
```

Der Host-Key, den der Client unter `[udp.projekte-koenig.eu]:8022` speichert,
ist der Host-Key der VM, nicht der des Knotens. Der SSH-Dienst des Knotens
hört getrennt auf Port 22. Die Weiterleitung richtet der Administrator
manuell ein, siehe [Standalone](../netzwerk-topologie/standalone.md).

## Fehlerbilder

| Symptom | Ursache | Hinweis |
|---|---|---|
| Host-Key hat sich geändert | VM neu angelegt oder IP wiederverwendet | `ssh-keygen -R <IP> -f <known_hosts>` |
| Installations-Key unbekannt | Altbestand | wird automatisch nachgetragen |
| `VM_SSH_PUBKEY` ungültig | Platzhalter oder privater Schlüssel | Abbruch vor jeder VM-Änderung |
| `Permission denied (publickey)` | Der verwendete Schlüssel steht nicht in `VM_SSH_PUBKEY` | mit `-i` den richtigen Schlüssel angeben |

## Sicherheitshinweise

Der private Installations-Key liegt unter `INSTALL_KEY_DIR` und ist nur für root
lesbar (600). `VM_SSH_PUBKEY` ist kein Secret.
