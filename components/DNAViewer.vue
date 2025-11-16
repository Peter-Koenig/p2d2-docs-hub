<template>
    <div ref="container" class="dna-viewer-container">
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading DNA structure...</p>
        </div>
        <div v-else-if="error" class="error-state">
            <p>Failed to load DNA visualization</p>
            <button @click="retry" class="retry-button">Retry</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const container = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref(false);
let viewer: any = null;
let animationFrame: number | null = null;

const retry = () => {
    error.value = false;
    loading.value = true;
    initializeViewer();
};

const loadMolstarScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if ((window as any).molstar) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src =
            "https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Mol* script"));
        document.head.appendChild(script);
    });
};

const initializeViewer = async () => {
    if (!container.value) return;

    try {
        await loadMolstarScript();

        const molstar = (window as any).molstar;

        viewer = await molstar.Viewer.create(container.value, {
            layoutIsExpanded: false,
            layoutShowControls: false,
            layoutShowLog: false,
            layoutShowLeftPanel: false,
            layoutShowRemoteState: false,
            viewportShowExpand: false,
            viewportShowSelectionMode: false,
            viewportShowAnimation: false,
            viewportShowControls: false,
            viewportShowSettings: false,
            canvas3d: {
                alpha: true,
            },
        });

        await viewer.loadStructureFromUrl(
            "https://files.rcsb.org/download/1BNA.cif",
            "mmcif",
            false,
        );

        const canvas3d = viewer.plugin.canvas3d;

        await canvas3d.setProps({
            renderer: {
                backgroundColor: 0xffffff,
                backgroundAlpha: 0.0,
            },
        });

        // KEINE Auto-Rotation mehr - verursacht Fehler
        // Die DNA bleibt statisch, User können manuell drehen

        loading.value = false;
    } catch (err) {
        console.error("Failed to initialize DNA viewer:", err);
        error.value = true;
        loading.value = false;
    }
};

onMounted(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                initializeViewer();
                observer.disconnect();
            }
        },
        { threshold: 0.1, rootMargin: "50px" },
    );

    if (container.value) {
        observer.observe(container.value);
    }
});

onUnmounted(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (viewer) viewer.dispose();
});
</script>

<style scoped>
.dna-viewer-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: transparent;
}

.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgba(12, 74, 110, 0.85);
    color: white;
    text-align: center;
    border-radius: 8px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.error-state p {
    margin-bottom: 16px;
    font-size: 16px;
}

.retry-button {
    padding: 8px 16px;
    background: white;
    color: #0369a1;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.retry-button:hover {
    background: #f0f9ff;
}

@media (max-width: 768px) {
    .dna-viewer-container {
        min-height: 300px;
    }
}
</style>
