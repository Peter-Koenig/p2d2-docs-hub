---
title: GeoServer 容器
description: 用于地理数据服务的 WFS/WMS 服务器
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# LXC：GeoServer

## 容器信息

```
类型：LXC（根据设置可能为特权/非特权）
操作系统：Debian 13 (trixie)
主机名：geoserver（可自定义）
状态：正在运行

资源：
  内存：6 GB
  磁盘：12 GB（可动态扩展）
  CPU 份额：标准 (1024)
```

## 安装的软件

### Java 运行时

```
版本：OpenJDK 17 (LTS)
JVM 选项：针对 GeoServer 工作负载进行了优化
内存：4 GB 堆 (Xmx)，512 MB PermGen
```

### Tomcat Servlet 容器

```
版本：9.x（Debian 官方仓库）
服务：tomcat9.service (systemd)
Webroot：/var/lib/tomcat9/webapps/geoserver
端口：8080 (HTTP)，8443 (HTTPS 可选)
```

### GeoServer

```
版本：2.x（当前稳定版）
安装：WAR 文件部署在 Tomcat 中
上下文路径：/geoserver
管理界面：/geoserver/web
```

## 服务配置

### Systemd 服务

```
# 检查服务状态
systemctl status tomcat9

# 重启服务（会有停机时间）
systemctl restart tomcat9

# 查看日志
journalctl -u tomcat9 -f --no-pager

# 启用服务（开机自启）
systemctl enable tomcat9
```

### Tomcat 配置

```
# 服务器配置
/etc/tomcat9/server.xml
  - 连接器端口：8080
  - AJP 连接器：已禁用（安全）
  - SSL/TLS：可选（通过 Caddy 代理）

# 应用程序配置
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## GeoServer 功能

### 支持的协议

```
WMS (Web Map Service)：地图渲染
  - 版本：1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service)：矢量数据
  - 版本：1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactional)：写访问
  - Insert, Update, Delete 操作
  - 用于 p2d2 前端数据持久化

WMTS (Web Map Tile Service)：可选
```

### 数据源配置

#### PostgreSQL/PostGIS 连接

```
连接参数：
  - 主机：postgresql.lan（内部 DNS）
  - 数据库：data-dna
  - 模式：public
  - 用户：geoserver（专用用户）

PostGIS 存储：
  - 估算边界：自动计算
  - 暴露主键：已启用
  - 准备好的语句：已启用（性能）
```

#### 图层发布

```
已发布的图层：
  - kommunen（多边形几何）
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - 根据数据导入的自定义图层

样式 (SLD)：
  - 针对不同几何类型的标准样式
  - 用于特殊表示的自定义 SLD
  - 基于规则的分类
```

## 网络访问

```
监听： 
  - TCP 端口 8080 (HTTP, 内部 LAN)
  - 无直接 WAN 暴露

通过反向代理访问：
  - ows.data-dna.eu → WMS/WFS 端点
  - wfs.data-dna.eu → WFS-T 端点 (前端)

防火墙规则：
  - Caddy (OPNSense) → GeoServer：允许
  - 前端 → GeoServer：允许 (WFS-T)
  - MapProxy → GeoServer：允许 (WMS)
  - 外部访问：拒绝 (仅通过 Caddy)
```

## 性能优化

### JVM 选项 (setenv.sh)

```
# /usr/share/tomcat9/bin/setenv.sh
export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### GeoServer 配置

```
# /var/lib/geoserver/data/global.xml

<global>
  <settings>
    <proxyBaseUrl>https://ows.data-dna.eu/geoserver</proxyBaseUrl>
    <useHeadersProxyURL>false</useHeadersProxyURL>
    <verbose>false</verbose>
    <verboseExceptions>false</verboseExceptions>
    <maxFeatures>10000</maxFeatures>
    <numDecimals>8</numDecimals>
  </settings>
</global>
```

### GWC (GeoWebCache) 配置

```
缓存配置：
  - 磁盘配额：2 GB（受容器磁盘限制）
  - 瓦片图层：自动为 WMS 图层启用
  - 网格子集：WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - 元瓦片：4x4（性能 vs 质量）
```

## 备份策略

### PBS 快照 (容器级别)

  - **计划**：每周
  - **保留**：4 周
  - **类型**：LVM-Thin 快照

### GeoServer 配置备份

```
# 手动备份配置
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz \
  /var/lib/geoserver/data/

# 通过 Cronjob 自动化
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz" \
  /var/lib/geoserver/data/

# 删除旧备份 (>90 天)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip 配置可移植性
GeoServer 配置备份是特定于版本的。对于重大更新，请通过 GeoServer UI 导出/导入配置。
:::

## 监控

### 健康检查

```
# 服务状态
curl -I http://localhost:8080/geoserver/web

# WMS 能力
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# 图层列表
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### 日志分析

```
# Tomcat 日志
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# GeoServer 日志
tail -f /var/lib/geoserver/data/logs/geoserver.log

# 性能指标
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## 故障排除

### GeoServer 无法启动

```
# 检查 Tomcat 日志
journalctl -u tomcat9 --no-pager -n 100

# GeoServer 数据目录权限
ls -la /var/lib/geoserver/data/

# JVM 内存问题
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### WMS/WFS 错误消息

```
# 图层不可用
- 检查数据存储连接
- 测试 PostgreSQL 连接
- GeoServer 中的图层权限

# 性能问题
- 增加 JVM 堆大小
- 检查 PostGIS 索引
- 启用 GWC 缓存
```

### 连接到 PostgreSQL

```
# 从 GeoServer 容器测试
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# 网络连接
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## 安全配置

### GeoServer 安全

```
管理员用户： 
  - 用户名：admin（在生产环境中更改）
  - 密码：<STRONG_PASSWORD>（非默认）

基于角色的访问：
  - ADMIN_ROLE：完全访问
  - GROUP_ADMIN：图层管理
  - WMS_USER：只读访问
  - WFS_USER：要素访问

数据安全：
  - 图层级别权限
  - 工作区隔离
  - OGC 服务限制
```

### 网络安全

```
防火墙规则：
  - 只有 Caddy 代理有权访问（反向代理）
  - 无直接 WAN 暴露
  - 内部通信仅限授权服务

TLS/SSL：
  - 通过 Caddy 代理 (Let's Encrypt)
  - HSTS 标头已启用
  - 现代密码套件
```

## 与 p2d2 架构集成

### 前端集成 (WFS-T)

```
// AstroJS 前端 → GeoServer WFS-T
const wfsTransaction = `
<wfs:Transaction service="WFS" version="2.0.0"
  xmlns:wfs="http://www.opengis.net/wfs/2.0"
  xmlns:gml="http://www.opengis.net/gml/3.2">
  <wfs:Insert>
    <feature:gebaeude xmlns:feature="http://www.data-dna.eu/features">
      <feature:geom>
        <gml:Point srsName="EPSG:4326">
           <gml:pos>7.0 51.0</gml:pos>
        </gml:Point>
      </feature:geom>
    </feature:gebaeude>
  </wfs:Insert>
</wfs:Transaction>`;

// HTTP POST 到 GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: wfsTransaction
});
```

### MapProxy 集成 (WMS)

```
# MapProxy 配置
sources:
  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

caches:
  geoserver_cache:
    sources: [geoserver_wms]
    grids: [webmercator]
    cache:
      type: file
      directory: /cache/geoserver
```

## 最佳实践

✅ **应做**：

  - 定期更新 GeoServer（安全补丁）
  - 为不同访问级别使用单独的用户
  - 为频繁请求的图层使用 GWC 缓存
  - 监控 JVM 性能（堆使用情况）
  - 备份 GeoServer 配置

❌ **不应做**：

  - 使用默认密码
  - 将 GeoServer 直接暴露在互联网上
  - 允许无限制的 MaxFeatures
  - 在没有资源限制的情况下运行
  - 未经备份更改配置

## 参考资料

  - [GeoServer 文档](https://docs.geoserver.org/)
  - [GeoServer 安全](https://docs.geoserver.org/stable/en/user/security/)
  - [WFS-T 规范](https://www.ogc.org/standards/wfs)
  - [Tomcat 9 管理](https://tomcat.apache.org/tomcat-9.0-doc/)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。