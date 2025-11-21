<script setup lang="ts">
import { computed } from "vue";

function formatGermanDate(dateString: string | null | undefined): string {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, "0");
    const monthNames = [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}. ${month} ${year}`;
}

interface QualityMetrics {
    completeness: number;
    accuracy: number;
    reviewed: boolean;
    reviewer?: string | null;
    reviewDate?: string | null;
}

const props = defineProps<{
    quality: QualityMetrics;
}>();

const overallScore = computed(() => {
    const base = (props.quality.completeness + props.quality.accuracy) / 2;
    return props.quality.reviewed ? base : Math.round(base * 0.8);
});

const qualityClass = computed(() => {
    const score = overallScore.value;
    if (score >= 80) return "sehr-gut";
    if (score >= 60) return "gut";
    if (score >= 40) return "ausreichend";
    return "verbesserungsbedarf";
});

const statusLabel = computed(() => {
    if (props.quality.reviewed) return "Geprüft";
    const score = overallScore.value;
    if (score >= 80) return "Entwurf (sehr gut)";
    if (score >= 60) return "Entwurf (gut)";
    return "In Arbeit";
});
</script>

<template>
    <div class="quality-status" :class="`quality-${qualityClass}`">
        <div class="status-header">
            <span class="status-icon">
                {{
                    qualityClass === "sehr-gut"
                        ? "✅"
                        : qualityClass === "gut"
                          ? "🔵"
                          : qualityClass === "ausreichend"
                            ? "🟡"
                            : "🔴"
                }}
            </span>
            <span class="status-label">{{ statusLabel }}</span>
            <span class="status-score">{{ Math.round(overallScore) }}%</span>
        </div>

        <div class="status-details">
            <div class="metric">
                <span class="metric-label">Vollständigkeit:</span>
                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        :style="{ width: `${props.quality.completeness}%` }"
                    ></div>
                </div>
                <span class="metric-value"
                    >{{ props.quality.completeness }}%</span
                >
            </div>

            <div class="metric">
                <span class="metric-label">Korrektheit:</span>
                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        :style="{ width: `${props.quality.accuracy}%` }"
                    ></div>
                </div>
                <span class="metric-value">{{ props.quality.accuracy }}%</span>
            </div>

            <div
                v-if="props.quality.reviewed && props.quality.reviewer"
                class="review-info"
            >
                ✓ Geprüft von <strong>{{ props.quality.reviewer }}</strong> am
                {{ formatGermanDate(props.quality.reviewDate) }}
            </div>
            <div v-else class="review-info pending">⏳ Noch nicht geprüft</div>
        </div>
    </div>
</template>

<style scoped>
.quality-status {
    margin: 1.5rem 0;
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid;
    background: var(--vp-c-bg-soft);
}

.quality-sehr-gut {
    border-color: #10b981;
}
.quality-gut {
    border-color: #3b82f6;
}
.quality-ausreichend {
    border-color: #f59e0b;
}
.quality-verbesserungsbedarf {
    border-color: #ef4444;
}

.status-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    margin-bottom: 1rem;
    font-size: 1.1em;
}

.status-icon {
    font-size: 1.5em;
}

.status-score {
    margin-left: auto;
    font-size: 1.2em;
    color: var(--vp-c-brand);
}

.status-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.metric {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.metric-label {
    min-width: 120px;
    font-size: 0.9em;
    color: var(--vp-c-text-2);
}

.progress-bar {
    flex: 1;
    height: 12px;
    background: var(--vp-c-bg-elv);
    border-radius: 6px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #3b82f6);
    transition: width 0.3s ease;
}

.metric-value {
    min-width: 45px;
    text-align: right;
    font-weight: 600;
    color: var(--vp-c-text-1);
}

.review-info {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #ecfdf5;
    border-radius: 4px;
    font-size: 0.9em;
    color: #059669;
}

.review-info.pending {
    background: #fffbeb;
    color: #d97706;
}
</style>
