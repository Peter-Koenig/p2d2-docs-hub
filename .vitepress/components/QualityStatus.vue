<template>
  <div class="quality-status" :class="statusClass">
    <div class="quality-header">
      <h3>📊 Dokumenten-Qualität</h3>
      <span class="quality-badge" :class="overallClass">
        {{ overallScore }}%
      </span>
    </div>

    <div class="quality-metrics">
      <div class="metric">
        <span class="metric-label">Vollständigkeit:</span>
        <div class="metric-bar">
          <div
            class="metric-fill"
            :class="getScoreClass(quality.completeness)"
            :style="{ width: `${quality.completeness}%` }"
          ></div>
          <span class="metric-value">{{ quality.completeness }}%</span>
        </div>
      </div>

      <div class="metric">
        <span class="metric-label">Genauigkeit:</span>
        <div class="metric-bar">
          <div
            class="metric-fill"
            :class="getScoreClass(quality.accuracy)"
            :style="{ width: `${quality.accuracy}%` }"
          ></div>
          <span class="metric-value">{{ quality.accuracy }}%</span>
        </div>
      </div>

      <div class="metric">
        <span class="metric-label">Review-Status:</span>
        <div class="review-status" :class="quality.reviewed ? 'reviewed' : 'pending'">
          {{ quality.reviewed ? '✅ Geprüft' : '⏳ Ausstehend' }}
          <span v-if="quality.reviewed && quality.reviewDate" class="review-date">
            ({{ formatDate(quality.reviewDate) }})
          </span>
        </div>
      </div>

      <div v-if="quality.reviewer" class="metric">
        <span class="metric-label">Prüfer:</span>
        <span class="reviewer">{{ quality.reviewer }}</span>
      </div>
    </div>

    <div v-if="!quality.reviewed" class="quality-actions">
      <button class="action-btn" @click="$emit('request-review')">
        🔍 Review anfordern
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  quality: {
    type: Object,
    required: true,
    default: () => ({
      completeness: 0,
      accuracy: 0,
      reviewed: false,
      reviewer: null,
      reviewDate: null
    })
  }
})

defineEmits(['request-review'])

const overallScore = computed(() => {
  return Math.round((props.quality.completeness + props.quality.accuracy) / 2)
})

const overallClass = computed(() => {
  if (overallScore.value >= 80) return 'excellent'
  if (overallScore.value >= 60) return 'good'
  if (overallScore.value >= 40) return 'fair'
  return 'poor'
})

const statusClass = computed(() => {
  return {
    'quality-excellent': overallScore.value >= 80,
    'quality-good': overallScore.value >= 60 && overallScore.value < 80,
    'quality-fair': overallScore.value >= 40 && overallScore.value < 60,
    'quality-poor': overallScore.value < 40,
    'quality-reviewed': props.quality.reviewed
  }
})

const getScoreClass = (score) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-fair'
  return 'score-poor'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('de-DE')
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.quality-status {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  background: #f8fafc;
}

.quality-status.quality-excellent {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}

.quality-status.quality-good {
  border-left: 4px solid #3b82f6;
  background: #eff6ff;
}

.quality-status.quality-fair {
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

.quality-status.quality-poor {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
}

.quality-status.quality-reviewed {
  border-top: 2px solid #10b981;
}

.quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.quality-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.quality-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
}

.quality-badge.excellent {
  background: #10b981;
}

.quality-badge.good {
  background: #3b82f6;
}

.quality-badge.fair {
  background: #f59e0b;
}

.quality-badge.poor {
  background: #ef4444;
}

.quality-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-label {
  min-width: 120px;
  font-weight: 500;
  color: #475569;
  font-size: 0.875rem;
}

.metric-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e2e8f0;
  border-radius: 4px;
  height: 24px;
  position: relative;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.metric-fill.score-excellent {
  background: #10b981;
}

.metric-fill.score-good {
  background: #3b82f6;
}

.metric-fill.score-fair {
  background: #f59e0b;
}

.metric-fill.score-poor {
  background: #ef4444;
}

.metric-value {
  position: absolute;
  right: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  z-index: 1;
}

.review-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.review-status.reviewed {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.review-status.pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.review-date {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.5rem;
}

.reviewer {
  font-weight: 500;
  color: #1e293b;
}

.quality-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.action-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #2563eb;
}

@media (max-width: 640px) {
  .metric {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .metric-label {
    min-width: auto;
  }

  .metric-bar {
    width: 100%;
  }
}
</style>
