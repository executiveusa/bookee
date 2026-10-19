# Bookee releases

## v1.0.1 - 2026-10-19
Patch release for the independent review of v1.0. No new product category.

- Start new adventure stories correctly; count terminal-knot visits reliably.
- Reject Kindle exports with missing author metadata before writing an EPUB.
- Populate proposal Contents and show proposal title/client on its cover.
- Remove adventure filler pages, migrate old saves, and isolate embedded-demo saves.
- Put Home links in each renderer's header instead of over its content; no Home link inside the landing embed.
- Keep mobile navigation reachable; remember proposal sound preference.
- Clear old upload state on file changes; show a readable malformed-file error.
- Share one CLI implementation, stop success-command usage fallthrough, add --version.
- Guard empty guide chapters; clarify installation docs and example bylines.
- Add CLI regression tests and align plugin/package/site versions.

Release metadata: see releases/v1.0.1.json (production deployment and rollback).
Rollback: ed33a121f899399235df552e1906a758f9992bf1 (v1.0).

## v1.0 - 2026-10-19
First named release, as designated by the owner. Tag points to ed33a121f899399235df552e1906a758f9992bf1.

- Guide, choose-your-own-adventure, and proposal builders with live samples.
- Claude Code and Codex plugin installation, browser PDF/EPUB conversion, Kindle export.
- Buyer-facing descriptions and Home navigation.
- Version fields were 0.2.0 in this historical commit; the owner's v1.0 designation is preserved by the annotated tag, not by rewriting history.

Production deployment: AtVjnECbaQf9Vo4arT2DVodkU7sf
Production URL: https://bookee-iota.vercel.app/
Deployment URL: https://bookee-35lrv14l2-the-pauli-effect.vercel.app
Previous rollback commit: b75305e9.
