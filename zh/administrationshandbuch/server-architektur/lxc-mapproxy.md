---
title: MapProxy 容器
description: 用于高性能地图传输的瓦片缓存和代理
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung: KI)"
  reviewDate: null
---

# LXC：MapProxy

## 容器信息

```
类型：LXC（根据设置可能为特权/非特权）
操作系统：Debian 13 (trixie)
主机名：mapproxy（可自定义）
状态：正在运行

资源：
  内存：4 GB
  磁盘：38 GB（可动态扩展）
  CPU 份额：标准 (1024)
```

## 安装的软件

### Python 运行时

```
版本：Python 3.13.x（Debian 官方仓库）
虚拟环境：/opt/mapproxy/venv
包管理器：pip (Python Package Index)
```

### MapProxy

```
版本：4.x（当前稳定版）
安装：Python 包（通过 pip）
服务：mapproxy.service (systemd)
WSGI 服务器：Gunicorn
Workers：4 (可配置)
```

### Gunicorn (WSGI 服务器)

```
版本：21.x (Python WSGI HTTP 服务器)
Binding：UNIX Socket + TCP (用于开发)
Process Manager：Pre-fork Worker 模型
```

## 服务配置

### Systemd 服务

```
# 检查服务状态
systemctl status mapproxy

# 重启服务（会有停机时间）
systemctl restart mapproxy

# 查看日志
journalctl -u mapproxy -f --no-pager

# 启用服务（开机自启）
systemctl enable mapproxy
```

### MapProxy 配置

#### 主配置 (mapproxy.yaml)

```
# /etc/mapproxy/mapproxy.yaml
services:
  demo:
  wms:
    srs: ['EPSG:3857', 'EPSG:4326']
    image_formats: ['image/png', 'image/jpeg']
    max_output_pixels: [3000, 3000]
  kml:
    srs: 'EPSG:4326'
  tms:
    origin: 'nw'
  wmts:
    restful: true
    restful_template: '/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.{Format}'
    kvp: true

layers:
  - name: osm
    title: OpenStreetMap Tiles
    sources: [osm_cache]

  - name: geoserver_base
    title: GeoServer Base Layers
    sources: [geoserver_cache]

caches:
  osm_cache:
    grids: [webmercator]
    sources: [osm_tiles]
    cache:
      type: file
      directory: /cache/osm
      directory_layout: tms

  geoserver_cache:
    grids: [webmercator]
    sources: [geoserver_wms]
    cache:
      type: file
      directory: /cache/geoserver
      directory_layout: tms

sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator

  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

grids:
  webmercator:
    base: GLOBAL_WEBMERCATOR
    srs: 'EPSG:3857'
    origin: 'nw'

globals:
  cache:
    base_dir: '/cache'
    lock_dir: '/cache/locks'
  image:
    resampling_method: bilinear
```

## 网络访问

```
监听： 
  - UNIX Socket：/run/mapproxy/mapproxy.sock
  - TCP 端口 8080 (HTTP, 内部 LAN, 开发)

通过反向代理访问：
  - tiles.data-dna.eu → 瓦片端点
  - proxy.data-dna.eu → WMS 端点

防火墙规则：
  - Caddy (OPNSense) → MapProxy：允许
  - 前端 → MapProxy：允许 (瓦片请求)
  - MapProxy → GeoServer：允许 (WMS 代理)
  - MapProxy → OSM-Tiler：允许 (瓦片渲染)
  - 外部访问：拒绝 (仅通过 Caddy)
```

## 性能优化

### Gunicorn 配置

```
# /etc/mapproxy/gunicorn.conf.py
bind = "unix:/run/mapproxy/mapproxy.sock"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/mapproxy/access.log"
errorlog = "/var/log/mapproxy/error.log"
loglevel = "info"
```

### 缓存优化

```
缓存存储：
  - OSM 瓦片：~20 GB (预配置的缩放级别)
  - GeoServer 缓存：~10 GB (动态增长)
  - 临时空间：~8 GB (用于渲染操作)

缓存清理：
  - 自动清理旧瓦片
  - LRU (Least Recently Used) 策略
  - 图层更改时手动缓存失效
```

## 备份策略

### PBS 快照 (容器级别)

  - **计划**：每周
  - **保留**：4 周
  - **类型**：LVM-Thin 快照

### 配置备份

```
# 手动备份配置
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz \
  /etc/mapproxy/ \
  /opt/mapproxy/

# 通过 Cronjob 自动化
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz" \
  /etc/mapproxy/ \
  /opt/mapproxy/

# 删除旧备份 (>90 天)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning 缓存数据
MapProxy 缓存数据**不会**被备份。如果需要，可以重新渲染。只有配置是关键的。
:::

## 监控

### 健康检查

```
# 服务状态
curl -I http://localhost:8080/demo

# 测试瓦片请求
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# WMS 能力
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### 性能指标

```
# 缓存使用
du -sh /cache/osm/
du -sh /cache/geoserver/

# Gunicorn worker 状态
systemctl status mapproxy | grep "active (running)"

# 日志分析
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## 故障排除

### MapProxy 无法启动

```
# 检查 systemd 日志
journalctl -u mapproxy --no-pager -n 100

# 配置验证
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# 权限问题
ls -la /run/mapproxy/
ls -la /cache/
```

### 瓦片渲染错误

```
# OSM-Tiler 连接
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# GeoServer 连接
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# 缓存目录权限
ls -la /cache/osm/0/0/
```

### 性能问题

```
# 检查 worker 进程
ps aux | grep gunicorn

# 内存使用
free -h

# 磁盘空间
df -h /cache
```

## 安全配置

### 服务加固

```
用户隔离：
  - 专用用户：mapproxy
  - 组：mapproxy
  - 主目录：/opt/mapproxy

文件权限：
  - 配置文件：640 (root:mapproxy)
  - 缓存目录：755 (mapproxy:mapproxy)
  - 日志文件：644 (mapproxy:mapproxy)
```

### 网络安全

```
防火墙规则：
  - 只有授权的服务有权访问
  - 无直接 WAN 暴露
  - 带速率限制的反向代理

TLS/SSL：
  - 通过 Caddy 代理 (Let's Encrypt)
  - HSTS 标头已启用
  - 现代密码套件
```

## 与 p2d2 架构集成

### 前端集成

```
// AstroJS 前端 → MapProxy 瓦片
const tileUrl = `https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png`;

// Leaflet 集成
const map = L.map('map').setView([51.0, 7.0], 10);
L.tileLayer(tileUrl, {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);
```

### GeoServer 代理

```
# WMS 代理 GeoServer 图层
const wmsUrl = `https://proxy.data-dna.eu/service?` +
  `service=WMS&version=1.3.0&request=GetMap&` +
  `layers=geoserver_base&styles=&format=image/png&` +
  `transparent=true&width=256&height=256&` +
  `crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### OSM-Tiler 集成

```
# 直接瓦片请求到 OSM-Tiler
sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator
    transparent: true
    coverage:
      bbox: [-180, -85, 180, 85]
      srs: 'EPSG:4326'
```

## 高级功能

### Seeding (预渲染)

```
# 手动 Seeding 特定区域
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 0-10 \
  --bbox 5.8,50.2,9.0,52.5

# 通过 Cron 自动 Seeding
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 11-14 \
  --bbox 6.0,50.5,7.5,51.5
```

### 缓存管理

```
# 缓存统计
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  cache-stats osm_cache

# 缓存清理
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache osm_cache --max-age 30

# 缓存失效
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache geoserver_cache --all
```

## 最佳实践

✅ **应做**：

  - 定期更新 MapProxy（安全补丁）
  - 监控缓存利用率
  - 将 Gunicorn workers 调整为可用的 CPU 核心
  - 缓存目录在单独的分区/卷上
  - 为访问/错误日志设置日志轮换

❌ **不应做**：

  - 将 MapProxy 直接暴露在互联网上
  - 允许无限的缓存存储
  - 在没有速率限制的情况下运行
  - 未经备份更改配置
  - 无限期保留旧缓存数据

## 参考资料

  - [MapProxy 文档](https://mapproxy.org/docs/)
  - [Gunicorn 配置](https://docs.gunicorn.org/en/stable/configure.html)
  - [Tile Map Service 规范](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
  - [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。