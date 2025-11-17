<script setup lang="ts">
import { computed } from 'vue'

interface Document {
  title: string
  path: string
  category: string
  quality: {
    completeness: number
    accuracy: number
    reviewed: boolean
    overallScore: number
  }
  qualityClass: string
}

const props = defineProps<{
  documents: Document[]
}>()

const getIcon = (qualityClass: string) => {
  switch (qualityClass) {
    case 'sehr-gut': return '✅'
    case 'gut': return '🔵'
    case 'ausreichend': return '🟡'
    default: return '🔴'
  }
}

const getLabel = (qualityClass: string) => {
  switch (qualityClass) {
    case 'sehr-gut': return 'Sehr gut'
    case 'gut': return 'Gut'
    case 'ausreichend': return 'Ausreichend'
    default: return 'Verbesserungsbedarf'
  }
}

const stats = computed(() => ({
  total: props.documents.length,
  reviewed: props.documents.filter(d => d.quality.reviewed).length,
  average: props.documents.length > 0
    ? Math.round(
        props.documents.reduce((sum, d) => sum + d.quality.overallScore, 0) / props.documents.length
      )
    : 0
}))

const qualityDistribution = computed(() => {
  const distribution = {
    'sehr-gut': 0,
    'gut': 0,
    'ausreichend': 0,
    'verbesserungsbedarf': 0
  }

  props.documents.forEach(doc => {
    distribution[doc.qualityClass]++
  })

  return Object.entries(distribution).map(([key, count]) => ({
    class: key,
    label: getLabel(key),
    count,
    percentage: props.documents.length > 0 ? Math.round((count / props.documents.length) * 100) : 0
  }))
})
</script>

<template>
  <div class="quality-overview">
    <div class="overview-header">
      <h2>📊 Dokumentations-Qualitätsübersicht</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Dokumente</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.reviewed }}</div>
          <div class="stat-label">Geprüft</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.average }}%</div>
          <div class="stat-label">Durchschnitt</div>
        </div>
      </div>
    </div>

    <div class="quality-distribution">
      <h3>Qualitätsverteilung</h3>
      <div class="distribution-grid">
        <div
          v-for="item in qualityDistribution"
          :key="item.class"
          class="distribution-item"
          :class="`quality-${item.class}`"
        >
          <div class="distribution-header">
            <span class="distribution-icon">{{ getIcon(item.class) }}</span>
            <span class="distribution-label">{{ item.label }}</span>
          </div>
          <div class="distribution-count">{{ item.count }}</div>
          <div class="distribution-bar">
            <div
              class="distribution-fill"
              :style="{ width: `${item.percentage}%` }"
            ></div>
          </div>
          <div class="distribution-percentage">{{ item.percentage }}%</div>
        </div>
      </div>
    </div>

    <div class="documents-section">
      <h3>Alle Dokumente</h3>
      <div class="documents-list">
        <div v-for="doc in documents" :key="doc.path" class="doc-item">
          <a :href="doc.path" class="doc-link">
            <span class="doc-icon">{{ getIcon(doc.qualityClass) }}</span>
            <div class="doc-info">
              <div class="doc-title">{{ doc.title }}</div>
              <div class="doc-meta">
                <span class="doc-category">{{ doc.category }}</span>
                <span class="doc-path">{{ doc.path }}</span>
              </div>
            </div>
            <div class="doc-quality">
              <div class="doc-score">{{ doc.quality.overallScore }}%</div>
              <div class="doc-status" :class="doc.quality.reviewed ? 'reviewed' : 'pending'">
                {{ doc.quality.reviewed ? '✅' : '⏳' }}
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>

    <div v-if="documents.length === 0" class="no-documents">
      <p>Keine Dokumente mit Quality-Metriken gefunden.</p>
    </div>
  </div>
</template>

<style scoped>
.quality-overview {
  max-width: 1000px;
  margin: 0 auto;
}

.overview-header {
  margin-bottom: 2rem;
}

.overview-header h2 {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-1);
  font-size: 1.8rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--vp-c-divider);
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: var(--vp-c-brand);
  line-height: 1;
}

.stat-label {
  margin-top: 0.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.quality-distribution {
  margin-bottom: 2rem;
}

.quality-distribution h3 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.distribution-item {
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
  background: var(--vp-c-bg-soft);
}

.quality-sehr-gut { border-color: #10b981; }
.quality-gut { border-color: #3b82f6; }
.quality-ausreichend { border-color: #f59e0b; }
.quality-verbesserungsbedarf { border-color: #ef4444; }

.distribution-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.distribution-icon {
  font-size: 1.2em;
}

.distribution-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.distribution-count {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--vp-c-brand);
  margin-bottom: 0.5rem;
}

.distribution-bar {
  height: 8px;
  background: var(--vp-c-bg-elv);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.distribution-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.quality-sehr-gut .distribution-fill { background: #10b981; }
.quality-gut .distribution-fill { background: #3b82f6; }
.quality-ausreichend .distribution-fill { background: #f59e0b; }
.quality-verbesserungsbedarf .distribution-fill { background: #ef4444; }

.distribution-percentage {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  text-align: right;
}

.documents-section h3 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.doc-item {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.2s;
}

.doc-item:hover {
  border-color: var(--vp-c-brand);
}

.doc-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}

.doc-link:hover {
  background: var(--vp-c-bg-soft);
}

.doc-icon {
  font-size: 1.5em;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 0.25rem;
}

.doc-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85em;
  color: var(--vp-c-text-2);
}

.doc-category {
  background: var(--vp-c-bg-elv);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.doc-quality {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.doc-score {
  font-weight: 600;
  font-size: 1.1em;
  color: var(--vp-c-brand);
}

.doc-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
}

.doc-status.reviewed {
  background: #dcfce7;
  color: #166534;
}

.doc-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.no-documents {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-2);
  font-style: italic;
}

@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .distribution-grid {
    grid-template-columns: 1fr;
  }

  .doc-link {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .doc-quality {
    align-self: flex-end;
  }

  .doc-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
