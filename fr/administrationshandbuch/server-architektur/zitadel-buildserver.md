---
title: Conteneur de Build Zitadel
description: Environnement de build dédié pour Zitadel IAM depuis le code source
quality:
  completeness: 90
  accuracy: 95
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-02-07
---

# LXC: Conteneur de Build Zitadel

## Aperçu

Ce conteneur fournit un environnement de build dédié pour [Zitadel](https://zitadel.com) - un système moderne de gestion des identités et des accès (IAM). Depuis que Zitadel v4.x a migré vers un **Nx Monorepo** avec un système de build complexe, un environnement de build spécialisé est nécessaire.

**Pourquoi un conteneur de build séparé ?**
- Zitadel v4 nécessite Go 1.24+, Node.js 22+, Protocol Buffers et divers outils de build
- Temps de build : 5-15 minutes (selon le matériel)
- Builds parallèles possibles sans impact sur les systèmes de production
- Environnement de build reproductible pour différentes versions de Zitadel

## Informations sur le Conteneur

```
Type: LXC (non privilégié recommandé)
OS: Debian 13 (trixie)
Hostname: zitadel-build-lxc
CT ID: 201 (ajustable)
Statut: arrêté (ne fonctionne que pendant les builds)

Ressources:
  RAM: 32 Go (pour les builds parallèles)
  Disque: 25 Go (modules Go, modules Node, artefacts de build)
  CPU: 8 Cores (pour une compilation plus rapide)
  Swap: 4 Go
```

## Logiciels Installés

### Chaîne d'Outils Go
```
Version: Go 1.24 (depuis le paquet Debian)
Installation: golang-1.24 (dépôt Debian)
GOPATH: /home/builder/go
GOROOT: /usr/lib/go-1.24

Outils Go:
  - buf: Outil de build Protocol Buffers
  - protoc-gen-go: Plugin proto Go
  - protoc-gen-go-grpc: Plugin gRPC Go
  - protoc-gen-grpc-gateway: Plugin gRPC-Gateway
  - protoc-gen-openapiv2: Générateur OpenAPI
  - protoc-gen-validate: Validation proto
  - protoc-gen-connect-go: Plugin Connect-RPC
  - protoc-gen-authoption: Plugin Zitadel personnalisé
  - protoc-gen-zitadel: Plugin Zitadel personnalisé
```

### Runtime Node.js
```
Version: Node.js v22.x LTS (via NodeSource)
Gestionnaire de paquets: pnpm 9.15.0
Raison: Zitadel v4 nécessite Node 22+, Debian n'a que la version 20.x

Outils de Build Node:
  - Nx: Système de build monorepo
  - Angular CLI: Frontend Console
  - Next.js: Frontend Login
  - Turbo: (optionnel, non utilisé)
```

### Protocol Buffers
```
Version: protoc (depuis le paquet Debian)
Installation: protobuf-compiler
Utilisation: Génération d'API gRPC
```

### Outils Système
```
Build Essentials:
  - gcc, g++, make
  - git, curl, wget
  - jq, unzip, tar

Développement:
  - vim, htop
  - net-tools, dnsutils
```

## Utilisateur de Build

```
Utilisateur: builder
Home: /home/builder
Shell: /bin/bash
Sudo: NOPASSWD pour toutes les commandes

Structure des Répertoires:
  /home/builder/
    ├── go/                    # Modules & outils Go
    │   └── bin/               # Binaires Go (buf, protoc-gen-*)
    ├── projects/
    │   └── zitadel/           # Dépôt Git
    │       ├── .artifacts/    # Sortie de build
    │       ├── console/       # Frontend Angular
    │       ├── apps/login/    # Login Next.js
    │       └── pkg/grpc/      # Fichiers proto générés
    └── .cache/                # Cache pnpm
```

## Architecture de Build Zitadel

### Structure Monorepo Zitadel v4

```
Dépôt Zitadel:
  - Framework: Nx Monorepo (nx.json)
  - Frontend: Angular (Console) + Next.js (Login)
  - Backend: Go 1.24+ avec gRPC/Connect-RPC
  - Proto: Protocol Buffers pour l'API

Dépendances de Build:
  1. Génération proto (TypeScript + Go)
  2. Build Console (Angular → internal/api/ui/console/static)
  3. Build Login (Next.js → apps/login/.next/standalone)
  4. Génération du routeur d'assets
  5. Embedding Statik (ressources Login v1)
  6. Compilation du binaire Go

Cibles de Build Nx:
  - @zitadel/proto:generate     → Fichiers proto TypeScript
  - @zitadel/console:build      → Frontend Console
  - @zitadel/login:build        → Frontend Login
  - @zitadel/api:generate-stubs → Fichiers proto Go
  - @zitadel/api:build          → Binaire final
```

### Script de Build: `/usr/local/bin/build-zitadel`

```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-v4.10.1}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
BUILD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
BUILD_OUTPUT="/opt/builds/zitadel-${VERSION}-${BUILD_DATE}"

log() { echo "[BUILD] $*"; }
error() { echo "[ERROR] $*" >&2; exit 1; }

# Environnement
source /etc/profile.d/go.sh
export PATH=$PATH:$HOME/go/bin

WORKSPACE="/home/builder/projects/zitadel"
[[ ! -d "$WORKSPACE" ]] && error "Workspace introuvable: $WORKSPACE"

cd "$WORKSPACE"

log "========================================"
log "Construction de Zitadel"
log "========================================"
log "Version:    $VERSION"
log "Date:       $BUILD_DATE"
log "Commit:     $BUILD_COMMIT"
log "Sortie:     $BUILD_OUTPUT"
log "========================================"

# 1. Checkout version
log "[1/4] Checkout de la version $VERSION..."
git fetch --tags || true
git checkout "$VERSION" || error "Échec du checkout"
BUILD_COMMIT=$(git rev-parse --short HEAD)

# 2. Dépendances
log "[2/4] Installation des dépendances pnpm..."
pnpm install || error "Échec de pnpm install"

# 3. Build via Nx (fait tout automatiquement !)
log "[3/4] Build via Nx (5-15 minutes)..."
npx nx run @zitadel/api:build || error "Échec du build Nx"

# 4. Préparation de la sortie
log "[4/4] Préparation des artefacts de build..."
mkdir -p "$BUILD_OUTPUT"
cp .artifacts/bin/linux/amd64/zitadel.local "$BUILD_OUTPUT/zitadel"
chmod +x "$BUILD_OUTPUT/zitadel"

# Métadonnées de build
cat > "$BUILD_OUTPUT/BUILD_INFO.txt" <<EOF
Informations de Build Zitadel
==============================
Version:    $VERSION
Construit:  $BUILD_DATE
Commit:     $BUILD_COMMIT
Builder:    $(whoami)@$(hostname)
Go:         $(go version)
Node:       $(node --version)
pnpm:       $(pnpm --version)

Taille du binaire: $(du -h $BUILD_OUTPUT/zitadel | cut -f1)
EOF

# Checksum
cd "$BUILD_OUTPUT"
sha256sum zitadel > zitadel.sha256

# Lien latest
ln -sfn "$BUILD_OUTPUT" "/opt/builds/latest"

# Nettoyage: Garder seulement les 5 derniers builds
log "Nettoyage des anciens builds (conservation des 5 derniers)..."
cd /opt/builds
ls -t | grep "^zitadel-v" | tail -n +6 | xargs -r rm -rf

log ""
log "========================================"
log "✓ Build réussi !"
log "========================================"
log "Binaire:    $BUILD_OUTPUT/zitadel"
log "Taille:     $(du -h $BUILD_OUTPUT/zitadel | cut -f1)"
log "========================================"

# Vérification de version
"$BUILD_OUTPUT/zitadel" -v
```

## Sortie de Build

```
Structure des Répertoires:
  /opt/builds/
    ├── zitadel-v4.10.1-2026-02-07T19:43:45Z/
    │   ├── zitadel                 # Binaire (~80-120 Mo)
    │   ├── zitadel.sha256          # Checksum
    │   └── BUILD_INFO.txt          # Métadonnées
    ├── zitadel-v4.11.0-2026-02-15T10:20:00Z/
    │   └── ...
    └── latest -> zitadel-v4.11.0-2026-02-15T10:20:00Z/

Informations Binaire:
  - Lié statiquement (CGO_ENABLED=0)
  - Plateforme: linux/amd64
  - Contient: Console, Login, API gRPC
  - Go Embedded: Tous les assets sont embarqués
```

## Utilisation

### Exécuter le Build

```bash
# Connexion au conteneur
pct enter 201

# Basculer vers l'utilisateur builder
su - builder

# Démarrer le build (prend 5-15 minutes)
build-zitadel v4.10.1

# Vérifier la sortie
ls -lh /opt/builds/latest/
/opt/builds/latest/zitadel -v
```

### Construire une Nouvelle Version de Zitadel

```bash
# Lister les versions disponibles
cd ~/projects/zitadel
git fetch --tags
git tag | grep '^v4' | tail -10

# Construire une nouvelle version
build-zitadel v4.11.0
```

### Déployer le Binaire

```bash
# En tant que root sur l'hôte Proxmox
# Déployer vers iam-LXC (ID: 101)

# 1. Copier le binaire
pct push 101 /var/lib/vz/snippets/zitadel /usr/local/bin/zitadel

# 2. Ou via scp
scp /opt/builds/latest/zitadel root@10.0.1.101:/usr/local/bin/

# 3. Redémarrer le service
pct exec 101 -- systemctl restart zitadel

# 4. Vérifier
pct exec 101 -- zitadel -v
```

## Configuration Réseau

```
Adresse IP: 10.0.1.201 (statique, ajustable)
Passerelle: 10.0.1.1
DNS: 9.9.9.9 (Quad9)

Connexions Sortantes:
  - GitHub/GitLab: git clone, pnpm install
  - NodeSource: Paquets Node.js
  - pkg.go.dev: Modules Go
  - registry.npmjs.org: Paquets npm

Pas de ports entrants (conteneur build uniquement)
```

## Dépannage

### Échec du Build: Génération Proto

```bash
# Vérifier si buf fonctionne
which buf
buf --version

# Vérifier les plugins protoc
ls -la ~/go/bin/protoc-gen-*

# Réinstaller les plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Plugins Zitadel personnalisés
cd ~/projects/zitadel
go install ./internal/protoc/protoc-gen-authoption
go install ./internal/protoc/protoc-gen-zitadel
```

### Échec du Build: Console/Login

```bash
# Vérifier la version Node.js (doit être 22+)
node --version

# Vérifier pnpm
pnpm --version

# Réinstaller les dépendances
cd ~/projects/zitadel
rm -rf node_modules
pnpm install --force

# Vider le cache
rm -rf ~/.cache/pnpm
pnpm store prune
```

### Échec du Build: Compilation Go

```bash
# Vérifier la version Go (doit être 1.24+)
go version

# Vérifier si les fichiers proto ont été générés
find pkg/grpc -name "*.pb.go" | wc -l
# Devrait être ~190 fichiers

# Vérifier si les fichiers OpenAPI ont été copiés
ls -la openapi/v2/zitadel/ | wc -l
# Devrait être ~80 fichiers

# Déclencher manuellement la génération proto
npx nx run @zitadel/api:generate-stubs
```

### Problèmes de Permissions

```bash
# Tous les fichiers pour l'utilisateur builder
sudo chown -R builder:builder /home/builder/

# Permissions des outils Go
chmod +x ~/go/bin/*

# Permissions de sortie de build
sudo chown -R builder:builder /opt/builds/
```

### Problèmes d'Espace Disque

```bash
# Vérifier l'espace disque
df -h

# Vider le cache des modules Go
go clean -modcache

# Vider le cache pnpm
pnpm store prune

# Supprimer les anciens builds
rm -rf /opt/builds/zitadel-v4.9.*

# Vider le cache Nx
cd ~/projects/zitadel
rm -rf .nx/cache
```

## Optimisation des Performances

### Réduire le Temps de Build

```bash
# Builds parallèles (Nx le fait automatiquement)
# Plus de CPUs = plus rapide

# Utiliser le cache Nx (activé par défaut)
# Les builds répétés utilisent les caches

# Utiliser le store pnpm (global)
pnpm config set store-dir ~/.cache/pnpm

# Utiliser le cache de build Go
export GOCACHE=$HOME/.cache/go-build
```

### Optimisation RAM

```bash
# Pour < 32 Go RAM: Augmenter le swap
# Sur l'hôte Proxmox:
pct set 201 --swap 8192

# Limiter Go GOMAXPROCS
export GOMAXPROCS=4

# Limite mémoire Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
```

## Stratégie de Sauvegarde

```
Snapshots de Conteneur:
  - Planning: Après configuration (manuel)
  - Type: Stop → Snapshot → Start
  - Rétention: 1 snapshot (l'environnement de build change rarement)

Artefacts de Build:
  - /opt/builds/ n'est PAS sauvegardé
  - Les binaires sont reproductibles via les tags Git
  - Si nécessaire: Copier les artefacts vers NAS

Dépôt Git:
  - Pas de sauvegardes nécessaires (GitHub/GitLab)
  - Pour les modifications locales: git push
```

## Configuration de Sécurité

```
Isolation Utilisateur:
  - LXC non privilégié
  - Utilisateur dédié: builder
  - Sudo: Uniquement pour l'installation de paquets

Réseau:
  - Pas de ports exposés
  - Connexions sortantes uniquement
  - Pas d'accès internet direct via firewall

Isolation du Build:
  - Pas de credentials de production
  - Conteneurs séparés pour build/runtime
  - Binaires déployés en externe
```

## Bonnes Pratiques

✅ **À Faire**:
- Mises à jour régulières de Go, Node.js, pnpm
- Supprimer les anciens artefacts de build (> 30 jours)
- Utiliser le cache Nx pour des rebuilds plus rapides
- Arrêter le conteneur après le build (économise la RAM)
- Utiliser les tags Git pour des builds reproductibles

❌ **À Ne Pas Faire**:
- Stocker les credentials de production dans le conteneur de build
- Déployer les builds directement en production (sans test)
- Utiliser d'anciennes versions de Go/Node
- Déployer sans checksums
- Utiliser l'utilisateur root pour les builds

### Script de Déploiement (optionnel)

```bash
#!/bin/bash
# /usr/local/bin/deploy-zitadel.sh
# Exécuter sur l'hôte Proxmox

BUILD_CT=201
IAM_CT=101
VERSION=${1:-latest}

echo "Déploiement de Zitadel depuis CT $BUILD_CT vers CT $IAM_CT"

# Obtenir le binaire depuis le CT de build
pct exec $BUILD_CT -- cat /opt/builds/$VERSION/zitadel > /tmp/zitadel
pct exec $BUILD_CT -- cat /opt/builds/$VERSION/zitadel.sha256 > /tmp/zitadel.sha256

# Vérifier le checksum
cd /tmp && sha256sum -c zitadel.sha256 || exit 1

# Déployer vers IAM CT
pct push $IAM_CT /tmp/zitadel /usr/local/bin/zitadel
pct exec $IAM_CT -- chmod +x /usr/local/bin/zitadel

# Redémarrer le service
pct exec $IAM_CT -- systemctl restart zitadel

# Vérifier
pct exec $IAM_CT -- zitadel -v

echo "Déploiement terminé !"
```

## Surveillance

```bash
# Vérifier le statut du build
pct exec 201 -- su - builder -c 'tail -f /home/builder/projects/zitadel/.nx/cache/*/outputs/*'

# Ressources système pendant le build
pct exec 201 -- htop

# Utilisation du disque
pct exec 201 -- df -h

# Utilisation de la mémoire
pct exec 201 -- free -h
```

## Références

- [Dépôt GitHub Zitadel](https://github.com/zitadel/zitadel)
- [Documentation Zitadel](https://zitadel.com/docs)
- [Documentation Nx Monorepo](https://nx.dev/)
- [Documentation Go](https://go.dev/doc/)
- [Protocol Buffers](https://protobuf.dev/)
- [Bonnes Pratiques Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)

## Leçons Apprises (2026-02-07)

**Problème:** Le système de build Zitadel v4 n'est pas du tout documenté pour l'auto-hébergement en dehors de Docker.

**Solution:** 
1. Analysé le système monorepo Nx (`apps/api/project.json`)
2. Découvert: `npx nx run @zitadel/api:build` fait tout automatiquement
3. Toutes les étapes manuelles proto/asset/statik sont définies dans les cibles Nx

**Temps de Build:** ~8-12 minutes sur un système 8-core / 32Go RAM

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
CT_ROOTFS_SIZE="25G"

# Netzwerk-Konfiguration
CT_BRIDGE="vmbr1"
CT_IP="192.168.***.***"
CT_GATEWAY="192.168.***.***"
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
