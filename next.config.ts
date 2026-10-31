import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      { source: "/board", destination: "/work/board", permanent: false },
      { source: "/timeline", destination: "/work/timeline", permanent: false },
      { source: "/inbox", destination: "/work/inbox", permanent: false },
      { source: "/team", destination: "/people", permanent: false },
      { source: "/voices", destination: "/voice", permanent: false },
      { source: "/meetings", destination: "/voice/meetings", permanent: false },
      { source: "/scorecard", destination: "/insights", permanent: false },
      {
        source: "/people/team",
        destination: "/people",
        permanent: false,
      },
      {
        source: "/voice/voices",
        destination: "/voice",
        permanent: false,
      },
      {
        source: "/insights/scorecard",
        destination: "/insights",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
