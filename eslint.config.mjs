import baseConfig from "./packages/config/eslint/base.js";

export default [
  ...baseConfig,
  {
    ignores: [
      "dist/",
      "node_modules/",
      ".next/",
      ".turbo/",
      "supabase/",
      ".devcontainer/",
    ],
  },
];
