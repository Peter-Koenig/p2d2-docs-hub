import DefaultTheme from "vitepress/theme";
import "./custom.css";
import { h } from "vue";
import { useData } from "vitepress";
import DNAViewer from "../../components/DNAViewer.vue";
import QualityStatus from "./components/QualityStatus.vue";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "doc-before": () => {
        const { frontmatter } = useData();

        const elements = [];

        // Quality Status Badge (wenn vorhanden)
        if (frontmatter.value?.quality) {
          elements.push(
            h(QualityStatus, { quality: frontmatter.value.quality }),
          );
        }

        // // Work-in-Progress Banner
        // elements.push(
        //   h("div", { class: "work-in-progress-banner" }, [
        //     h("strong", "⚠️ Work in Progress: "),
        //     "Diese Dokumentation befindet sich im Aufbau und enthält noch viele Platzhalter und spekulative Inhalte. ",
        //     h(
        //       "a",
        //       {
        //         href: "https://gitlab.opencode.de/OC000028072444/p2d2-docs/-/issues",
        //         target: "_blank",
        //       },
        //       "Feedback willkommen!",
        //     ),
        //   ]),
        // );

        return h("div", {}, elements);
      },
      "home-hero-image": () =>
        h("div", { class: "custom-hero-image" }, [h(DNAViewer)]),
    });
  },
  enhanceApp({ app }) {
    app.component("DNAViewer", DNAViewer);
    app.component("QualityStatus", QualityStatus);
  },
};
