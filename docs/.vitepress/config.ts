import { defineConfig } from "vitepress";

export default defineConfig({
  title: "pnpm-mature",
  description: "Age-constrained dependency updates for pnpm using registry release dates.",
  base: "/pnpm-mature/",
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: "https://maxiviper117.github.io/pnpm-mature",
  },

  markdown: {
    lineNumbers: true,
  },

  themeConfig: {
    sidebar: {
      "/": [
        {
          text: "Guide",
          collapsed: false,
          items: [
            { text: "Overview", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "How-to",
          collapsed: false,
          items: [
            { text: "Overview", link: "/how-to/" },
            { text: "Run a Dry Run", link: "/how-to/dry-run" },
            { text: "Write Without pnpm", link: "/how-to/write-only" },
          ],
        },
        {
          text: "Reference",
          collapsed: false,
          items: [
            { text: "Overview", link: "/reference/" },
            { text: "CLI", link: "/reference/cli" },
            { text: "Supported Dependencies", link: "/reference/supported-dependencies" },
          ],
        },
        {
          text: "Explanation",
          collapsed: false,
          items: [
            { text: "Overview", link: "/explanation/" },
            { text: "How It Works", link: "/explanation/how-it-works" },
          ],
        },
        {
          text: "Development",
          collapsed: false,
          items: [{ text: "Contributing", link: "/development/contributing" }],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Maxiviper117/pnpm-mature" }],

    search: {
      provider: "local",
    },

    editLink: {
      pattern: "https://github.com/Maxiviper117/pnpm-mature/edit/main/docs/:path",
    },
  },
});
