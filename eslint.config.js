export default [
  {
    files: ["src/**/*.js"],
    ignores: ["**/*.config.js", "!**/eslint.config.js", "node_modules/**", "dist/**"],
    rules: {
      semi: "error",
    },
  },
];
