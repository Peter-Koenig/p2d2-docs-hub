<template>
    <div class="quality-overview">
        <div class="overview-header">
            <h2>📈 Dokumentations-Qualitätsübersicht</h2>
            <div class="overview-stats">
                <div class="stat">
                    <span class="stat-value">{{ totalDocuments }}</span>
                    <span class="stat-label">Dokumente</span>
                </div>
                <div class="stat">
                    <span class="stat-value">{{ reviewedDocuments }}</span>
                    <span class="stat-label">Geprüft</span>
                </div>
                <div class="stat">
                    <span class="stat-value">{{ averageScore }}%</span>
                    <span class="stat-label">Durchschnitt</span>
                </div>
            </div>
        </div>

        <div class="quality-filters">
            <div class="filter-group">
                <label>Kategorie:</label>
                <select v-model="selectedCategory" @change="filterDocuments">
                    <option value="all">Alle Kategorien</option>
                    <option
                        v-for="category in categories"
                        :key="category"
                        :value="category"
                    >
                        {{ category }}
                    </option>
                </select>
            </div>
            <div class="filter-group">
                <label>Status:</label>
                <select v-model="selectedStatus" @change="filterDocuments">
                    <option value="all">Alle Status</option>
                    <option value="reviewed">Geprüft</option>
                    <option value="pending">Ausstehend</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Qualität:</label>
                <select v-model="selectedQuality" @change="filterDocuments">
                    <option value="all">Alle Qualitäten</option>
                    <option value="sehr-gut">Sehr gut (80-100%)</option>
                    <option value="gut">Gut (60-79%)</option>
                    <option value="ausreichend">Ausreichend (40-59%)</option>
                    <option value="verbesserungsbedarf">
                        Verbesserungsbedarf (0-39%)
                    </option>
                </select>
            </div>
        </div>

        <div class="documents-list">
            <div
                v-for="doc in filteredDocuments"
                :key="doc.path"
                class="document-item"
            >
                <div class="document-info">
                    <h4 class="document-title">
                        <a :href="doc.path" target="_blank">{{ doc.title }}</a>
                    </h4>
                    <div class="document-meta">
                        <span class="document-category">{{
                            doc.category
                        }}</span>
                        <span class="document-path">{{ doc.path }}</span>
                    </div>
                </div>

                <div class="document-quality">
                    <div class="quality-score">
                        <span class="score-value">{{ doc.overallScore }}%</span>
                        <div class="score-bar">
                            <div
                                class="score-fill"
                                :class="doc.qualityClass"
                                :style="{ width: `${doc.overallScore}%` }"
                            ></div>
                        </div>
                    </div>

                    <div class="quality-details">
                        <div class="detail">
                            <span class="detail-label">Vollständigkeit:</span>
                            <span class="detail-value"
                                >{{ doc.quality.completeness }}%</span
                            >
                        </div>
                        <div class="detail">
                            <span class="detail-label">Genauigkeit:</span>
                            <span class="detail-value"
                                >{{ doc.quality.accuracy }}%</span
                            >
                        </div>
                        <div class="detail">
                            <span class="detail-label">Review:</span>
                            <span
                                class="review-badge"
                                :class="
                                    doc.quality.reviewed
                                        ? 'reviewed'
                                        : 'pending'
                                "
                            >
                                {{ doc.quality.reviewed ? "✅" : "⏳" }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="filteredDocuments.length === 0" class="no-results">
            <p>Keine Dokumente entsprechen den ausgewählten Filtern.</p>
        </div>

        <div class="quality-summary">
            <h3>Qualitätsverteilung</h3>
            <div class="distribution">
                <div
                    v-for="range in qualityRanges"
                    :key="range.label"
                    class="distribution-item"
                    :class="range.class"
                >
                    <span class="distribution-label">{{ range.label }}</span>
                    <span class="distribution-count">{{ range.count }}</span>
                    <div class="distribution-bar">
                        <div
                            class="distribution-fill"
                            :style="{ width: `${range.percentage}%` }"
                        ></div>
                    </div>
                    <span class="distribution-percentage"
                        >{{ range.percentage }}%</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// Mock data - in production this would come from an API or frontmatter extraction
const documents = ref([]);

const selectedCategory = ref("all");
const selectedStatus = ref("all");
const selectedQuality = ref("all");

// Extract categories from documents
const categories = computed(() => {
    const cats = new Set();
    documents.value.forEach((doc) => {
        if (doc.category) cats.add(doc.category);
    });
    return Array.from(cats).sort();
});

// Filter documents based on selections
const filteredDocuments = computed(() => {
    let filtered = documents.value;

    if (selectedCategory.value !== "all") {
        filtered = filtered.filter(
            (doc) => doc.category === selectedCategory.value,
        );
    }

    if (selectedStatus.value !== "all") {
        filtered = filtered.filter((doc) =>
            selectedStatus.value === "reviewed"
                ? doc.quality.reviewed
                : !doc.quality.reviewed,
        );
    }

    if (selectedQuality.value !== "all") {
        filtered = filtered.filter(
            (doc) => doc.qualityClass === selectedQuality.value,
        );
    }

    return filtered.sort((a, b) => b.overallScore - a.overallScore);
});

// Statistics
const totalDocuments = computed(() => documents.value.length);
const reviewedDocuments = computed(
    () => documents.value.filter((doc) => doc.quality.reviewed).length,
);
const averageScore = computed(() => {
    if (documents.value.length === 0) return 0;
    const total = documents.value.reduce(
        (sum, doc) => sum + doc.overallScore,
        0,
    );
    return Math.round(total / documents.value.length);
});

// Quality distribution
const qualityRanges = computed(() => {
    const ranges = [
        { label: "Sehr gut", min: 80, max: 100, class: "sehr-gut" },
        { label: "Gut", min: 60, max: 79, class: "gut" },
        { label: "Ausreichend", min: 40, max: 59, class: "ausreichend" },
        {
            label: "Verbesserungsbedarf",
            min: 0,
            max: 39,
            class: "verbesserungsbedarf",
        },
    ];

    return ranges.map((range) => {
        const count = documents.value.filter(
            (doc) =>
                doc.overallScore >= range.min && doc.overallScore <= range.max,
        ).length;
        const percentage =
            totalDocuments.value > 0
                ? Math.round((count / totalDocuments.value) * 100)
                : 0;

        return {
            ...range,
            count,
            percentage,
        };
    });
});

// Filter function
const filterDocuments = () => {
    // Filtering is handled by computed properties
};

// Initialize with mock data
onMounted(() => {
    // This would be replaced with actual data extraction from frontmatter
    documents.value = [
        {
            title: "GDI-Architektur",
            path: "/de/administrationshandbuch/geodateninfrastruktur/gdi-architektur",
            category: "Administration",
            quality: {
                completeness: 85,
                accuracy: 90,
                reviewed: true,
                reviewer: "tech-lead",
                reviewDate: "2025-11-17",
            },
            overallScore: 88,
            qualityClass: "sehr-gut",
        },
        {
            title: "Multi-Branch Deployment",
            path: "/de/administrationshandbuch/deployment/multi-branch-deployment",
            category: "Administration",
            quality: {
                completeness: 70,
                accuracy: 75,
                reviewed: false,
                reviewer: null,
                reviewDate: null,
            },
            overallScore: 73,
            qualityClass: "good",
        },
        {
            title: "Contributing Guidelines",
            path: "/de/entwicklung/contributing",
            category: "Entwicklung",
            quality: {
                completeness: 60,
                accuracy: 65,
                reviewed: true,
                reviewer: "community-manager",
                reviewDate: "2025-11-16",
            },
            overallScore: 63,
            qualityClass: "good",
        },
    ];
});
</script>

<style scoped>
.quality-overview {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

.overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
}

.overview-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.5rem;
}

.overview-stats {
    display: flex;
    gap: 2rem;
}

.stat {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #3b82f6;
}

.stat-label {
    font-size: 0.875rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.quality-filters {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    font-weight: 500;
    color: #475569;
    font-size: 0.875rem;
}

.filter-group select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    font-size: 0.875rem;
}

.documents-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.document-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    transition: box-shadow 0.2s;
}

.document-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.document-info {
    flex: 1;
}

.document-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

.document-title a {
    color: #1e293b;
    text-decoration: none;
}

.document-title a:hover {
    color: #3b82f6;
}

.document-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #64748b;
}

.document-category {
    background: #e2e8f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
}

.document-quality {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.quality-score {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.score-value {
    font-weight: 700;
    font-size: 1.1rem;
    min-width: 3rem;
    text-align: center;
}

.score-bar {
    width: 100px;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}

.score-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.score-fill.excellent {
    background: #10b981;
}

.score-fill.good {
    background: #3b82f6;
}

.score-fill.fair {
    background: #f59e0b;
}

.score-fill.poor {
    background: #ef4444;
}

.quality-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
}

.detail {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
}

.detail-label {
    color: #64748b;
}

.detail-value {
    font-weight: 500;
    color: #1e293b;
}

.review-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.review-badge.reviewed {
    background: #dcfce7;
    color: #166534;
}

.review-badge.pending {
    background: #fef3c7;
    color: #92400e;
}

.no-results {
    text-align: center;
    padding: 3rem;
    color: #64748b;
    font-style: italic;
}

.quality-summary {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;
}

.quality-summary h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
}

.distribution {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.distribution-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
}

.distribution-item.excellent {
    background: #f0fdf4;
}

.distribution-item.good {
    background: #eff6ff;
}

.distribution-item.fair {
    background: #fffbeb;
}

.distribution-item.poor {
    background: #fef2f2;
}

.distribution-label {
    min-width: 150px;
    font-weight: 500;
    color: #1e293b;
}

.distribution-count {
    min-width: 3rem;
    text-align: center;
    font-weight: 600;
    color: #475569;
}

.distribution-bar {
    flex: 1;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}

.distribution-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.distribution-item.excellent .distribution-fill {
    background: #10b981;
}

.distribution-item.good .distribution-fill {
    background: #3b82f6;
}

.distribution-item.fair .distribution-fill {
    background: #f59e0b;
}

.distribution-item.poor .distribution-fill {
    background: #ef4444;
}

.distribution-percentage {
    min-width: 3rem;
    text-align: right;
    font-weight: 600;
    color: #475569;
}

@media (max-width: 768px) {
    .quality-overview {
        padding: 1rem;
    }

    .overview-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }

    .overview-stats {
        gap: 1rem;
    }

    .quality-filters {
        flex-direction: column;
        gap: 1rem;
    }

    .document-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .document-quality {
        width: 100%;
        justify-content: space-between;
    }

    .distribution-item {
        flex-wrap: wrap;
    }

    .distribution-label {
        min-width: 120px;
    }
}
</style>
