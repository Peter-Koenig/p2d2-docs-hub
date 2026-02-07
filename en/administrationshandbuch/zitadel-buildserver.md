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
