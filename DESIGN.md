# Design system — Just One More Thing

The interface is designed like the document it produces: a well-kept paper
ledger. This file is the single source of truth for the visual system
(the same spec you would keep in Figma).

## Principles

1. **Paper, not glass.** Warm off-white surfaces, hairline rules, flat ink.
   No gradients, no blur, no glow, no drop-shadow theatre.
2. **Numbers are data.** Money and hours always use the mono face, tabular
   and right-aligned in tables — ledgers are read in columns.
3. **One accent.** Ember is reserved for money-at-risk moments: extras,
   quotes, and the creep meter. Everything else is ink and paper.
4. **Sentences, not slogans.** UI copy is written the way a professional
   writes to a client — plain, specific, no hype words.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FAF7F1` | App background |
| `--surface` | `#FFFFFF` | Cards, tables, inputs |
| `--ink` | `#1C1917` | Primary text, primary buttons |
| `--ink-2` | `#57534E` | Secondary text |
| `--ink-3` | `#A8A29E` | Tertiary text, placeholders |
| `--line` | `#E7E0D2` | Hairlines inside panels |
| `--line-strong` | `#D6CDB8` | Panel borders, inputs |
| `--ember` | `#BC3F12` | Extras, quotes, creep meter, primary CTA |
| `--green` | `#2F6B3A` | Included / approved |
| `--amber` | `#92600A` | Clarify |
| `--blue` | `#2C4A7C` | Swap |

## Type

| Role | Face | Notes |
|---|---|---|
| Display | Fraunces (600) | Wordmark, panel titles, document headings |
| UI | Inter (400–650) | Everything else; 15px base |
| Data | IBM Plex Mono (500–600) | Money, hours, dates in tables |

## Components

- **Stat card** — white surface, 1px `--line` border, 10px radius, uppercase
  11.5px label, 26px mono value. No shadow.
- **Kind pill** — tinted soft background per bucket, 12px semibold text.
  Colour is always paired with the bucket's name; colour is never the only signal.
- **Ledger table** — row rules only (`--line`), 13px row padding, request
  title at 580 weight, detail and meta in `--ink-2`.
- **Primary action** — ink button. **Money action** (log request) — ember.
- **Modals** — paper background, 14px radius, serif title, focus-visible
  outlines, labelled with `aria-label`, closable with the × control.

## Print

The change order is a real document, not a screenshot of the UI: white
page, serif heading, ruled table, dashed signature rule. `@media print`
isolates `.print-area` so only the document prints.
