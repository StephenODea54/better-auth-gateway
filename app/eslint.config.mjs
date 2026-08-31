import antfu from "@antfu/eslint-config";
import drizzle from "eslint-plugin-drizzle";
import perfectionist from "eslint-plugin-perfectionist";

export default antfu({
  formatters: true,
  ignores: [
    "src/routeTree.gen.ts",
    "src/db/schema/auth-schema.ts",
    "src/db/migrations/**",
  ],
  react: true,
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true,
  },
  type: "app",
  typescript: true,
}, {
  rules: perfectionist.configs["recommended-alphabetical"].rules,
}, {
  rules: {
    "perfectionist/sort-imports": ["error", {
      tsconfig: {
        filename: "tsconfig.json",
        rootDir: ".",
      },
    }],
    "unicorn/filename-case": ["error", {
      case: "kebabCase",
      ignore: ["README.md"],
    }],
  },
}, {
  files: ["src/**/*.?(c|m)[jt]s?(x)"],
  plugins: { drizzle },
  rules: {
    "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db"] }],
    "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db"] }],
  },
}, {
  files: ["**/*.md/**"],
  rules: {
    "react-refresh/only-export-components": "off",
  },
}, {
  files: ["src/routes/**/*.tsx"],
  rules: {
    "react-refresh/only-export-components": ["error", {
      allowExportNames: ["Route"],
    }],
  },
}, {
  files: ["src/config/env.ts"],
  rules: {
    "node/prefer-global/process": "off",
  },
}, {
  files: ["src/components/ui/**/*.tsx"],
  rules: {
    "react-refresh/only-export-components": "off",
  },
});
