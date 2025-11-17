---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Municipal Level

The expansion to additional municipalities follows a structured approach.

## Pilot City: Cologne

**Status**: Productive since 2024

**Successes**:
- 25 cemeteries recorded
- 5 active QC reviewers
- 50+ community members
- Integration into OpenData portal

**Learnings**:
- Administrative buy-in is crucial
- Community needs motivation (gamification)
- Data quality in OpenData portal varies
- Synchronization OSM ↔ Administration needs clear processes

## Next Cities

### Bonn (2025)

**Why Bonn?**
- Geographic proximity to Cologne
- Active OSM community
- Progressive administration (Open Government)

**Planned**:
- Start with cemeteries (familiar territory)
- Parallel: Monuments (Bonn has many!)
- Cooperation with city archive

### Additional NRW Municipalities (2026)

- **Düsseldorf**: Large city, strong IT infrastructure
- **Aachen**: Border city, international community
- **Münster**: Bicycle city, cycle paths category

## Requirements for New Municipalities

### Technical

- **OpenData portal**: Must be available
- **GIS capability**: Administration should use GIS
- **API access**: Automated data import

### Organizational

- **Contact person**: At least one person in administration
- **Data license**: Data must be openly licensed (CC0, CC-BY)
- **Commitment**: Long-term cooperation

### Community

- **OSM community**: Local OSM mappers available
- **Civic tech**: Interest in open data

## Multi-Tenancy Architecture

### Technical Implementation

```
┌─────────────────────────────────┐
│       p2d2 Platform             │
├─────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │Cologne│ │Bonn │ │ Ddf │     │
│  └──┬──┘  └──┬──┘  └──┬──┘     │
│     │        │        │         │
│  ┌──▼────────▼────────▼──┐     │
│  │   Shared Services    │     │
│  └────────────────────────┘     │
└─────────────────────────────────┘
```

### Schema Isolation

```
-- One schema per municipality
CREATE SCHEMA cologne;
CREATE SCHEMA bonn;

-- Common user database
CREATE SCHEMA users;
```

### URL Routing

```
https://cologne.data-dna.eu
https://bonn.data-dna.eu
https://duesseldorf.data-dna.eu
```

## Onboarding Process

### Step 1: Preliminary Discussion

- Get to know each other
- Clarify expectations
- Check technical requirements

### Step 2: Data Analysis

- Review OpenData portal data
- Evaluate data quality
- Select categories

### Step 3: Setup

- Create tenant in p2d2
- Configure data import
- Initial seeding

### Step 4: Training

- Train administrative employees
- Community kickoff event
- Provide documentation

### Step 5: Go-Live

- Start production operation
- Set up monitoring
- Provide support

## Shared Services

### Central Services

- **Authentication**: OAuth2/OIDC
- **API Gateway**: Rate-limiting, caching
- **Monitoring**: Prometheus, Grafana
- **Backup**: Proxmox PBS

### Municipality-specific Services

- **GeoServer workspace**: One workspace per municipality
- **Database schema**: One schema per municipality
- **Frontend customization**: Logo, colors

## Cost Model

### Free Tier (Pilot)

- Up to 1000 features
- Community support
- Shared infrastructure

### Municipality Tier

- Unlimited features
- Dedicated support
- SLA 99.5%
- Costs: Based on effort (hosting + support)

### Enterprise Tier

- Dedicated infrastructure
- On-premise possible
- Custom development
- Costs: Individual

::: tip Municipality interested?
Contact us for a non-binding preliminary discussion!
:::