#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / "manifest.json").read_text())
EXPECTED = [skill["name"] for skill in MANIFEST["skills"]]
FRONTMATTER_RE = re.compile(r"^---\nname: ([a-z0-9-]+)\ndescription: (.+?)\n---\n", re.S)
TARGET_FILES = {
    "codex": "openai.yaml",
    "claude": "claude.md",
    "generic": "generic.md",
    "copilot": "copilot.md",
    "cursor": "cursor.md",
    "windsurf": "windsurf.md",
}


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


for skill in MANIFEST["skills"]:
    name = skill["name"]
    folder = ROOT / name
    skill_md = folder / "SKILL.md"

    if not folder.is_dir():
        fail(f"missing skill folder: {name}")
    if not skill_md.is_file():
        fail(f"missing SKILL.md: {name}")

    text = skill_md.read_text()
    match = FRONTMATTER_RE.match(text)
    if not match:
        fail(f"invalid frontmatter: {name}")

    frontmatter_name, description = match.groups()
    if frontmatter_name != name:
        fail(f"name mismatch in {name}: {frontmatter_name}")
    if len(description.strip()) < 80:
        fail(f"description too short in {name}")
    if len(text.splitlines()) > 180:
        fail(f"SKILL.md too long in {name}")
    if "rm -rf /" in text or "curl | sh" in text:
        fail(f"potentially dangerous command in {name}")

    for target in skill["targets"].keys():
        adapter = folder / "agents" / TARGET_FILES[target]
        if not adapter.is_file():
            fail(f"missing agents/{TARGET_FILES[target]}: {name}")

print(f"OK: all skills validated ({len(EXPECTED)} skills)")
