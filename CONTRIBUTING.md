# Contributing

Thanks for looking. This project is maintained by Ayush Bhatt
(BrandForge Media) — bug reports, ideas, and pull requests are welcome.

## Good first issues

- Message templates in other tones or languages
- More currencies / locale number formats
- Accessibility passes on the ledger table and modals

## Making a change

1. Fork and branch from `main` (`feat/short-name` or `fix/short-name`).
2. `npm install`, then run the checks locally:
   ```bash
   npm test && npm run build
   ```
3. Keep changes focused. If you touch pricing or message logic, add or
   update a test in `src/lib/logic.test.ts`.
4. Open a PR describing what changed, why, and how you tested it.

## Style

- TypeScript strict; no `any` without a comment explaining why.
- Match the design system in DESIGN.md — paper, ink, one ember accent.
  PRs that add gradients or glassmorphism will be asked to rework. 🙂
  (Okay, one emoji. The app itself has none.)
