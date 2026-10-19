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
