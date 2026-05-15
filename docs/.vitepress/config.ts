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
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "How-to", link: "/how-to/" },
      { text: "Reference", link: "/reference/" },
      { text: "Explanation", link: "/explanation/" },
      { text: "Development", link: "/development/contributing" },
      {
        text: "npm",
        link: "https://www.npmjs.com/package/@maxiviper117/pnpm-mature",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          collapsed: false,
          items: [
            { text: "Overview", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
      ],
      "/how-to/": [
        {
          text: "How-to",
          collapsed: false,
          items: [
            { text: "Overview", link: "/how-to/" },
            { text: "Run a Dry Run", link: "/how-to/dry-run" },
            { text: "Use with CI", link: "/how-to/use-with-ci" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          collapsed: false,
          items: [
            { text: "Overview", link: "/reference/" },
            { text: "CLI", link: "/reference/cli" },
            { text: "Supported Dependencies", link: "/reference/supported-dependencies" },
          ],
        },
      ],
      "/explanation/": [
        {
          text: "Explanation",
          collapsed: false,
          items: [
            { text: "Overview", link: "/explanation/" },
            { text: "How It Works", link: "/explanation/how-it-works" },
          ],
        },
      ],
      "/development/": [
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
