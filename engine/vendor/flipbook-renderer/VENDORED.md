# Vendored flipbook render code
Snapshot of a live flipbook renderer (source has no git), taken 2026-10-19,
sanitized for public distribution: brand strings replaced by tokens
(VENDOR NAME / YOUR BRAND), internal paths removed, classes renamed
(old brand classes renamed to pb-cover-*), drawer/aria labels neutralized.
2565070b33fc1331dcb65c17742e70f1  VENDORED.md
f45711d71bd455d181134a5916398f67  book.css
73fc39446ea233120973109db4665ce9  book.js
89753e0d4c5681ec86e174e0269c7f43  fit-text.js
eec26eea6b7c98a8abd450f5adb7aa2f  proposal.css
60658a40cabed40368a89c29a7c5f208  renderer-core.css
ddbfcd9ffd61a92f879007cc7da624ec  shared/analysis.js
d546bc1f716d4586c2014d423b4e4e87  shared/bidi.js
dc718b5e615000a96a74ca43acf88931  shared/layout.js
cf1df125e8c124eb5dc8d8fdea7739e9  shared/line-break.js
8e111916f515b6dfbb1518fd98259c85  shared/line-text.js
3bd056db0c7bfb76ed5b9a9ba331aac4  shared/measurement.js
b117bbf8e99187b24422dafe7dbd68e3  shared/rich-inline.js

NOTE: the compiled book bundle is intentionally NOT vendored - it is content
output (a built book), not engine. Parity source is the renderer itself.
