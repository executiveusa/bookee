# Bookee

Say what you do. Get a finished book.

Bookee turns a short interview into a real book: set in proper
type, checked page by page, and delivered as one self-contained HTML file
that turns its pages on any phone. No app, no account, no designer.

## Three kinds of book, one engine

- **Guide** - a regular ebook from `book.md`. Chapters on fresh pages, a
  contents list that reaches everywhere, type that stays readable at any size.
- **Adventure** - a choose-your-own-adventure from `story.ink` (ink). The
  checker plays every path and proves every ending is reachable and no page
  is a dead end. The sample ships 25 states and 6 endings, zero dead ends.
- **Proposal** - a business proposal from `proposal.json`, rendered as a
  hardcover flipbook with the vendored renderer (vendored under
  `engine/vendor/flipbook-renderer`, see VENDORED.md). Leather cover, contents,
  plan, offer, investment and signature pages - the document that wins the
  job, not another PDF.

Every book is one HTML file with the fonts embedded (Bodoni Moda +
Newsreader, SIL OFL). It runs from a link, a USB stick, or any static host.

## Quickstart

```
node bin/bookmaker.mjs new my-book --kind guide|adventure|proposal
node bin/bookmaker.mjs check my-book     # paths, endings, media slots; never rewrites your words
node bin/bookmaker.mjs build my-book     # dist/my-book/index.html
```

Neutral samples in `examples/`: sourdough-weekend (guide), lantern-door
(adventure), acme-proposal (proposal, fictional client).

## Run it inside your agent

**Claude Code** - the plugin passes `claude plugin validate --strict`:
`/make-book` interviews you, writes, checks and builds.

**Codex** - the repo carries `.agents/plugins/marketplace.json`; add it as a
local or git marketplace and `codex plugin add bookee@bookee`.
The same flow also works from plain AGENTS.md instructions.

Author name in `.claude-plugin/plugin.json` is a placeholder pending the
owner's public author/publisher name.

## What is deliberately not here

No account system, no tracking, no paywall in the file. Books are static and
yours. Money (MONEY.md): the plugin is the free sample; a paid hosted service
later does typeset, narration and hosting. Title cards and animated intros:
`engine/templates/hyperframes` (hyperframes@0.8.113).

Landing page: `node scripts/build-site.mjs dist/site`.
See AGENTS.md for the working agreement.
