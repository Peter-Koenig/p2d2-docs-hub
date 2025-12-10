---
title: Contêiner GeoServer
description: Servidor WFS/WMS para serviços de geodados
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# LXC: GeoServer

## Informações do Contêiner

```
Tipo: LXC (privilegiado/não privilegiado dependendo da configuração)
SO: Debian 13 (trixie)
Hostname: geoserver (personalizável)
Status: em execução

Recursos:
  RAM: 6 GB
  Disco: 12 GB (expansível dinamicamente)
  CPU Shares: Padrão (1024)
```

## Software Instalado

### Java Runtime

```
Versão: OpenJDK 17 (LTS)
Opções JVM: Otimizadas para carga de trabalho GeoServer
Memória: 4 GB Heap (Xmx), 512 MB PermGen
```

### Contêiner de Servlets Tomcat

```
Versão: 9.x (Repositório Oficial Debian)
Serviço: tomcat9.service (systemd)
Webroot: /var/lib/tomcat9/webapps/geoserver
Porta: 8080 (HTTP), 8443 (HTTPS opcional)
```

### GeoServer

```
Versão: 2.x (Estável atual)
Instalação: Arquivo WAR no Tomcat
Caminho de Contexto: /geoserver
Interface Admin: /geoserver/web
```

## Configuração do Serviço

### Serviço Systemd

```
# Verificar status do serviço
systemctl status tomcat9

# Reiniciar serviço (com downtime)
systemctl restart tomcat9

# Visualizar logs
journalctl -u tomcat9 -f --no-pager

# Habilitar serviço (autostart)
systemctl enable tomcat9
```

### Configuração do Tomcat

```
# Configuração do servidor
/etc/tomcat9/server.xml
  - Porta do Conector: 8080
  - Conector AJP: Desabilitado (Segurança)
  - SSL/TLS: Opcional (via proxy Caddy)

# Configuração da aplicação
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## Funcionalidades do GeoServer

### Protocolos Suportados

```
WMS (Web Map Service): Renderização de mapas
  - Versão: 1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service): Dados vetoriais
  - Versão: 1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactional): Acesso de escrita
  - Operações Insert, Update, Delete
  - Para persistência de dados do frontend p2d2

WMTS (Web Map Tile Service): Opcional
```

### Configuração da Fonte de Dados

#### Conexão PostgreSQL/PostGIS

```
Parâmetros de Conexão:
  - Host: postgresql.lan (DNS interno)
  - Banco de Dados: data-dna
  - Esquema: public
  - Usuário: geoserver (usuário dedicado)

Armazenamento PostGIS:
  - Limites Estimados: Auto-calcular
  - Expor Chaves Primárias: Habilitado
  - Declarações Preparadas: Habilitado (Performance)
```

#### Publicação de Camadas

```
Camadas Publicadas:
  - kommunen (geometrias Polygon)
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - Camadas personalizadas dependendo da importação de dados

Estilo (SLD):
  - Estilos padrão para diferentes tipos de geometria
  - SLD personalizado para representações especiais
  - Classificação baseada em regras
```

## Acesso à Rede

```
Escutando: 
  - Porta TCP 8080 (HTTP, LAN interna)
  - Sem exposição direta à WAN

Acesso via Reverse Proxy:
  - ows.data-dna.eu → Endpoints WMS/WFS
  - wfs.data-dna.eu → Endpoints WFS-T (Frontend)

Regras de Firewall:
  - Caddy (OPNSense) → GeoServer: PERMITIR
  - Frontend → GeoServer: PERMITIR (WFS-T)
  - MapProxy → GeoServer: PERMITIR (WMS)
  - Acesso Externo: NEGAR (somente via Caddy)
```

## Otimização de Performance

### Opções JVM (setenv.sh)

```
# /usr/share/tomcat9/bin/setenv.sh
export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### Configuração do GeoServer

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

### Configuração GWC (GeoWebCache)

```
Configuração de Cache:
  - Quota de Disco: 2 GB (limitado pelo disco do contêiner)
  - Camadas de Tiles: Automático para camadas WMS
  - Subconjuntos de Grade: WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - Meta-Tiling: 4x4 (Performance vs. Qualidade)
```

## Estratégia de Backup

### Snapshot PBS (Nível Contêiner)

  - **Agendamento**: Semanal
  - **Retenção**: 4 semanas
  - **Tipo**: Snapshot LVM-Thin

### Backup de Configuração do GeoServer

```
# Backup manual da configuração
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz \
  /var/lib/geoserver/data/

# Automação via Cronjob
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz" \
  /var/lib/geoserver/data/

# Excluir backups antigos (>90 dias)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip Portabilidade de Configuração
Backups de configuração do GeoServer são específicos da versão. Para atualizações maiores, exportar/importar configuração via UI do GeoServer.
:::

## Monitoramento

### Verificações de Saúde

```
# Status do serviço
curl -I http://localhost:8080/geoserver/web

# Capacidades WMS
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# Lista de camadas
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### Análise de Logs

```
# Logs do Tomcat
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# Logs do GeoServer
tail -f /var/lib/geoserver/data/logs/geoserver.log

# Métricas de performance
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## Solução de Problemas

### GeoServer não inicia

```
# Verificar logs do Tomcat
journalctl -u tomcat9 --no-pager -n 100

# Permissões do Diretório de Dados do GeoServer
ls -la /var/lib/geoserver/data/

# Problemas de Memória JVM
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### Mensagens de Erro WMS/WFS

```
# Camada não disponível
- Verificar Conexão do Armazenamento de Dados
- Testar conexão PostgreSQL
- Permissões da camada no GeoServer

# Problemas de performance
- Aumentar Tamanho do Heap JVM
- Verificar índices PostGIS
- Habilitar cache GWC
```

### Conexão com PostgreSQL

```
# Testar do contêiner GeoServer
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# Conectividade de Rede
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## Configuração de Segurança

### Segurança do GeoServer

```
Usuário Admin: 
  - Nome de Usuário: admin (mudar em produção)
  - Senha: <STRONG_PASSWORD> (não padrão)

Acesso Baseado em Função:
  - ADMIN_ROLE: Acesso total
  - GROUP_ADMIN: Gerenciamento de camadas
  - WMS_USER: Acesso somente leitura
  - WFS_USER: Acesso a features

Segurança de Dados:
  - Permissões em Nível de Camada
  - Isolamento de Workspace
  - Limites de Serviço OGC
```

### Segurança de Rede

```
Regras de Firewall:
  - Somente proxy Caddy tem acesso (Reverse Proxy)
  - Sem exposição direta à WAN
  - Comunicação interna somente com serviços autorizados

TLS/SSL:
  - Via proxy Caddy (Let's Encrypt)
  - Cabeçalho HSTS habilitado
  - Suites de Cifragem Modernas
```

## Integração com Arquitetura p2d2

### Integração Frontend (WFS-T)

```
// Frontend AstroJS → GeoServer WFS-T
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

// HTTP POST para GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: wfsTransaction
});
```

### Integração MapProxy (WMS)

```
# Configuração MapProxy
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

## Melhores Práticas

✅ **Fazer**:

  - Atualizações regulares do GeoServer (Patches de segurança)
  - Usuários separados para diferentes níveis de acesso
  - Cache GWC para camadas frequentemente solicitadas
  - Monitoramento de performance JVM (Uso de Heap)
  - Backup da configuração do GeoServer

❌ **Não Fazer**:

  - Usar senhas padrão
  - Expor GeoServer diretamente à internet
  - Permitir MaxFeatures ilimitados
  - Executar sem limites de recursos
  - Alterar configuração sem backup

## Referências

  - [Documentação GeoServer](https://docs.geoserver.org/)
  - [Segurança GeoServer](https://docs.geoserver.org/stable/en/user/security/)
  - [Especificação WFS-T](https://www.ogc.org/standards/wfs)
  - [Administração Tomcat 9](https://tomcat.apache.org/tomcat-9.0-doc/)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.