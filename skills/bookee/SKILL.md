---
name: bookee
description: Make an ebook from an interview. Use when someone says what they do and what they want to say and wants a finished book (guide or choose-your-path story).
---
# Book maker
Stages live in the numbered folders. Do them in order and read each CONTEXT.md first.
1. 01_interview: ask three questions. Do not invent the author's facts.
2. 02_outline: `node bin/bookmaker.mjs plan --kind guide|adventure --does ... --reader ... --say ...`
3. 03_write: draft into book.md (guide) or story.ink + book.json (adventure). Mark every draft as draft.
4. 04_typeset: `node bin/bookmaker.mjs build <dir> --out dist`
5. 05_verify: `node bin/bookmaker.mjs check <dir>`. Fix dead ends. The lint only reports; never rewrite the author's words.
6. 06_publish: show the author first. Host on their own server only after they say so.
Rules: phone-readable type, contents reach every part, art and songs are named slots under art/, in-house demos stay in-house.
