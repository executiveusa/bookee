# Bookee (agent guide)
Make an ebook from an interview. One static HTML file per book.
Commands: `npm install`, then `node bin/bookmaker.mjs plan|new|check|build`.
Stages: 01_interview, 02_outline, 03_write, 04_typeset, 05_verify, 06_publish. Read each CONTEXT.md.
Rules:
- Never rewrite the author's approved words. Lint reports only.
- Mark client-facing text as placeholder until the author approves it.
- Run `check` before `build` is shown to anyone. No dead ends.
- Pictures and songs are slots in art/. Do not fake them.
- Show the author the result before publishing anywhere.

<!-- trail:start -->
## Trail - repo context graph

This repo is indexed in `.trail/cache/` (local, gitignored): a map of every file,
function and caller, kept in sync with the code. Ask the graph BEFORE grepping or
opening source files:

- `trail map` - orientation: dir clusters, hubs, hotspots (no LLM, no key, $0)
- `trail ask "<question>" --source` - ranked nodes with code spans inlined
- `trail grep "<literal>"` - exhaustive occurrences grouped by enclosing symbol
- `trail skeleton <file>` / `trail callers <symbol>` - API surface / blast radius

Open source files only at the exact file:line a node gives you. After big code
changes, refresh with `trail build` (deterministic, no API key). Session learnings
live in `.trail/learnings/`: read them first, and add one when a session took real
digging. Install: `npm i -g @trailhq/trail-code`.
<!-- trail:end -->
