---
description: Run ESLint with auto-fix across all source files
---

```bash
pnpm lint --fix
```

ESLint is configured in `eslint.config.js` with `@typescript-eslint` and `react-hooks` plugins.

Auto-fix handles: unused imports, import ordering, trailing commas, semicolons, quote style.

**Does not auto-fix:** type errors, logic issues, missing return types, `any` usage.

After fixing, always run the build check to confirm no type errors were introduced:

```bash
pnpm build
```
