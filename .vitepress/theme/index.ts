import DefaultTheme from "vitepress/theme";
import "./custom.css";
import { h } from "vue";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "doc-before": () =>
        h("div", { class: "work-in-progress-banner" }, [
          h("strong", "⚠️ Work in Progress: "),
          "Diese Dokumentation befindet sich im Aufbau und enthält noch viele Platzhalter und spekulative Inhalte. ",
          h(
            "a",
            {
              href: "https://gitlab.opencode.de/OC000028072444/p2d2-docs/-/issues",
              target: "_blank",
            },
            "Feedback willkommen!",
          ),
        ]),
    });
  },
};
