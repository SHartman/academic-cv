---
# ─────────────────────────────────────────────────────────────────────────────
# SOFTWARE TEMPLATE. Stays off the site because `visible: false` below.
#
# When a tool goes public:
#   1. Copy this file to e.g. src/content/software/mytool.md and fill it in.
#   2. Set `visible: true` below.
#   3. Set `features.software: true` in src/data/site.yaml (first tool only).
#
# Don't commit a tool's file before its repository is public: this website's
# repository is public, so anything committed here can be read on GitHub even
# while it's hidden on the site.
# ─────────────────────────────────────────────────────────────────────────────
name: ToolName
tagline: One sentence on what it does and who it's for.
visible: false
status: released          # pre-alpha | alpha | beta | released
order: 1                  # position on the Software page
version: 1.0.0
released: 2027-01         # YYYY, YYYY-MM or YYYY-MM-DD
platforms: [Windows, macOS, Linux]
language: Python
license: BSD-3-Clause
repo: https://github.com/SHartman/ToolName
download: https://github.com/SHartman/ToolName/releases/latest
# docs: https://…
# paper: hartman-2027-something   # id from publications.yaml, once published
---

A paragraph or two describing the tool: the problem it solves, the method behind it,
and what goes in and comes out.

## Installing

Short install notes, or a link to the release page.

## Citing

How to cite it.
