---
title: Overpass API Integration
description: Umfassende Dokumentation für Overpass API Integration, Query-Builder und Load-Balancing in p2d2
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Overpass API Integration

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Die Overpass API Integration in p2d2 ermöglicht den Zugriff auf OpenStreetMap-Daten für administrative Grenzen und Friedhöfe. Die Implementierung bietet Load-Balancing über mehrere Endpoints, robuste Fehlerbehandlung und effiziente Query-Optimierung.

## Architektur

### Python Overpass Client

```python
class OverpassDownloader:
    """Load-balanced Overpass API client with retry logic"""
    
    ENDPOINTS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://z.overpass-api.de/api/interpreter",
    ]
    
    def __init__(self, timeout=180):
        self.timeout = timeout
        self.current_endpoint = 0
```

## Query Builder

### Administrative Grenzen

```python
def build_query(self, municipality_name: str, admin_level: int) -> str:
    """Build area-based Overpass query for administrative boundaries"""
    safe_name = municipality_name.replace('"', '\\"')
    return f'''[out:json][timeout:{self.timeout}][maxsize:1073741824];
relation["boundary"="administrative"]["admin_level"={admin_level}]["name"="{safe_name}"];
out geom;'''
```

### Friedhöfe

```python
def build_cemetery_query(self, municipality_name: str) -> str:
    """Build cemetery query with area filtering"""
    return f"""
[out:json][timeout:{self.timeout}][maxsize:1073741824];
(
  area[name="{municipality_name}"][boundary=administrative] -> .area0;
  way[landuse=cemetery](area.area0);
  relation[landuse=cemetery][type=multipolygon](area.area0);
);
out geom;
"""
```

## Verwendung

### Python Script Integration

```python
from overpass_downloader import OverpassDownloader

# Client initialisieren
downloader = OverpassDownloader(timeout=180)

# Administrative Grenzen laden
def fetch_admin_polygons(kommune: str, levels: List[int]) -> Dict:
    results = {}
    for level in levels:
        try:
            data = downloader.download_admin_level(kommune, level)
            results[level] = data
            print(f"Level {level}: {len(data.get('elements', []))} Elemente")
        except Exception as e:
            print(f"Fehler bei Level {level}: {e}")
    return results

# Friedhöfe laden
def fetch_cemeteries(kommune: str) -> Dict:
    try:
        data = downloader.download_cemeteries(kommune)
        cemetery_count = len(data.get('elements', []))
        print(f"Friedhöfe gefunden: {cemetery_count}")
        return data
    except Exception as e:
        print(f"Fehler beim Laden der Friedhöfe: {e}")
        return {}
```

### TypeScript Bridge

```typescript
// Python Script Aufruf aus TypeScript
async function fetchAdminPolygons(
  kommune: string,
  level: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = [
      "src/scripts/fetch_admin_polygons.py",
      "--kommune", kommune,
      "--levels", level.toString(),
      "--debug"
    ];

    const pythonProcess = spawn("python", args);

    let output = "";
    let stderr = "";
    
    pythonProcess.stdout.on("data", (data) => (output += data.toString()));
    pythonProcess.stderr.on("data", (data) => (stderr += data.toString()));
    
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            reject(new Error("No JSON found in Python script output"));
            return;
          }
          const result = JSON.parse(jsonMatch[0]);
          resolve(result);
        } catch (e) {
          reject(new Error("Invalid JSON from Python script"));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
  });
}
```

## Load Balancing & Retry Logic

### Intelligente Endpoint-Rotation

```python
def query_overpass(self, query: str) -> Dict:
    """Execute Overpass query with load balancing and retry logic"""
    for attempt in range(3):
        endpoint = self.ENDPOINTS[self.current_endpoint]
        self.current_endpoint = (self.current_endpoint + 1) % len(self.ENDPOINTS)

        try:
            logger.info(f"Attempt {attempt + 1}/3 using endpoint: {endpoint}")

            response = requests.post(
                endpoint,
                data=query,
                headers={"Content-Type": "text/plain"},
                timeout=self.timeout,
            )

            if response.status_code == 200:
                data = response.json()
                element_count = len(data.get("elements", []))
                logger.info(f"Successfully fetched {element_count} elements")
                return data
            else:
                logger.warning(f"HTTP {response.status_code} from {endpoint}")

        except requests.exceptions.Timeout:
            logger.warning(f"Timeout from {endpoint}")
        except requests.exceptions.ConnectionError:
            logger.warning(f"Connection error from {endpoint}")
        except Exception as e:
            logger.warning(f"Request failed: {e}")
            
        if attempt < 2:  # Don't sleep on last attempt
            time.sleep(2**attempt)  # Exponential backoff

    raise Exception("All Overpass endpoints failed")
```

## Query Optimierungen

### Effiziente Area-Queries

```python
def build_optimized_area_query(municipality_name: str, admin_level: int) -> str:
    """Optimierte Query mit Area-Referenzierung"""
    safe_name = municipality_name.replace('"', '\\"')
    return f"""
[out:json][timeout:180];
area["name"="{safe_name}"][boundary=administrative] -> .searchArea;
(
  relation["boundary"="administrative"]["admin_level"={admin_level}](area.searchArea);
  way["boundary"="administrative"]["admin_level"={admin_level}](area.searchArea);
);
out geom;
"""
```

### Batch Processing für mehrere Levels

```python
def build_multi_level_query(municipality_name: str, levels: List[int]) -> str:
    """Query für mehrere Admin-Levels in einem Request"""
    safe_name = municipality_name.replace('"', '\\"')
    level_conditions = "".join(
        f'  relation["boundary"="administrative"]["admin_level"={level}]["name"="{safe_name}"];\n'
        for level in levels
    )
    
    return f"""
[out:json][timeout:300][maxsize:2147483648];
(
{level_conditions}
);
out geom;
"""
```

## Error Handling

### Robuste Fehlerbehandlung

```python
class ResilientOverpassDownloader(OverpassDownloader):
    """Erweiterter Downloader mit verbessertem Error-Handling"""
    
    def download_with_fallback(self, municipality_name: str, admin_level: int) -> Dict:
        """Download mit Fallback-Strategien"""
        try:
            # Primär: Spezifische Admin-Level Query
            return self.download_admin_level(municipality_name, admin_level)
            
        except Exception as primary_error:
            logger.warning(f"Primary query failed, trying fallback: {primary_error}")
            
            try:
                # Fallback 1: Breitere Suche ohne Admin-Level Filter
                return self.download_without_level_filter(municipality_name)
                
            except Exception as fallback_error:
                logger.error(f"All fallbacks failed: {fallback_error}")
                
                # Fallback 2: Leeres Result zurückgeben
                return {"elements": [], "remark": "fallback_empty_result"}
    
    def download_without_level_filter(self, municipality_name: str) -> Dict:
        """Download ohne Admin-Level Filter für größere Trefferquote"""
        query = f"""
[out:json][timeout:180];
relation["boundary"="administrative"]["name"="{municipality_name}"];
out geom;
"""
        return self.query_overpass(query)
```

### Rate Limiting

```python
class RateLimitedOverpassDownloader(OverpassDownloader):
    """Downloader mit Rate-Limiting"""
    
    def __init__(self, timeout=180, requests_per_minute=30):
        super().__init__(timeout)
        self.requests_per_minute = requests_per_minute
        self.request_times = []
    
    def query_overpass(self, query: str) -> Dict:
        """Rate-limited query execution"""
        self._enforce_rate_limit()
        self.request_times.append(time.time())
        return super().query_overpass(query)
    
    def _enforce_rate_limit(self):
        """Enforce requests per minute limit"""
        now = time.time()
        one_minute_ago = now - 60
        
        # Alte Requests entfernen
        self.request_times = [t for t in self.request_times if t > one_minute_ago]
        
        # Prüfe ob Limit erreicht
        if len(self.request_times) >= self.requests_per_minute:
            sleep_time = 60 - (now - self.request_times[0])
            if sleep_time > 0:
                logger.info(f"Rate limit reached, sleeping for {sleep_time:.1f}s")
                time.sleep(sleep_time)
```

## Performance Monitoring

### Query Performance Tracking

```python
class MonitoredOverpassDownloader(OverpassDownloader):
    """Downloader mit Performance-Monitoring"""
    
    def __init__(self, timeout=180):
        super().__init__(timeout)
        self.metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'average_response_time': 0,
            'endpoint_usage': {}
        }
    
    def query_overpass(self, query: str) -> Dict:
        """Track performance metrics for each query"""
        start_time = time.time()
        self.metrics['total_requests'] += 1
        
        try:
            result = super().query_overpass(query)
            duration = time.time() - start_time
            
            self.metrics['successful_requests'] += 1
            self.metrics['average_response_time'] = self._update_average_time(duration)
            
            # Track endpoint usage
            endpoint = self.ENDPOINTS[self.current_endpoint]
            self.metrics['endpoint_usage'][endpoint] = \
                self.metrics['endpoint_usage'].get(endpoint, 0) + 1
            
            logger.info(f"Query completed in {duration:.2f}s")
            return result
            
        except Exception as e:
            self.metrics['failed_requests'] += 1
            logger.error(f"Query failed after {time.time() - start_time:.2f}s: {e}")
            raise
    
    def _update_average_time(self, new_time: float) -> float:
        """Update running average of response times"""
        total_requests = self.metrics['successful_requests']
        current_avg = self.metrics['average_response_time']
        
        if total_requests == 1:
            return new_time
        else:
            return (current_avg * (total_requests - 1) + new_time) / total_requests
    
    def get_metrics(self) -> Dict:
        """Get current performance metrics"""
        success_rate = (self.metrics['successful_requests'] / self.metrics['total_requests'] * 100) \
            if self.metrics['total_requests'] > 0 else 0
        
        return {
            **self.metrics,
            'success_rate': f"{success_rate:.1f}%",
            'total_endpoints_used': len(self.metrics['endpoint_usage'])
        }
```

## Best Practices

### Query Optimization

```python
# ✅ Korrekt - Spezifische, effiziente Queries
def build_efficient_query(municipality: str, level: int) -> str:
    return f'''
[out:json][timeout:120];
relation["boundary"="administrative"]["admin_level"={level}]["name"="{municipality}"];
out geom;
'''

# ❌ Vermeiden - Zu allgemeine Queries
def build_inefficient_query(municipality: str) -> str:
    return f'''
[out:json];
relation["name"="{municipality}"];
out geom;
'''  # Keine Filter, kann sehr langsam sein
```

### Error Handling

```python
# ✅ Korrekt - Umfassende Fehlerbehandlung
def safe_download(municipality: str, level: int) -> Dict:
    try:
        return downloader.download_admin_level(municipality, level)
    except requests.exceptions.Timeout:
        logger.error(f"Timeout für {municipality} Level {level}")
        return {"elements": [], "error": "timeout"}
    except requests.exceptions.ConnectionError:
        logger.error(f"Verbindungsfehler für {municipality} Level {level}")
        return {"elements": [], "error": "connection"}
    except Exception as e:
        logger.error(f"Unerwarteter Fehler: {e}")
        return {"elements": [], "error": "unknown"}

# ❌ Vermeiden - Unbehandelte Fehler
data = downloader.download_admin_level(municipality, level)  # Kein Error-Handling
```

## Konfiguration

### Environment Settings

```python
# Konfiguration für verschiedene Umgebungen
OVERPASS_CONFIG = {
    'development': {
        'timeout': 180,
        'max_retries': 3,
        'requests_per_minute': 30
    },
    'production': {
        'timeout': 300,
        'max_retries': 5,
        'requests_per_minute': 60
    },
    'testing': {
        'timeout': 60,
        'max_retries': 1,
        'requests_per_minute': 10
    }
}

def create_downloader(environment: str = 'development') -> OverpassDownloader:
    config = OVERPASS_CONFIG[environment]
    return OverpassDownloader(
        timeout=config['timeout'],
        # Weitere Konfiguration...
    )
```

Diese Overpass API Integration bietet eine robuste, performante und skalierbare Lösung für den Zugriff auf OSM-Daten in p2d2, mit umfassendem Load-Balancing, Error-Handling und Monitoring.