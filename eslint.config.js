import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "fixtures/**",
      "packages/core/tests/samples/**",
      "packages/plugin-claude/scripts/**",
      "benchmarks/agent-ui-drift-bench/reports/**",
      "benchmarks/agent-ui-drift-bench/graphs/**",
      "benchmarks/agent-ui-drift-bench/runs*/**",
      "benchmarks/agent-ui-drift-bench/runs-data*/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
)
