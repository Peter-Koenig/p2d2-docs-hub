---
title: "Testing"
description: "Test-Strategien, empfohlenes Setup und Best Practices für p2d2"
quality:
  completeness: 80
  accuracy: 90
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Testing

## Übersicht

Diese Dokumentation beschreibt die Test-Strategien und empfohlenen Setups für die p2d2-Anwendung. Der Fokus liegt auf Unit-Tests für Utility-Funktionen, Integrationstests für OpenLayers-Komponenten und E2E-Tests für Benutzerinteraktionen.

## Aktueller Status

**Testing:** Aktuell nicht implementiert

Das p2d2-Projekt verfügt derzeit über keine automatisierten Tests. Alle Tests werden manuell durchgeführt.

## Empfohlenes Test-Setup

### Test-Framework: Vitest

**Empfohlenes Setup:**
```bash
# Vitest mit TypeScript und DOM-Support
npm install --save-dev vitest @vitest/ui happy-dom @vitest/coverage-v8

# Testing Library für Komponenten-Tests
npm install --save-dev @testing-library/vue @testing-library/jest-dom

# Playwright für E2E-Tests
npm install --save-dev @playwright/test
```

### package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/']
    },
    setupFiles: ['./test-setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@utils': resolve(__dirname, './src/utils')
    }
  }
});
```

## Test-Typen

### Unit-Tests für Utility-Funktionen

**Test-Struktur:**
```
src/utils/__tests__/
├── crs.test.ts
├── events.test.ts
├── layer-management.test.ts
└── storage.test.ts
```

**Beispiel: CRS Utility Tests**
```typescript
// src/utils/__tests__/crs.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerUtm, isValidWgs84Coordinate, transformCoordinate } from '../crs';

describe('CRS Utilities', () => {
  beforeEach(() => {
    // Reset vor jedem Test
    (window as any).proj4 = undefined;
  });

  describe('isValidWgs84Coordinate', () => {
    it('should validate correct WGS84 coordinates', () => {
      expect(isValidWgs84Coordinate([6.9578, 50.9375])).toBe(true);
      expect(isValidWgs84Coordinate([0, 0])).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(isValidWgs84Coordinate([200, 100])).toBe(false);
      expect(isValidWgs84Coordinate(['6.9578', '50.9375'])).toBe(false);
      expect(isValidWgs84Coordinate(null)).toBe(false);
      expect(isValidWgs84Coordinate(undefined)).toBe(false);
    });
  });

  describe('registerUtm', () => {
    it('should register known UTM projections', () => {
      const result = registerUtm('EPSG:25832');
      expect(result).toBe(true);
    });

    it('should return false for unknown projections', () => {
      const result = registerUtm('EPSG:99999');
      expect(result).toBe(false);
    });
  });

  describe('transformCoordinate', () => {
    it('should transform WGS84 to UTM', () => {
      registerUtm('EPSG:25832');
      const wgs84 = [6.9578, 50.9375]; // Köln
      const utm = transformCoordinate(wgs84, 'EPSG:4326', 'EPSG:25832');
      
      expect(utm).toBeDefined();
      expect(Array.isArray(utm)).toBe(true);
      expect(utm!.length).toBe(2);
      expect(utm![0]).toBeCloseTo(356000, -2);
      expect(utm![1]).toBeCloseTo(5645000, -2);
    });

    it('should return null for invalid transformations', () => {
      const result = transformCoordinate([0, 0], 'EPSG:4326', 'EPSG:INVALID');
      expect(result).toBeNull();
    });
  });
});
```

### Event System Tests

```typescript
// src/utils/__tests__/events.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  dispatchThrottledEvent, 
  addEventListener, 
  getSelectedCRS, 
  setSelectedCRS 
} from '../events';

describe('Event System', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('dispatchThrottledEvent', () => {
    it('should dispatch events in browser environment', () => {
      const mockDispatch = vi.spyOn(window, 'dispatchEvent');
      
      dispatchThrottledEvent('test-event', { data: 'test' });
      
      expect(mockDispatch).toHaveBeenCalled();
      const event = mockDispatch.mock.calls[0][0];
      expect(event.type).toBe('test-event');
      expect(event.detail).toEqual({ data: 'test' });
    });

    it('should throttle rapid events', () => {
      const mockDispatch = vi.spyOn(window, 'dispatchEvent');
      
      // Multiple rapid calls
      dispatchThrottledEvent('throttled-event', {}, 100);
      dispatchThrottledEvent('throttled-event', {}, 100);
      dispatchThrottledEvent('throttled-event', {}, 100);
      
      // Should only dispatch once due to throttling
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Storage Utilities', () => {
    it('should get and set CRS from localStorage', () => {
      const mockGetItem = vi.mocked(localStorage.getItem);
      const mockSetItem = vi.mocked(localStorage.setItem);
      
      mockGetItem.mockReturnValue('EPSG:25832');
      
      const crs = getSelectedCRS();
      expect(crs).toBe('EPSG:25832');
      expect(mockGetItem).toHaveBeenCalledWith('p2d2_selected_crs');
      
      setSelectedCRS('EPSG:4326');
      expect(mockSetItem).toHaveBeenCalledWith('p2d2_selected_crs', 'EPSG:4326');
    });
  });
});
```

### Integration Tests für OpenLayers

```typescript
// src/utils/__tests__/layer-management.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import Map from 'ol/Map';
import View from 'ol/View';
import { registerUtm } from '../crs';
import { createLuftbildLayer, createWfsLayer } from '../layer-management';

describe('Layer Management', () => {
  let map: Map;

  beforeEach(() => {
    registerUtm('EPSG:25832');
    
    map = new Map({
      view: new View({
        center: [0, 0],
        zoom: 1,
        projection: 'EPSG:25832'
      })
    });
  });

  describe('createLuftbildLayer', () => {
    it('should create a tile layer with correct configuration', () => {
      const layer = createLuftbildLayer();
      
      expect(layer).toBeDefined();
      expect(layer.getVisible()).toBe(true);
      expect(layer.getZIndex()).toBe(0);
    });
  });

  describe('createWfsLayer', () => {
    it('should create a vector layer for WFS data', () => {
      const layer = createWfsLayer('https://example.com/wfs');
      
      expect(layer).toBeDefined();
      expect(layer.getSource()).toBeDefined();
    });

    it('should handle layer visibility', () => {
      const layer = createWfsLayer('https://example.com/wfs', false);
      expect(layer.getVisible()).toBe(false);
    });
  });
});
```

## E2E-Tests mit Playwright

### Playwright Konfiguration

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Beispiele

```typescript
// tests/e2e/map-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Map Navigation', () => {
  test('should display Köln map with correct projection', async ({ page }) => {
    await page.goto('/kommunen/koeln');
    
    // Map container should be visible
    await expect(page.locator('#map')).toBeVisible();
    
    // Köln should be mentioned
    await expect(page.locator('text=Köln')).toBeVisible();
    
    // Projection selector should work
    await page.selectOption('select[name="projection"]', 'EPSG:25832');
    await expect(page.locator('text=UTM Zone 32N')).toBeVisible();
  });

  test('should handle layer toggling', async ({ page }) => {
    await page.goto('/');
    
    // Toggle Luftbild layer
    const luftbildToggle = page.locator('input[name="luftbild"]');
    await luftbildToggle.click();
    
    // Verify layer state
    await expect(luftbildToggle).toBeChecked();
  });

  test('should sync map state with URL', async ({ page }) => {
    await page.goto('/?center=6.9578,50.9375&zoom=12');
    
    // Map should reflect URL parameters
    const mapCenter = await page.evaluate(() => {
      return window.map?.getView().getCenter();
    });
    
    expect(mapCenter).toBeDefined();
    // Additional assertions for center coordinates
  });
});
```

### API Integration Tests

```typescript
// tests/e2e/api-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should proxy WFS requests', async ({ page }) => {
    // Mock WFS response
    await page.route('**/api/wfs-proxy*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: '<wfs:FeatureCollection>...</wfs:FeatureCollection>'
      });
    });

    await page.goto('/');
    
    // Trigger WFS request
    await page.click('button[data-testid="load-wfs"]');
    
    // Verify request was made
    await expect(page.locator('[data-testid="wfs-data"]')).toBeVisible();
  });

  test('should handle WFS errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/wfs-proxy*', async route => {
      await route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    await page.goto('/');
    await page.click('button[data-testid="load-wfs"]');
    
    // Should display error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

## Test-Strategien

### Was testen

**High Priority:**
1. **Utility-Funktionen** - CRS, Events, Storage
2. **API-Endpoints** - WFS-Proxy, Polygon-Sync
3. **Core Business Logic** - Koordinatentransformation, Layer-Management

**Medium Priority:**
1. **UI-Komponenten** - Map, Controls, Cards
2. **Integration** - Map mit Layers, Event-System
3. **Performance** - Rendering, Memory Usage

**Low Priority:**
1. **Visual Regression** - Layout, Styling
2. **Accessibility** - Screen Reader, Keyboard Navigation

### Was NICHT testen

- **Deployment-Prozesse** (→ Verweis auf Deployment-Docs)
- **Server-Konfiguration** (→ Verweis auf Admin-Handbuch)
- **Third-Party Services** (Mocking verwenden)

## Test-Daten

### Mock-Daten für Tests

```typescript
// tests/fixtures/map-data.ts
export const mockKommuneData = {
  slug: 'koeln',
  name: 'Köln',
  center: [6.9578, 50.9375] as [number, number],
  extent: [6.75, 50.8, 7.15, 51.05] as [number, number, number, number],
  population: 1086000
};

export const mockWfsResponse = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs">
  <gml:featureMember>
    <!-- Feature data -->
  </gml:featureMember>
</wfs:FeatureCollection>`;

export const mockCoordinateData = {
  validWgs84: [6.9578, 50.9375] as [number, number],
  invalidWgs84: [200, 100] as [number, number],
  utm32n: [356000, 5645000] as [number, number]
};
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## Best Practices

### Test-Naming

```typescript
// ✅ Gut - Deskriptive Test-Namen
describe('Coordinate Transformation', () => {
  it('should transform WGS84 to UTM Zone 32N correctly', () => {
    // Test implementation
  });
  
  it('should return null for invalid source CRS', () => {
    // Test implementation
  });
});

// ❌ Schlecht - Vage Test-Namen
describe('CRS', () => {
  it('should work', () => {
    // Unklar was getestet wird
  });
});
```

### Test-Isolation

```typescript
// ✅ Gut - Isolierte Tests
describe('Event System', () => {
  beforeEach(() => {
    // Reset global state
    window.localStorage.clear();
    // Reset event listeners
    document.removeEventListener('p2d2-event', handler);
  });
  
  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });
});
```

### Mocking Strategy

```typescript
// ✅ Gut - Gezieltes Mocking
describe('WFS Integration', () => {
  it('should handle successful WFS requests', async () => {
    // Mock only the WFS API call
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockWfsResponse)
    } as Response);
    
    // Test implementation
  });
});
```

## Debugging

### Test-Debugging in VS Code

**.vscode/launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### Browser Debugging für E2E-Tests

```typescript
test('debug map interaction', async ({ page }) => {
  await page.goto('/');
  
  // Pause test execution for manual inspection
  await page.pause();
  
  // Or use slow motion for observation
  await page.click('button', { slowMo: 1000 });
});
```

## Metriken und Reporting

### Coverage-Ziele

