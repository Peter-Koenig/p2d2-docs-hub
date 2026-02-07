---
quality:
  completeness: 90
  accuracy: 95
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-02-07
---

# Zitadel Build Container (Proxmox LXC)

## Überblick

Dieser Container stellt eine dedizierte Build-Umgebung für [Zitadel](https://zitadel.com) bereit - ein modernes Identity & Access Management (IAM) System. Da Zitadel ab Version 4.x auf ein **Nx Monorepo** mit komplexem Build-System umgestellt hat, ist eine spezialisierte Build-Umgebung notwendig.

**Warum ein separater Build-Container?**
- Zitadel v4 benötigt Go 1.24+, Node.js 22+, Protocol Buffers, und diverse Build-Tools
- Build-Zeit: 5-15 Minuten (je nach Hardware)
- Parallele Builds möglich ohne Produktionssystem zu belasten
- Reproduzierbare Build-Umgebung für verschiedene Zitadel-Versionen

## Container-Informationen

```
Typ: LXC (unprivileged empfohlen)
OS: Debian 13 (trixie)
Hostname: zitadel-build-lxc
CT ID: 201 (anpassbar)
Status: stopped (läuft nur während Builds)

Ressourcen:
  RAM: 32 GB (für parallele Builds)
  Disk: 25 GB (Go-Modules, Node-Modules, Build-Artifacts)
  CPU: 8 Cores (für schnellere Kompilierung)
  Swap: 4 GB
```

## Installierte Software

### Go Toolchain
```
Version: Go 1.24 (aus Debian-Paket)
Installation: golang-1.24 (Debian Repository)
GOPATH: /home/builder/go
GOROOT: /usr/lib/go-1.24

Go-Tools:
  - buf: Protocol Buffers Build-Tool
  - protoc-gen-go: Go Proto-Plugin
  - protoc-gen-go-grpc: gRPC Go-Plugin
  - protoc-gen-grpc-gateway: gRPC-Gateway Plugin
  - protoc-gen-openapiv2: OpenAPI Generator
  - protoc-gen-validate: Proto Validation
  - protoc-gen-connect-go: Connect-RPC Plugin
  - protoc-gen-authoption: Custom Zitadel Plugin
  - protoc-gen-zitadel: Custom Zitadel Plugin
```

### Node.js Runtime
```
Version: Node.js v22.x LTS (via NodeSource)
Package Manager: pnpm 9.15.0
Grund: Zitadel v4 benötigt Node 22+, Debian hat nur 20.x

Node-Build-Tools:
  - Nx: Monorepo Build System
  - Angular CLI: Console Frontend
  - Next.js: Login Frontend
  - Turbo: (optional, nicht verwendet)
```

### Protocol Buffers
```
Version: protoc (aus Debian-Paket)
Installation: protobuf-compiler
Verwendung: gRPC API-Generierung
```

### System-Tools
```
Build-Essentials:
  - gcc, g++, make
  - git, curl, wget
  - jq, unzip, tar

Development:
  - vim, htop
  - net-tools, dnsutils
```

## Build-Benutzer

```
User: builder
Home: /home/builder
Shell: /bin/bash
Sudo: NOPASSWD für alle Commands

Verzeichnisstruktur:
  /home/builder/
    ├── go/                    # Go-Module & Tools
    │   └── bin/               # Go-Binaries (buf, protoc-gen-*)
    ├── projects/
    │   └── zitadel/           # Git-Repo
    │       ├── .artifacts/    # Build-Output
    │       ├── console/       # Angular Frontend
    │       ├── apps/login/    # Next.js Login
    │       └── pkg/grpc/      # Generierte Proto-Files
    └── .cache/                # pnpm Cache
```

## Zitadel Build-Architektur

### Zitadel v4 Monorepo-Struktur

```
Zitadel Repository:
  - Framework: Nx Monorepo (nx.json)
  - Frontend: Angular (Console) + Next.js (Login)
  - Backend: Go 1.24+ mit gRPC/Connect-RPC
  - Proto: Protocol Buffers für API

Build-Dependencies:
  1. Proto-Generierung (TypeScript + Go)
  2. Console Build (Angular → internal/api/ui/console/static)
  3. Login Build (Next.js → apps/login/.next/standalone)
  4. Asset-Router Generierung
  5. Statik-Embedding (Login v1 Resources)
  6. Go-Binary Kompilierung

Nx Build-Targets:
  - @zitadel/proto:generate     → TypeScript Proto-Files
  - @zitadel/console:build      → Console Frontend
  - @zitadel/login:build        → Login Frontend
  - @zitadel/api:generate-stubs → Go Proto-Files
  - @zitadel/api:build          → Finales Binary
```

### Build-Script: `/usr/local/bin/build-zitadel`

```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-v4.10.1}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
BUILD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
BUILD_OUTPUT="/opt/builds/zitadel-${VERSION}-${BUILD_DATE}"

log() { echo "[BUILD] $*"; }
error() { echo "[ERROR] $*" >&2; exit 1; }

# Environment
source /etc/profile.d/go.sh
export PATH=$PATH:$HOME/go/bin

WORKSPACE="/home/builder/projects/zitadel"
[[ ! -d "$WORKSPACE" ]] && error "Workspace nicht gefunden: $WORKSPACE"

cd "$WORKSPACE"

log "========================================"
log "Building Zitadel"
log "========================================"
log "Version:    $VERSION"
log "Date:       $BUILD_DATE"
log "Commit:     $BUILD_COMMIT"
log "Output:     $BUILD_OUTPUT"
log "========================================"

# 1. Checkout Version
log "[1/4] Checking out version $VERSION..."
git fetch --tags || true
git checkout "$VERSION" || error "Checkout failed"
BUILD_COMMIT=$(git rev-parse --short HEAD)

# 2. Dependencies
log "[2/4] Installing pnpm dependencies..."
pnpm install || error "pnpm install failed"

# 3. Build via Nx (macht alles automatisch!)
log "[3/4] Building via Nx (5-15 minutes)..."
npx nx run @zitadel/api:build || error "Nx build failed"

# 4. Output vorbereiten
log "[4/4] Preparing build artifacts..."
mkdir -p "$BUILD_OUTPUT"
cp .artifacts/bin/linux/amd64/zitadel.local "$BUILD_OUTPUT/zitadel"
chmod +x "$BUILD_OUTPUT/zitadel"

# Build-Metadaten
cat > "$BUILD_OUTPUT/BUILD_INFO.txt" <<EOF
Zitadel Build Information
=========================
Version:    $VERSION
Built:      $BUILD_DATE
Commit:     $BUILD_COMMIT
Builder:    $(whoami)@$(hostname)
Go:         $(go version)
Node:       $(node --version)
pnpm:       $(pnpm --version)

Binary Size: $(du -h $BUILD_OUTPUT/zitadel | cut -f1)
EOF

# Checksum
cd "$BUILD_OUTPUT"
sha256sum zitadel > zitadel.sha256

# Latest-Link
ln -sfn "$BUILD_OUTPUT" "/opt/builds/latest"

log ""
log "========================================"
log "✓ Build erfolgreich!"
log "========================================"
log "Binary:     $BUILD_OUTPUT/zitadel"
log "Size:       $(du -h $BUILD_OUTPUT/zitadel | cut -f1)"
log "========================================"

# Version check
"$BUILD_OUTPUT/zitadel" -v
```

## Build-Output

```
Verzeichnisstruktur:
  /opt/builds/
    ├── zitadel-v4.10.1-2026-02-07T19:43:45Z/
    │   ├── zitadel                 # Binary (~80-120 MB)
    │   ├── zitadel.sha256          # Checksum
    │   └── BUILD_INFO.txt          # Metadaten
    ├── zitadel-v4.11.0-2026-02-15T10:20:00Z/
    │   └── ...
    └── latest -> zitadel-v4.11.0-2026-02-15T10:20:00Z/

Binary-Info:
  - Statically linked (CGO_ENABLED=0)
  - Plattform: linux/amd64
  - Enthält: Console, Login, gRPC API
  - Go Embedded: Alle Assets sind embedded
```

## Verwendung

### Build ausführen

```bash
# Container einloggen
pct enter 201

# Als builder-User wechseln
su - builder

# Build starten (dauert 5-15 Minuten)
build-zitadel v4.10.1

# Output prüfen
ls -lh /opt/builds/latest/
/opt/builds/latest/zitadel -v
```

### Neue Zitadel-Version bauen

```bash
# Liste verfügbarer Versionen
cd ~/projects/zitadel
git fetch --tags
git tag | grep '^v4' | tail -10

# Neue Version bauen
build-zitadel v4.11.0
```

### Binary deployen

```bash
# Als root auf Proxmox-Host
# Zum iam-LXC (ID: 101) deployen

# 1. Binary kopieren
pct push 101 /var/lib/vz/snippets/zitadel /usr/local/bin/zitadel

# 2. Oder via scp
scp /opt/builds/latest/zitadel root@10.0.1.101:/usr/local/bin/

# 3. Service neu starten
pct exec 101 -- systemctl restart zitadel

# 4. Verify
pct exec 101 -- zitadel -v
```

## Netzwerk-Konfiguration

```
IP-Adresse: 10.0.1.201 (statisch, anpassbar)
Gateway: 10.0.1.1
DNS: 9.9.9.9 (Quad9)

Ausgehende Verbindungen:
  - GitHub/GitLab: git clone, pnpm install
  - NodeSource: Node.js Packages
  - pkg.go.dev: Go-Modules
  - registry.npmjs.org: npm Packages

Keine eingehenden Ports (Build-only Container)
```

## Troubleshooting

### Build schlägt fehl: Proto-Generation

```bash
# Prüfe ob buf funktioniert
which buf
buf --version

# Prüfe protoc-Plugins
ls -la ~/go/bin/protoc-gen-*

# Reinstall Plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Custom Zitadel-Plugins
cd ~/projects/zitadel
go install ./internal/protoc/protoc-gen-authoption
go install ./internal/protoc/protoc-gen-zitadel
```

### Build schlägt fehl: Console/Login

```bash
# Prüfe Node.js Version (muss 22+ sein)
node --version

# Prüfe pnpm
pnpm --version

# Reinstall Dependencies
cd ~/projects/zitadel
rm -rf node_modules
pnpm install --force

# Cache löschen
rm -rf ~/.cache/pnpm
pnpm store prune
```

### Build schlägt fehl: Go-Kompilierung

```bash
# Prüfe Go-Version (muss 1.24+ sein)
go version

# Prüfe ob Proto-Files generiert wurden
find pkg/grpc -name "*.pb.go" | wc -l
# Sollte ~190 Files sein

# Prüfe ob OpenAPI-Files kopiert wurden
ls -la openapi/v2/zitadel/ | wc -l
# Sollte ~80 Files sein

# Manually trigger proto generation
npx nx run @zitadel/api:generate-stubs
```

### Permission-Probleme

```bash
# Alle Dateien als builder-User
sudo chown -R builder:builder /home/builder/

# Go-Tools Permissions
chmod +x ~/go/bin/*

# Build-Output Permissions
sudo chown -R builder:builder /opt/builds/
```

### Disk-Space Issues

```bash
# Prüfe Speicherplatz
df -h

# Go-Module Cache löschen
go clean -modcache

# pnpm Cache löschen
pnpm store prune

# Alte Builds löschen
rm -rf /opt/builds/zitadel-v4.9.*

# Nx Cache löschen
cd ~/projects/zitadel
rm -rf .nx/cache
```

## Performance-Optimierung

### Build-Zeit reduzieren

```bash
# Parallele Builds (Nx macht das automatisch)
# Mehr CPUs = schneller

# Nx Cache nutzen (standardmäßig aktiviert)
# Bei wiederholten Builds werden Caches verwendet

# pnpm Store nutzen (global)
pnpm config set store-dir ~/.cache/pnpm

# Go Build-Cache nutzen
export GOCACHE=$HOME/.cache/go-build
```

### RAM-Optimierung

```bash
# Bei < 32 GB RAM: Swap erhöhen
# Auf Proxmox-Host:
pct set 201 --swap 8192

# Go GOMAXPROCS begrenzen
export GOMAXPROCS=4

# Node.js Memory Limit
export NODE_OPTIONS="--max-old-space-size=8192"
```


### Deployment-Script (optional)

```bash
#!/bin/bash
# /usr/local/bin/deploy-zitadel.sh
# Auf Proxmox-Host ausführen

BUILD_CT=201
IAM_CT=101
VERSION=${1:-latest}

echo "Deploying Zitadel from CT $BUILD_CT to CT $IAM_CT"

# Binary von Build-CT holen
pct exec $BUILD_CT -- cat /opt/builds/$VERSION/zitadel > /tmp/zitadel
pct exec $BUILD_CT -- cat /opt/builds/$VERSION/zitadel.sha256 > /tmp/zitadel.sha256

# Checksum verifizieren
cd /tmp && sha256sum -c zitadel.sha256 || exit 1

# Zu IAM-CT deployen
pct push $IAM_CT /tmp/zitadel /usr/local/bin/zitadel
pct exec $IAM_CT -- chmod +x /usr/local/bin/zitadel

# Service neu starten
pct exec $IAM_CT -- systemctl restart zitadel

# Verify
pct exec $IAM_CT -- zitadel -v

echo "Deployment completed!"
```

## Monitoring

```bash
# Build-Status prüfen
pct exec 201 -- su - builder -c 'tail -f /home/builder/projects/zitadel/.nx/cache/*/outputs/*'

# System-Ressourcen während Build
pct exec 201 -- htop

# Disk-Usage
pct exec 201 -- df -h

# Memory-Usage
pct exec 201 -- free -h
```

## Referenzen

- [Zitadel GitHub Repository](https://github.com/zitadel/zitadel)
- [Zitadel Dokumentation](https://zitadel.com/docs)
- [Nx Monorepo Dokumentation](https://nx.dev/)
- [Go Dokumentation](https://go.dev/doc/)
- [Protocol Buffers](https://protobuf.dev/)
- [Node.js Best Practices](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)

## Lessons Learned (2026-02-07)

**Problem:** Zitadel v4 Build-System ist komplett undokumentiert für Self-Hosting außerhalb Docker.

**Lösung:** 
1. Nx Monorepo-System analysiert (`apps/api/project.json`)
2. Erkannt: `npx nx run @zitadel/api:build` macht alles automatisch
3. Alle manuellen Proto/Asset/Statik-Steps sind in Nx-Targets definiert

**Key Insight:** Nicht versuchen, Zitadel manuell zu bauen - lass Nx die Orchestrierung machen!

**Build-Zeit:** ~8-12 Minuten auf 8-Core / 32GB RAM System
```

***

## 2. Setup-Script: `setup-zitadel-build-lxc.sh`

```bash
#!/usr/bin/env bash
#
# Proxmox LXC Setup für Zitadel Build-Umgebung (p2d2-Projekt)
# Autor: Perplexity & Peter König 
# Datum: 2026-02-07
# Version: 1.0
# Beschreibung: Erstellt dedizierte Build-Umgebung für Zitadel v4.x aus Quellcode
#               Verwendet NUR Debian-Pakete (außer Node.js 22 via NodeSource)
#
# Voraussetzungen:
#   - Proxmox VE 8.x
#   - Debian 13 Template verfügbar
#   - Internet-Zugriff für Package-Downloads
#   - Root-Rechte auf Proxmox-Host
#
# Verwendung:
#   chmod +x setup-zitadel-build-lxc.sh
#   ./setup-zitadel-build-lxc.sh

set -euo pipefail

################################################################################
# KONFIGURATION - Hier alle relevanten Größen anpassen
################################################################################

# Proxmox LXC-Einstellungen
CT_ID=201
CT_NAME="zitadel-build"
CT_HOSTNAME="zitadel-build-lxc"
CT_STORAGE="VMs-Containers"

# Hardware-Ressourcen
CT_CORES=8              # Mehr Cores für parallele Builds
CT_MEMORY=32768         # MB (32 GB für Node/Go-Builds)
CT_SWAP=4096            # MB (4 GB Swap)
CT_DISK_SIZE=150        # GB (Go-Modules, Node-Deps, Git-Repos, Build-Artifacts)

# Netzwerk-Konfiguration (ANPASSEN!)
CT_BRIDGE="vmbr0"
CT_IP="10.0.1.201"          # STATISCHE IP
CT_GATEWAY="10.0.1.1"       # Gateway
CT_NETMASK="24"
CT_NAMESERVER="9.9.9.9"     # Quad9

# LXC-Image (Debian 13 Trixie)
CT_TEMPLATE="local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst"

# Security-Einstellungen
CT_UNPRIVILEGED=1
CT_FEATURES="nesting=1,keyctl=1"  # nesting für Docker (optional), keyctl für Go-Builds

# SSH-Einstellungen
CT_SSH_PUBKEY="/root/.ssh/authorized_keys"

# Build-Tool-Versionen
# Go: Aus Debian-Paket (golang-1.24)
# Node.js: 22.x via NodeSource (Zitadel braucht 22+, Debian hat nur 20.x)
NODE_MAJOR="22"
PNPM_VERSION="9.15.0"

# Zitadel-Repo
ZITADEL_REPO="https://github.com/zitadel/zitadel.git"
ZITADEL_BUILD_VERSION="v4.10.1"  # Aktuelle stabile Version

# Build-Output-Directory
BUILD_OUTPUT_DIR="/opt/builds"
BUILD_USER="builder"             # Non-root Build-User

################################################################################
# HELPER FUNCTIONS
################################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[ERROR] $*" >&2
    exit 1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Dieses Script muss als root ausgeführt werden"
    fi
}

check_ct_exists() {
    if pct status "$CT_ID" &>/dev/null; then
        error "Container mit ID $CT_ID existiert bereits!"
    fi
}

check_template_exists() {
    local template_storage=$(echo "$CT_TEMPLATE" | sed 's/:.*//g')
    local template_file=$(basename "$CT_TEMPLATE")
    
    if ! pveam list "$template_storage" | grep -q "$template_file"; then
        log "Template nicht gefunden. Lade herunter..."
        pveam download "$template_storage" "$template_file"
    fi
}

################################################################################
# LXC CONTAINER ERSTELLEN
################################################################################

create_container() {
    log "Erstelle LXC-Container $CT_NAME (ID: $CT_ID)..."
    
    pct create "$CT_ID" "$CT_TEMPLATE" \
        --hostname "$CT_HOSTNAME" \
        --cores "$CT_CORES" \
        --memory "$CT_MEMORY" \
        --swap "$CT_SWAP" \
        --rootfs "$CT_STORAGE:$CT_DISK_SIZE" \
        --net0 name=eth0,bridge="$CT_BRIDGE",ip="${CT_IP}/${CT_NETMASK}",gw="$CT_GATEWAY" \
        --nameserver "$CT_NAMESERVER" \
        --unprivileged "$CT_UNPRIVILEGED" \
        --features "$CT_FEATURES" \
        --start 0 \
        --onboot 0 \
        --description "Zitadel Build Environment - Debian 13 with Go 1.24 / Node 22 / Nx"
    
    log "Container erfolgreich erstellt"
}

configure_ssh() {
    if [[ -f "$CT_SSH_PUBKEY" ]]; then
        log "Kopiere SSH-Key in Container..."
        pct push "$CT_ID" "$CT_SSH_PUBKEY" /root/.ssh/authorized_keys
        pct exec "$CT_ID" -- chmod 600 /root/.ssh/authorized_keys
        pct exec "$CT_ID" -- chmod 700 /root/.ssh
    else
        log "WARNUNG: SSH-Key nicht gefunden unter $CT_SSH_PUBKEY"
    fi
}

################################################################################
# SYSTEM-SETUP IM CONTAINER
################################################################################

setup_system() {
    log "Starte Container für initiales Setup..."
    pct start "$CT_ID"
    
    log "Warte auf Container-Boot..."
    sleep 5
    
    log "Konfiguriere Locales..."
    pct exec "$CT_ID" -- bash -c "
        set -e
        export DEBIAN_FRONTEND=noninteractive
        
        # Locales generieren
        echo 'de_DE.UTF-8 UTF-8' >> /etc/locale.gen
        echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen
        locale-gen
        update-locale LANG=de_DE.UTF-8
    "
    
    log "Update System und installiere Base-Packages..."
    pct exec "$CT_ID" -- bash -c "
        set -e
        export DEBIAN_FRONTEND=noninteractive
        
        # System-Update
        apt-get update
        apt-get upgrade -y
        
        # Essential Build-Tools (NUR Debian-Pakete!)
        apt-get install -y \
            build-essential \
            git \
            curl \
            wget \
            ca-certificates \
            gnupg \
            vim \
            htop \
            net-tools \
            dnsutils \
            jq \
            unzip \
            zip \
            tar \
            gzip \
            xz-utils \
            pkg-config \
            libssl-dev \
            zlib1g-dev \
            make \
            cmake \
            autoconf \
            automake \
            libtool \
            gettext \
            locate \
            sudo \
            locales
        
        # Cleanup
        apt-get autoremove -y
        apt-get clean
    "
    
    log "System-Setup abgeschlossen"
}

################################################################################
# BUILD-USER ERSTELLEN
################################################################################

create_build_user() {
    log "Erstelle Build-User: $BUILD_USER..."
    
    pct exec "$CT_ID" -- bash -c "
        set -e
        
        # User anlegen
        if ! id -u $BUILD_USER &>/dev/null; then
            useradd -m -s /bin/bash -G sudo $BUILD_USER
            
            # sudoers.d erstellen falls nicht existent
            mkdir -p /etc/sudoers.d
            echo '$BUILD_USER ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/$BUILD_USER
            chmod 440 /etc/sudoers.d/$BUILD_USER
        fi
        
        # Build-Verzeichnisse
        mkdir -p $BUILD_OUTPUT_DIR
        chown -R $BUILD_USER:$BUILD_USER $BUILD_OUTPUT_DIR
        
        # Home-Setup für builder
        su - $BUILD_USER -c '
            mkdir -p ~/.local/bin
            mkdir -p ~/projects
            mkdir -p ~/go
        '
    "
    
    log "Build-User erstellt: $BUILD_USER"
}

################################################################################
# GO INSTALLATION (aus Debian-Paket!)
################################################################################

install_go() {
    log "Installiere Go aus Debian-Paket (golang-1.24)..."
    
    pct exec "$CT_ID" -- bash -c "
        set -e
        export DEBIAN_FRONTEND=noninteractive
        
        # Go aus Debian installieren
        apt-get install -y golang-1.24 golang-go
        
        # Environment für alle User
        cat > /etc/profile.d/go.sh <<'EOF'
export GOROOT=/usr/lib/go-1.24
export GOPATH=\$HOME/go
export PATH=\$PATH:\$GOROOT/bin:\$GOPATH/bin
EOF
        chmod +x /etc/profile.d/go.sh
        
        # Verify
        /usr/lib/go-1.24/bin/go version
    "
    
    log "Go installiert: $(pct exec "$CT_ID" -- /usr/lib/go-1.24/bin/go version)"
}

################################################################################
# NODE.JS INSTALLATION (NodeSource für v22)
################################################################################

install_nodejs() {
    log "Installiere Node.js $NODE_MAJOR via NodeSource..."
    
    pct exec "$CT_ID" -- bash -c "
        set -e
        export DEBIAN_FRONTEND=noninteractive
        
        # NodeSource GPG-Key (offizieller Weg)
        curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
            | gpg --dearmor -o /usr/share/keyrings/nodesource.gpg
        
        # Repository hinzufügen
        echo \"deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main\" \
            > /etc/apt/sources.list.d/nodesource.list
        
        # Install
        apt-get update
        apt-get install -y nodejs
        
        # Verify
        node --version
        npm --version
        
        # pnpm installieren
        npm install -g pnpm@${PNPM_VERSION}
        pnpm --version
    "
    
    log "Node.js installiert: $(pct exec "$CT_ID" -- node --version)"
}

################################################################################
# PROTOCOL BUFFERS (aus Debian-Paket!)
################################################################################

install_protoc() {
    log "Installiere Protocol Buffers aus Debian-Paket..."
    
    pct exec "$CT_ID" -- bash -c "
        set -e
        export DEBIAN_FRONTEND=noninteractive
        
        # protoc aus Debian
        apt-get install -y protobuf-compiler
        
        # Verify
        protoc --version
    "
    
    log "protoc installiert: $(pct exec "$CT_ID" -- protoc --version)"
}

################################################################################
# GO BUILD-TOOLS & PROTOC-PLUGINS
################################################################################

install_go_tools() {
    log "Installiere Go-Build-Tools und protoc-Plugins..."
    
    pct exec "$CT_ID" -- su - "$BUILD_USER" -c "
        set -e
        source /etc/profile.d/go.sh
        
        # buf (Protocol Buffers Build-Tool)
        go install github.com/bufbuild/buf/cmd/buf@latest
        
        # goreleaser (für Release-Builds)
        go install github.com/goreleaser/goreleaser/v2@latest
        
        # go-bindata (für Asset-Embedding)
        go install github.com/go-bindata/go-bindata/...@latest
        
        # goimports (Code-Formatting)
        go install golang.org/x/tools/cmd/goimports@latest
        
        # golangci-lint (Linting)
        curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh \
            | sh -s -- -b \$HOME/go/bin
        
        # ===== PROTOC-PLUGINS FÜR ZITADEL =====
        go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
        go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
        go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
        go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
        go install github.com/envoyproxy/protoc-gen-validate@latest
        go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
        
        # Verify
        ls -la \$HOME/go/bin/ | grep -E '(buf|protoc-gen)' || true
    "
    
    log "Go-Build-Tools und protoc-Plugins installiert"
}

################################################################################
# ZITADEL REPOSITORY CLONEN
################################################################################

clone_zitadel_repo() {
    log "Clone Zitadel Repository (Version: $ZITADEL_BUILD_VERSION)..."
    
    pct exec "$CT_ID" -- su - "$BUILD_USER" -c "
        set -e
        source /etc/profile.d/go.sh
        
        cd ~/projects
        
        # Clone mit spezifischer Version
        if [[ '$ZITADEL_BUILD_VERSION' == 'main' ]]; then
            git clone --depth 1 $ZITADEL_REPO zitadel
        else
            git clone --branch $ZITADEL_BUILD_VERSION --depth 1 $ZITADEL_REPO zitadel
        fi
        
        cd zitadel
        
        # ===== CUSTOM ZITADEL PROTOC-PLUGINS INSTALLIEREN =====
        echo 'Installing custom Zitadel protoc-plugins...'
        go install ./internal/protoc/protoc-gen-authoption
        go install ./internal/protoc/protoc-gen-zitadel
        
        # Build-Info speichern
        git log -1 --format='Commit: %H%nDate: %ci%nAuthor: %an' > BUILD_INFO.txt
        echo 'Built by: $BUILD_USER@$CT_HOSTNAME' >> BUILD_INFO.txt
        
        ls -lah
    "
    
    log "Zitadel-Repository gecloned und Custom-Plugins installiert"
}

################################################################################
# BUILD-SCRIPT ERSTELLEN
################################################################################

create_build_script() {
    log "Erstelle Build-Script für Zitadel v4..."
    
    pct exec "$CT_ID" -- bash -c "
        cat > /usr/local/bin/build-zitadel <<'BUILDSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

VERSION=\${1:-v4.10.1}
BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ')
BUILD_COMMIT=\$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
BUILD_OUTPUT=\"/opt/builds/zitadel-\${VERSION}-\${BUILD_DATE}\"

log() { echo \"[BUILD] \$*\"; }
error() { echo \"[ERROR] \$*\" >&2; exit 1; }

# Environment laden
source /etc/profile.d/go.sh
export PATH=\$PATH:\$HOME/go/bin

WORKSPACE=\"/home/builder/projects/zitadel\"
[[ ! -d \"\$WORKSPACE\" ]] && error \"Workspace nicht gefunden: \$WORKSPACE\"

cd \"\$WORKSPACE\"

log \"========================================\"
log \"Building Zitadel\"
log \"========================================\"
log \"Version:    \$VERSION\"
log \"Date:       \$BUILD_DATE\"
log \"Commit:     \$BUILD_COMMIT\"
log \"Output:     \$BUILD_OUTPUT\"
log \"========================================\"

# 1. Checkout Version
log \"[1/4] Checking out version \$VERSION...\"
git fetch --tags || true
git checkout \"\$VERSION\" || error \"Checkout failed for version \$VERSION\"
BUILD_COMMIT=\$(git rev-parse --short HEAD)

# 2. Dependencies
log \"[2/4] Installing pnpm dependencies...\"
pnpm install || error \"pnpm install failed\"

# 3. Build mit Nx (macht alles automatisch!)
log \"[3/4] Building via Nx (this may take 5-15 minutes)...\"
log \"       - Generating Proto files (TypeScript + Go)\"
log \"       - Building Console frontend (Angular)\"
log \"       - Building Login frontend (Next.js)\"
log \"       - Generating asset routes\"
log \"       - Embedding static files\"
log \"       - Compiling Go binary\"

npx nx run @zitadel/api:build || error \"Nx build failed\"

# 4. Output vorbereiten
log \"[4/4] Preparing build artifacts...\"
mkdir -p \"\$BUILD_OUTPUT\"
cp .artifacts/bin/linux/amd64/zitadel.local \"\$BUILD_OUTPUT/zitadel\"
chmod +x \"\$BUILD_OUTPUT/zitadel\"

# Build-Metadaten
cat > \"\$BUILD_OUTPUT/BUILD_INFO.txt\" <<EOF
Zitadel Build Information
=========================
Version:    \$VERSION
Built:      \$BUILD_DATE
Commit:     \$BUILD_COMMIT
Builder:    \$(whoami)@\$(hostname)
Go:         \$(go version)
Node:       \$(node --version)
pnpm:       \$(pnpm --version)

Build Method: Nx Monorepo Build System
Build Steps:
  1. pnpm install
  2. nx run @zitadel/api:build (includes all sub-targets)

Binary Size: \$(du -h \$BUILD_OUTPUT/zitadel | cut -f1)
EOF

# Checksum
log \"Creating checksum...\"
cd \"\$BUILD_OUTPUT\"
sha256sum zitadel > zitadel.sha256

# Latest-Link
ln -sfn \"\$BUILD_OUTPUT\" \"/opt/builds/latest\"

log \"\"
log \"========================================\"
log \"✓ Build erfolgreich!\"
log \"========================================\"
log \"Binary:     \$BUILD_OUTPUT/zitadel\"
log \"Size:       \$(du -h \$BUILD_OUTPUT/zitadel | cut -f1)\"
log \"Checksum:   \$BUILD_OUTPUT/zitadel.sha256\"
log \"Latest:     /opt/builds/latest -> \$(basename \$BUILD_OUTPUT)\"
log \"========================================\"

# Version check
log \"\"
log \"Binary info:\"
\"\$BUILD_OUTPUT/zitadel\" -v || log \"⚠ Version check fehlgeschlagen\"

log \"\"
log \"Deployment-Anleitung:\"
log \"========================================\"
log \"# 1. Checksum verifizieren\"
log \"sha256sum -c \$BUILD_OUTPUT/zitadel.sha256\"
log \"\"
log \"# 2. Nach iam-LXC deployen (ID: 101)\"
log \"scp \$BUILD_OUTPUT/zitadel root@10.0.1.101:/usr/local/bin/\"
log \"\"
log \"# 3. Service neu starten\"
log \"ssh root@10.0.1.101 'systemctl restart zitadel'\"
log \"\"
log \"# 4. Status prüfen\"
log \"ssh root@10.0.1.101 'systemctl status zitadel'\"
log \"ssh root@10.0.1.101 'zitadel -v'\"
log \"========================================\"
BUILDSCRIPT

        chmod +x /usr/local/bin/build-zitadel
    "
    
    log "Build-Script erstellt: /usr/local/bin/build-zitadel"
}

################################################################################
# DOKUMENTATION
################################################################################

create_readme() {
    log "Erstelle Dokumentation..."
    
    pct exec "$CT_ID" -- bash -c "
        cat > /root/BUILD_ENVIRONMENT_README.md <<'EOF'
# Zitadel Build Environment für p2d2

## Container-Info
- **ID:** $CT_ID
- **Hostname:** $CT_HOSTNAME
- **IP:** $CT_IP
- **CPUs:** $CT_CORES / RAM: $(($CT_MEMORY / 1024))GB / Disk: ${CT_DISK_SIZE}GB

## Installierte Tools (aus Debian-Paketen)
- **Go:** 1.24 (golang-1.24)
- **protoc:** $(protoc --version 2>/dev/null || echo 'unbekannt')
- **Node.js:** $(node --version 2>/dev/null || echo 'unbekannt') (via NodeSource)
- **pnpm:** $PNPM_VERSION

## Verwendung

### 1. Einloggen
\`\`\`bash
pct enter $CT_ID
\`\`\`

### 2. Als Build-User wechseln
\`\`\`bash
su - $BUILD_USER
\`\`\`

### 3. Build starten
\`\`\`bash
# Einfach (dauert 5-15 Minuten)
build-zitadel v4.10.1

# Andere Version
build-zitadel v4.11.0
\`\`\`

### 4. Binary finden
\`\`\`bash
ls -lh $BUILD_OUTPUT_DIR/latest/zitadel
$BUILD_OUTPUT_DIR/latest/zitadel -v
\`\`\`

### 5. Nach iam-LXC deployen
\`\`\`bash
# Als root auf Proxmox-Host
scp $BUILD_OUTPUT_DIR/latest/zitadel root@10.0.1.101:/usr/local/bin/
pct exec 101 -- systemctl restart zitadel
pct exec 101 -- zitadel -v
\`\`\`

## Troubleshooting

### Build schlägt fehl
\`\`\`bash
# Logs prüfen
cd ~/projects/zitadel
npx nx run @zitadel/api:build --verbose

# Dependencies reinstall
rm -rf node_modules
pnpm install --force

# Cache löschen
rm -rf .nx/cache
rm -rf ~/.cache/pnpm
\`\`\`

### Proto-Generation Fehler
\`\`\`bash
# Protoc-Plugins prüfen
ls -la ~/go/bin/protoc-gen-*

# Reinstall
cd ~/projects/zitadel
go install ./internal/protoc/protoc-gen-authoption
go install ./internal/protoc/protoc-gen-zitadel
\`\`\`

### Disk-Space
\`\`\`bash
# Prüfen
df -h

# Aufräumen
go clean -modcache
pnpm store prune
rm -rf $BUILD_OUTPUT_DIR/zitadel-v4.9.*
\`\`\`

## Paketquellen
- Go: Debian 13 (golang-1.24)
- protoc: Debian 13 (protobuf-compiler)
- Node.js: NodeSource Repository (v22.x)
- protoc-Plugins: Go install (latest)

## Build-Architektur

Zitadel v4 nutzt **Nx Monorepo Build System**:

\`\`\`
npx nx run @zitadel/api:build
├─> @zitadel/proto:generate    (TypeScript Proto-Files)
├─> @zitadel/api:generate-stubs (Go Proto-Files + OpenAPI)
├─> @zitadel/api:generate-assets (Asset Router)
├─> @zitadel/api:generate-statik (Embed Login Resources)
├─> @zitadel/console:build      (Angular Frontend)
├─> @zitadel/login:build        (Next.js Frontend)
└─> Go-Binary kompilieren       (CGO_ENABLED=0)
\`\`\`

**Output:** `.artifacts/bin/linux/amd64/zitadel.local`

## Wichtige Pfade

\`\`\`
/home/builder/
├── go/                      # Go-Tools & Modules
│   └── bin/                 # buf, protoc-gen-*
├── projects/zitadel/        # Git-Repository
│   ├── .artifacts/          # Build-Output
│   ├── console/             # Angular Console
│   ├── apps/login/          # Next.js Login
│   └── pkg/grpc/            # Generated Proto-Files
└── .cache/                  # pnpm Cache

/opt/builds/                 # Build-Artifacts
├── zitadel-v4.10.1-.../
│   ├── zitadel
│   ├── zitadel.sha256
│   └── BUILD_INFO.txt
└── latest -> ...            # Symlink
\`\`\`

EOF
    "
    
    log "README erstellt: /root/BUILD_ENVIRONMENT_README.md"
}

################################################################################
# VERIFICATION
################################################################################

verify_environment() {
    log "Verifiziere Build-Environment..."
    
    pct exec "$CT_ID" -- bash -c "
        source /etc/profile.d/go.sh
        export PATH=\$PATH:/home/$BUILD_USER/go/bin
        
        echo '===== Environment Verification ====='
        echo 'Go:' && /usr/lib/go-1.24/bin/go version
        echo 'Node.js:' && node --version
        echo 'pnpm:' && pnpm --version
        echo 'protoc:' && protoc --version
        echo 'buf:' && su - $BUILD_USER -c 'buf --version' || echo 'Not in PATH yet (OK)'
        echo '===== Verification Complete ====='
    "
}

################################################################################
# MAIN
################################################################################

main() {
    log "=========================================="
    log "Zitadel Build Environment Setup"
    log "=========================================="
    log "Container: $CT_NAME (ID: $CT_ID)"
    log "IP: $CT_IP"
    log "Resources: $CT_CORES Cores / $(($CT_MEMORY / 1024))GB RAM / ${CT_DISK_SIZE}GB Disk"
    log "Go: Debian 1.24 | Node: v${NODE_MAJOR}.x"
    log "=========================================="
    log ""
    
    check_root
    check_ct_exists
    check_template_exists
    
    create_container
    setup_system
    configure_ssh
    create_build_user
    install_go
    install_nodejs
    install_protoc
    install_go_tools
    clone_zitadel_repo
    create_build_script
    create_readme
    verify_environment
    
    log ""
    log "=========================================="
    log "✓ Setup erfolgreich abgeschlossen!"
    log "=========================================="
    log ""
    log "Container $CT_NAME bereit unter $CT_IP"
    log ""
    log "NÄCHSTE SCHRITTE:"
    log "1. Einloggen:    pct enter $CT_ID"
    log "2. Als builder:  su - builder"
    log "3. README:       cat /root/BUILD_ENVIRONMENT_README.md"
    log "4. Build:        build-zitadel $ZITADEL_BUILD_VERSION"
    log ""
    log "Build-Zeit: ~5-15 Minuten (je nach Hardware)"
    log "Build-Output: $BUILD_OUTPUT_DIR/latest/"
    log ""
    log "Deployment:"
    log "  scp $BUILD_OUTPUT_DIR/latest/zitadel root@10.0.1.101:/usr/local/bin/"
    log "  pct exec 101 -- systemctl restart zitadel"
    log "=========================================="
}

main "$@"
```
