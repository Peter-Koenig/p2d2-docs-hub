---
title: Zitadel Build Container
description: Dedicated build environment for Zitadel IAM from source code
quality:
  completeness: 90
  accuracy: 95
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-02-07
---

# LXC: Zitadel Build Container

## Overview

This container provides a dedicated build environment for [Zitadel](https://zitadel.com) - a modern Identity & Access Management (IAM) system. Since Zitadel v4.x migrated to an **Nx Monorepo** with a complex build system, a specialized build environment is necessary.

**Why a separate build container?**
- Zitadel v4 requires Go 1.24+, Node.js 22+, Protocol Buffers, and various build tools
- Build time: 5-15 minutes (depending on hardware)
- Parallel builds possible without impacting production systems
- Reproducible build environment for different Zitadel versions

## Container Information

```
Type: LXC (unprivileged recommended)
OS: Debian 13 (trixie)
Hostname: zitadel-build-lxc
CT ID: 201 (adjustable)
Status: stopped (only runs during builds)

Resources:
  RAM: 32 GB (for parallel builds)
  Disk: 25 GB (Go modules, Node modules, build artifacts)
  CPU: 8 Cores (for faster compilation)
  Swap: 4 GB
```

## Installed Software

### Go Toolchain
```
Version: Go 1.24 (from Debian package)
Installation: golang-1.24 (Debian repository)
GOPATH: /home/builder/go
GOROOT: /usr/lib/go-1.24

Go Tools:
  - buf: Protocol Buffers build tool
  - protoc-gen-go: Go proto plugin
  - protoc-gen-go-grpc: gRPC Go plugin
  - protoc-gen-grpc-gateway: gRPC-Gateway plugin
  - protoc-gen-openapiv2: OpenAPI generator
  - protoc-gen-validate: Proto validation
  - protoc-gen-connect-go: Connect-RPC plugin
  - protoc-gen-authoption: Custom Zitadel plugin
  - protoc-gen-zitadel: Custom Zitadel plugin
```

### Node.js Runtime
```
Version: Node.js v22.x LTS (via NodeSource)
Package Manager: pnpm 9.15.0
Reason: Zitadel v4 requires Node 22+, Debian only has 20.x

Node Build Tools:
  - Nx: Monorepo build system
  - Angular CLI: Console frontend
  - Next.js: Login frontend
  - Turbo: (optional, not used)
```

### Protocol Buffers
```
Version: protoc (from Debian package)
Installation: protobuf-compiler
Usage: gRPC API generation
```

### System Tools
```
Build Essentials:
  - gcc, g++, make
  - git, curl, wget
  - jq, unzip, tar

Development:
  - vim, htop
  - net-tools, dnsutils
```

## Build User

```
User: builder
Home: /home/builder
Shell: /bin/bash
Sudo: NOPASSWD for all commands

Directory Structure:
  /home/builder/
    ├── go/                    # Go modules & tools
    │   └── bin/               # Go binaries (buf, protoc-gen-*)
    ├── projects/
    │   └── zitadel/           # Git repo
    │       ├── .artifacts/    # Build output
    │       ├── console/       # Angular frontend
    │       ├── apps/login/    # Next.js login
    │       └── pkg/grpc/      # Generated proto files
    └── .cache/                # pnpm cache
```

## Zitadel Build Architecture

### Zitadel v4 Monorepo Structure

```
Zitadel Repository:
  - Framework: Nx Monorepo (nx.json)
  - Frontend: Angular (Console) + Next.js (Login)
  - Backend: Go 1.24+ with gRPC/Connect-RPC
  - Proto: Protocol Buffers for API

Build Dependencies:
  1. Proto generation (TypeScript + Go)
  2. Console build (Angular → internal/api/ui/console/static)
  3. Login build (Next.js → apps/login/.next/standalone)
  4. Asset router generation
  5. Statik embedding (Login v1 resources)
  6. Go binary compilation

Nx Build Targets:
  - @zitadel/proto:generate     → TypeScript proto files
  - @zitadel/console:build      → Console frontend
  - @zitadel/login:build        → Login frontend
  - @zitadel/api:generate-stubs → Go proto files
  - @zitadel/api:build          → Final binary
```

### Build Script: `/usr/local/bin/build-zitadel`

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
[[ ! -d "$WORKSPACE" ]] && error "Workspace not found: $WORKSPACE"

cd "$WORKSPACE"

log "========================================"
log "Building Zitadel"
log "========================================"
log "Version:    $VERSION"
log "Date:       $BUILD_DATE"
log "Commit:     $BUILD_COMMIT"
log "Output:     $BUILD_OUTPUT"
log "========================================"

# 1. Checkout version
log "[1/4] Checking out version $VERSION..."
git fetch --tags || true
git checkout "$VERSION" || error "Checkout failed"
BUILD_COMMIT=$(git rev-parse --short HEAD)

# 2. Dependencies
log "[2/4] Installing pnpm dependencies..."
pnpm install || error "pnpm install failed"

# 3. Build via Nx (does everything automatically!)
log "[3/4] Building via Nx (5-15 minutes)..."
npx nx run @zitadel/api:build || error "Nx build failed"

# 4. Prepare output
log "[4/4] Preparing build artifacts..."
mkdir -p "$BUILD_OUTPUT"
cp .artifacts/bin/linux/amd64/zitadel.local "$BUILD_OUTPUT/zitadel"
chmod +x "$BUILD_OUTPUT/zitadel"

# Build metadata
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

# Latest link
ln -sfn "$BUILD_OUTPUT" "/opt/builds/latest"

# Cleanup: Keep only last 5 builds
log "Cleaning up old builds (keeping last 5)..."
cd /opt/builds
ls -t | grep "^zitadel-v" | tail -n +6 | xargs -r rm -rf

log ""
log "========================================"
log "✓ Build successful!"
log "========================================"
log "Binary:     $BUILD_OUTPUT/zitadel"
log "Size:       $(du -h $BUILD_OUTPUT/zitadel | cut -f1)"
log "========================================"

# Version check
"$BUILD_OUTPUT/zitadel" -v
```

## Build Output

```
Directory Structure:
  /opt/builds/
    ├── zitadel-v4.10.1-2026-02-07T19:43:45Z/
    │   ├── zitadel                 # Binary (~80-120 MB)
    │   ├── zitadel.sha256          # Checksum
    │   └── BUILD_INFO.txt          # Metadata
    ├── zitadel-v4.11.0-2026-02-15T10:20:00Z/
    │   └── ...
    └── latest -> zitadel-v4.11.0-2026-02-15T10:20:00Z/

Binary Info:
  - Statically linked (CGO_ENABLED=0)
  - Platform: linux/amd64
  - Contains: Console, Login, gRPC API
  - Go Embedded: All assets embedded
```

## Usage

### Execute Build

```bash
# Login to container
pct enter 201

# Switch to builder user
su - builder

# Start build (takes 5-15 minutes)
build-zitadel v4.10.1

# Check output
ls -lh /opt/builds/latest/
/opt/builds/latest/zitadel -v
```

### Build New Zitadel Version

```bash
# List available versions
cd ~/projects/zitadel
git fetch --tags
git tag | grep '^v4' | tail -10

# Build new version
build-zitadel v4.11.0
```

### Deploy Binary

```bash
# As root on Proxmox host
# Deploy to iam-LXC (ID: 101)

# 1. Copy binary
pct push 101 /var/lib/vz/snippets/zitadel /usr/local/bin/zitadel

# 2. Or via scp
scp /opt/builds/latest/zitadel root@10.0.1.101:/usr/local/bin/

# 3. Restart service
pct exec 101 -- systemctl restart zitadel

# 4. Verify
pct exec 101 -- zitadel -v
```

## Network Configuration

```
IP Address: 10.0.1.201 (static, adjustable)
Gateway: 10.0.1.1
DNS: 9.9.9.9 (Quad9)

Outbound Connections:
  - GitHub/GitLab: git clone, pnpm install
  - NodeSource: Node.js packages
  - pkg.go.dev: Go modules
  - registry.npmjs.org: npm packages

No inbound ports (build-only container)
```

## Troubleshooting

### Build Fails: Proto Generation

```bash
# Check if buf works
which buf
buf --version

# Check protoc plugins
ls -la ~/go/bin/protoc-gen-*

# Reinstall plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Custom Zitadel plugins
cd ~/projects/zitadel
go install ./internal/protoc/protoc-gen-authoption
go install ./internal/protoc/protoc-gen-zitadel
```

### Build Fails: Console/Login

```bash
# Check Node.js version (must be 22+)
node --version

# Check pnpm
pnpm --version

# Reinstall dependencies
cd ~/projects/zitadel
rm -rf node_modules
pnpm install --force

# Clear cache
rm -rf ~/.cache/pnpm
pnpm store prune
```

### Build Fails: Go Compilation

```bash
# Check Go version (must be 1.24+)
go version

# Check if proto files were generated
find pkg/grpc -name "*.pb.go" | wc -l
# Should be ~190 files

# Check if OpenAPI files were copied
ls -la openapi/v2/zitadel/ | wc -l
# Should be ~80 files

# Manually trigger proto generation
npx nx run @zitadel/api:generate-stubs
```

### Permission Issues

```bash
# All files as builder user
sudo chown -R builder:builder /home/builder/

# Go tools permissions
chmod +x ~/go/bin/*

# Build output permissions
sudo chown -R builder:builder /opt/builds/
```

### Disk Space Issues

```bash
# Check disk space
df -h

# Clear Go module cache
go clean -modcache

# Clear pnpm cache
pnpm store prune

# Delete old builds
rm -rf /opt/builds/zitadel-v4.9.*

# Clear Nx cache
cd ~/projects/zitadel
rm -rf .nx/cache
```

## Performance Optimization

### Reduce Build Time

```bash
# Parallel builds (Nx does this automatically)
# More CPUs = faster

# Use Nx cache (enabled by default)
# Repeated builds use caches

# Use pnpm store (global)
pnpm config set store-dir ~/.cache/pnpm

# Use Go build cache
export GOCACHE=$HOME/.cache/go-build
```

### RAM Optimization

```bash
# For < 32 GB RAM: Increase swap
# On Proxmox host:
pct set 201 --swap 8192

# Limit Go GOMAXPROCS
export GOMAXPROCS=4

# Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
```

Build Artifacts:
  - /opt/builds/ is NOT backed up
  - Binaries are reproducible via Git tags
  - If needed: Copy artifacts to NAS

Git Repository:
  - No backups needed (GitHub/GitLab)
  - For local changes: git push
```

## Security Configuration

```
User Isolation:
  - Unprivileged LXC
  - Dedicated user: builder
  - Sudo: Only for package installation

Network:
  - No exposed ports
  - Only outbound connections
  - No direct internet access via firewall

Build Isolation:
  - No production credentials
  - Separate containers for build/runtime
  - Binaries deployed externally
```

## Best Practices

✅ **Do**:
- Regular updates of Go, Node.js, pnpm
- Delete old build artifacts (> 30 days)
- Use Nx cache for faster rebuilds
- Stop container after build (saves RAM)
- Use Git tags for reproducible builds

❌ **Don't**:
- Store production credentials in build container
- Deploy builds directly to production (without testing)
- Use old Go/Node versions
- Deploy without checksums
- Use root user for builds

### Deployment Script (optional)

```bash
#!/bin/bash
# /usr/local/bin/deploy-zitadel.sh
# Run on Proxmox host

BUILD_CT=201
IAM_CT=101
VERSION=${1:-latest}

echo "Deploying Zitadel from CT $BUILD_CT to CT $IAM_CT"

# Get binary from build CT
pct exec $BUILD_CT -- cat /opt/builds/$VERSION/zitadel > /tmp/zitadel
pct exec $BUILD_CT -- cat /opt/builds/$VERSION/zitadel.sha256 > /tmp/zitadel.sha256

# Verify checksum
cd /tmp && sha256sum -c zitadel.sha256 || exit 1

# Deploy to IAM CT
pct push $IAM_CT /tmp/zitadel /usr/local/bin/zitadel
pct exec $IAM_CT -- chmod +x /usr/local/bin/zitadel

# Restart service
pct exec $IAM_CT -- systemctl restart zitadel

# Verify
pct exec $IAM_CT -- zitadel -v

echo "Deployment completed!"
```

## Monitoring

```bash
# Check build status
pct exec 201 -- su - builder -c 'tail -f /home/builder/projects/zitadel/.nx/cache/*/outputs/*'

# System resources during build
pct exec 201 -- htop

# Disk usage
pct exec 201 -- df -h

# Memory usage
pct exec 201 -- free -h
```

## References

- [Zitadel GitHub Repository](https://github.com/zitadel/zitadel)
- [Zitadel Documentation](https://zitadel.com/docs)
- [Nx Monorepo Documentation](https://nx.dev/)
- [Go Documentation](https://go.dev/doc/)
- [Protocol Buffers](https://protobuf.dev/)
- [Node.js Best Practices](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)

## Lessons Learned (2026-02-07)

**Problem:** Zitadel v4 build system is completely undocumented for self-hosting outside Docker.

**Solution:** 
1. Analyzed Nx monorepo system (`apps/api/project.json`)
2. Discovered: `npx nx run @zitadel/api:build` does everything automatically
3. All manual proto/asset/statik steps are defined in Nx targets

```bash
#!/usr/bin/env bash
#
# Proxmox LXC Setup für Zitadel Build-Umgebung (p2d2-Projekt)
# Autor: Peter König
# Datum: 2026-02-07
# Beschreibung: Erstellt dedizierte Build-Umgebung für Zitadel aus Quellen
#               NUR mit Debian-Paketen (außer Node.js 22)

set -euo pipefail

################################################################################
# KONFIGURATION
################################################################################

# Proxmox LXC-Einstellungen
CT_ID=201
CT_NAME="zitadel-build"
CT_HOSTNAME="zitadel-build-lxc"
CT_STORAGE="VMs-Containers"

# Hardware-Ressourcen
CT_CORES=10
CT_MEMORY=32768         # MB (32 GB)
CT_SWAP=4096            # MB
CT_DISK_SIZE=25         # GB
CT_ROOTFS_SIZE="150G"

# Netzwerk-Konfiguration
CT_BRIDGE="vmbr1"
CT_IP="192.168.122.201"
CT_GATEWAY="192.168.122.1"
CT_NETMASK="24"
CT_NAMESERVER="9.9.9.9"  # Quad9

# LXC-Image (Debian 13 Trixie)
CT_TEMPLATE="local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst"

# Security-Einstellungen
CT_UNPRIVILEGED=1
CT_FEATURES="nesting=1,keyctl=1"

# SSH-Einstellungen
CT_SSH_PUBKEY="/root/.ssh/authorized_keys"

# Build-Tool-Versionen
# Go: Aus Debian-Paket (1.24)
# Node.js: 22.x via NodeSource (Zitadel braucht 22+)
NODE_MAJOR="22"
PNPM_VERSION="9.15.0"

# Zitadel-Repo
ZITADEL_REPO="https://github.com/zitadel/zitadel.git"
ZITADEL_BUILD_VERSION="v4.10.1"  # Aktuelle Version

# Build-Output-Directory
BUILD_OUTPUT_DIR="/opt/builds"
BUILD_USER="builder"

# Backup
BACKUP_ENABLED=0
BACKUP_STORAGE="pbs-backup"

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
        --description "Zitadel Build Environment - Debian 13 with Go/Node/Protobuf"
    
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
# SYSTEM-SETUP
################################################################################

setup_system() {
    log "Starte Container..."
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
        
        # Home-Setup
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
# BUF & GO TOOLS
################################################################################

install_go_tools() {
    log "Installiere Go-Build-Tools (buf, goreleaser, etc.)..."
    
    pct exec "$CT_ID" -- bash -c "
        set -e
        source /etc/profile.d/go.sh
        
        # buf (für Protocol Buffers)
        go install github.com/bufbuild/buf/cmd/buf@latest
        
        # goreleaser
        go install github.com/goreleaser/goreleaser/v2@latest
        
        # go-bindata (für Asset-Embedding)
        go install github.com/go-bindata/go-bindata/...@latest
        
        # goimports
        go install golang.org/x/tools/cmd/goimports@latest
        
        # golangci-lint (via Script)
        curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh \
            | sh -s -- -b /usr/local/bin
        
        # Symlinks für globalen Zugriff
        ln -sf /root/go/bin/buf /usr/local/bin/buf || true
        ln -sf /root/go/bin/goreleaser /usr/local/bin/goreleaser || true
        ln -sf /root/go/bin/go-bindata /usr/local/bin/go-bindata || true
        ln -sf /root/go/bin/goimports /usr/local/bin/goimports || true
        
        # Verify (mit vollem Pfad, da PATH eventuell noch nicht aktualisiert)
        /usr/local/bin/buf --version
        /usr/local/bin/goreleaser --version
        /usr/local/bin/golangci-lint --version
    "
    
    log "Go-Build-Tools installiert"
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
        
        # Build-Info
        git log -1 --format='Commit: %H%nDate: %ci%nAuthor: %an' > BUILD_INFO.txt
        echo 'Built by: $BUILD_USER@$CT_HOSTNAME' >> BUILD_INFO.txt
        
        ls -lah
    "
    
    log "Zitadel-Repository gecloned nach /home/$BUILD_USER/projects/zitadel"
}

################################################################################
# BUILD-SCRIPT
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

# Environment
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

# Checkout Version
log \"[1/5] Checking out version \$VERSION...\"
git fetch --tags || true
git checkout \"\$VERSION\" || error \"Checkout failed for version \$VERSION\"
BUILD_COMMIT=\$(git rev-parse --short HEAD)

# Dependencies
log \"[2/5] Installing pnpm dependencies...\"
pnpm install || error \"pnpm install failed\"

# Build mit Version-Injection via Nx
log \"[3/5] Building via Nx (this may take 5-10 minutes)...\"
log \"       - Generating Proto files (TypeScript + Go)\"
log \"       - Building Console frontend\"
log \"       - Building Login frontend\"
log \"       - Generating asset routes\"
log \"       - Embedding static files\"
log \"       - Compiling Go binary\"

# Nx build mit ldflags für Version/Date
CGO_ENABLED=0 go build \\
    -o .artifacts/bin/linux/amd64/zitadel.local \\
    -ldflags=\"-s -w \\
        -X github.com/zitadel/zitadel/cmd/build.version=\$VERSION \\
        -X github.com/zitadel/zitadel/cmd/build.date=\$BUILD_DATE \\
        -X github.com/zitadel/zitadel/cmd/build.commit=\$BUILD_COMMIT\" \\
    || {
        log \"Go build failed, trying Nx build first...\"
        npx nx run @zitadel/api:build || error \"Nx build failed\"
        
        # Retry mit ldflags
        CGO_ENABLED=0 go build \\
            -o .artifacts/bin/linux/amd64/zitadel.local \\
            -ldflags=\"-s -w \\
                -X github.com/zitadel/zitadel/cmd/build.version=\$VERSION \\
                -X github.com/zitadel/zitadel/cmd/build.date=\$BUILD_DATE \\
                -X github.com/zitadel/zitadel/cmd/build.commit=\$BUILD_COMMIT\" \\
            || error \"Go build failed after Nx build\"
    }

# Output vorbereiten
log \"[4/5] Preparing build artifacts...\"
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
  1. Proto generation (buf + TypeScript)
  2. Console build (Angular)
  3. Login build (Next.js)
  4. Asset generation
  5. Statik embedding
  6. Go binary compilation

Binary Size: \$(du -h \$BUILD_OUTPUT/zitadel | cut -f1)
EOF

# Checksum
log \"[5/5] Creating checksum...\"
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
- **CPUs:** $CT_CORES / RAM: $(($CT_MEMORY / 1024))GB

## Installierte Tools (aus Debian-Paketen)
- **Go:** 1.24 (golang-1.24)
- **protoc:** $(protoc --version 2>/dev/null || echo 'unbekannt')
- **Node.js:** $(node --version 2>/dev/null || echo 'unbekannt') (via NodeSource)
- **pnpm:** $PNPM_VERSION

## Nutzung

### 1. Einloggen
\`\`\`bash
pct enter $CT_ID
\`\`\`

### 2. Als Build-User
\`\`\`bash
su - $BUILD_USER
\`\`\`

### 3. Bauen
\`\`\`bash
# Einfach
sudo build-zitadel v4.10.1

# Manuell
cd ~/projects/zitadel
source /etc/profile.d/go.sh
make build
\`\`\`

### 4. Binary finden
\`\`\`bash
ls -lh $BUILD_OUTPUT_DIR/latest/zitadel
\`\`\`

### 5. Deployen
\`\`\`bash
scp $BUILD_OUTPUT_DIR/latest/zitadel root@10.0.1.101:/usr/local/bin/
\`\`\`

## Neue Version bauen
\`\`\`bash
sudo build-zitadel v4.11.0
\`\`\`

## Troubleshooting

### Proto-Build schlägt fehl
\`\`\`bash
source /etc/profile.d/go.sh
go install github.com/bufbuild/buf/cmd/buf@latest
\`\`\`

### Console-Build schlägt fehl
\`\`\`bash
cd ~/projects/zitadel
rm -rf node_modules console/node_modules
pnpm install --force
\`\`\`

## Paketquellen
- Go: Debian 13 (golang-1.24)
- protoc: Debian 13 (protobuf-compiler)
- Node.js: NodeSource Repo (v22)
- Alle anderen: Go-Modules

EOF
    "
    
    log "README erstellt"
}

################################################################################
# VERIFICATION
################################################################################

verify_environment() {
    log "Verifiziere Build-Environment..."
    
    pct exec "$CT_ID" -- bash -c "
        source /etc/profile.d/go.sh
        
        echo '===== Environment Verification ====='
        echo 'Go:' && go version
        echo 'Node.js:' && node --version
        echo 'pnpm:' && pnpm --version
        echo 'protoc:' && protoc --version
        echo 'buf:' && buf --version
        echo '===== OK ====='
    "
}

################################################################################
# MAIN
################################################################################

main() {
    log "===== Zitadel Build Environment Setup ====="
    log "Container: $CT_NAME (ID: $CT_ID)"
    log "IP: $CT_IP"
    log "Resources: $CT_CORES Cores / $(($CT_MEMORY / 1024))GB RAM / ${CT_DISK_SIZE}GB SSD"
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
    log "===== Setup abgeschlossen! ====="
    log ""
    log "Container $CT_NAME bereit unter $CT_IP"
    log ""
    log "NÄCHSTE SCHRITTE:"
    log "1. Einloggen: pct enter $CT_ID"
    log "2. README: cat /root/BUILD_ENVIRONMENT_README.md"
    log "3. Bauen: build-zitadel $ZITADEL_BUILD_VERSION"
    log "4. Deployen zu iam-LXC (10.0.1.101)"
}

main "$@"
```
