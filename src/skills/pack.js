import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { homePath, skillsPackRoot } from '../utils/paths.js';
import { exists } from '../fs/fileOps.js';

const FRONTMATTER_RE =
  /^---\nname: ([a-z0-9-]+)\ndescription: ([^\n]+)\n---\n/s;
const TARGET_FILE_MAP = {
  codex: 'openai.yaml',
  claude: 'claude.md',
  generic: 'generic.md',
  copilot: 'copilot.md',
  cursor: 'cursor.md',
  windsurf: 'windsurf.md'
};
const INSTALLABLE_TARGETS = new Set(['codex']);

export async function loadSkillsManifest() {
  return JSON.parse(
    await readFile(path.join(skillsPackRoot, 'manifest.json'), 'utf8')
  );
}

export async function listSkillsPack() {
  const manifest = await loadSkillsManifest();
  return {
    name: manifest.name,
    skills: manifest.skills.map((skill) => ({
      name: skill.name,
      shortDescription: skill.shortDescription,
      targetSummary: Object.entries(skill.targets)
        .map(([target, state]) => `${target}:${state}`)
        .join(', ')
    }))
  };
}

export async function validateSkillsPack() {
  const manifest = await loadSkillsManifest();
  const directories = await readdir(skillsPackRoot, { withFileTypes: true });
  const skillDirectories = directories
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'));

  for (const skill of manifest.skills) {
    if (!skillDirectories.includes(skill.name)) {
      throw new Error(`missing skill folder: ${skill.name}`);
    }

    const root = path.join(skillsPackRoot, skill.name);
    const skillPath = path.join(root, 'SKILL.md');
    if (!(await exists(skillPath))) {
      throw new Error(`missing SKILL.md: ${skill.name}`);
    }

    const content = await readFile(skillPath, 'utf8');
    const match = content.match(FRONTMATTER_RE);
    if (!match) {
      throw new Error(`invalid frontmatter: ${skill.name}`);
    }
    if (match[1] !== skill.name) {
      throw new Error(`name mismatch in ${skill.name}: ${match[1]}`);
    }
    if (match[2].trim().length < 80) {
      throw new Error(`description too short in ${skill.name}`);
    }
    if (content.split('\n').length > 180) {
      throw new Error(`SKILL.md too long in ${skill.name}`);
    }

    for (const target of Object.keys(skill.targets)) {
      const fileName = TARGET_FILE_MAP[target];
      const adapterPath = path.join(root, 'agents', fileName);
      if (!(await exists(adapterPath))) {
        throw new Error(`missing agents/${fileName}: ${skill.name}`);
      }
    }
  }

  return {
    ok: true,
    message: `validated ${manifest.skills.length} skills in ${manifest.name}`
  };
}

export async function diagnoseSkillsPackTargets(agents) {
  const manifest = await loadSkillsManifest();
  const checks = [];

  for (const agent of agents) {
    if (INSTALLABLE_TARGETS.has(agent)) {
      const installed = await areCodexSkillsInstalled(manifest.skills);
      checks.push({
        ok: installed,
        level: installed ? 'ok' : 'warn',
        message: installed
          ? `skills pack installed for ${agent}`
          : `skills pack not installed for ${agent}; run agent-sdd skills install --agents codex`
      });
      continue;
    }

    if (agent in TARGET_FILE_MAP) {
      checks.push({
        ok: true,
        level: 'ok',
        message: `${agent} support is exportable; use agent-sdd skills export --agents ${agent}`
      });
    }
  }

  return checks;
}

export async function installSkillsPack(agents, options = {}) {
  const manifest = await loadSkillsManifest();
  const messages = [];

  for (const agent of agents) {
    if (!INSTALLABLE_TARGETS.has(agent)) {
      messages.push({
        level: 'warn',
        text: `${agent} is exportable but not installable; use skills export instead`
      });
      continue;
    }

    const destinationRoot = homePath('.agents', 'skills');
    for (const skill of manifest.skills) {
      const source = path.join(skillsPackRoot, skill.name);
      const destination = path.join(destinationRoot, skill.name);
      if (!options.force && (await exists(destination))) {
        messages.push({
          level: 'warn',
          text: `skipped existing ${agent} skill ${skill.name}; re-run with --force`
        });
        continue;
      }
      if (!options.dryRun) {
        await mkdir(destinationRoot, { recursive: true });
        if (options.force && (await exists(destination))) {
          await rm(destination, { recursive: true, force: true });
        }
        await cp(source, destination, {
          recursive: true,
          force: options.force
        });
      }
      messages.push({
        level: 'ok',
        text: `${options.dryRun ? 'would install' : 'installed'} ${skill.name} for ${agent} -> ${destination}`
      });
    }
  }

  return { messages };
}

export async function exportSkillsPack(agents, outputDirectory, options = {}) {
  const manifest = await loadSkillsManifest();
  const messages = [];

  for (const agent of agents) {
    const fileName = TARGET_FILE_MAP[agent];
    if (!fileName) {
      messages.push({
        level: 'warn',
        text: `no export target registered for ${agent}`
      });
      continue;
    }

    for (const skill of manifest.skills) {
      const sourceRoot = path.join(skillsPackRoot, skill.name);
      const sourceSkill = path.join(sourceRoot, 'SKILL.md');
      const sourceAgent = path.join(sourceRoot, 'agents', fileName);
      const destination = path.join(outputDirectory, agent, skill.name);

      if (!options.dryRun) {
        await mkdir(destination, { recursive: true });
        await cp(sourceSkill, path.join(destination, 'SKILL.md'), {
          force: true
        });
        await cp(sourceAgent, path.join(destination, fileName), {
          force: true
        });
      }
      messages.push({
        level: 'ok',
        text: `${options.dryRun ? 'would export' : 'exported'} ${skill.name} for ${agent} -> ${destination}`
      });
    }
  }

  return { messages };
}

async function areCodexSkillsInstalled(skills) {
  for (const skill of skills) {
    const filePath = homePath('.agents', 'skills', skill.name, 'SKILL.md');
    if (!(await exists(filePath))) {
      return false;
    }
  }
  return true;
}
