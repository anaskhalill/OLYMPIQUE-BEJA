import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-alert": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-expressions": "warn",
      // React Compiler-integration rules are experimental and flag many legitimate
      // patterns (SSR mounted-tracking, localStorage hydration, decorative Math.random).
      // Keep them as warnings so lint stays actionable without blocking the build.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/unsupported-syntax": "warn",
    },
  },
];

export default eslintConfig;