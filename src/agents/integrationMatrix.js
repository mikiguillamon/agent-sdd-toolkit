export const SPEC_KIT_INTEGRATION = {
  codex: {
    commandNew:
      'specify init . --integration codex --integration-options="--skills"',
    commandAdopt:
      'specify init . --force --integration codex --integration-options="--skills"'
  },
  claude: {
    commandNew: 'specify init . --integration claude',
    commandAdopt: 'specify init . --force --integration claude'
  },
  copilot: {
    commandNew: 'specify init . --integration copilot',
    commandAdopt: 'specify init . --force --integration copilot'
  },
  cursor: {
    commandNew: 'specify init . --integration cursor',
    commandAdopt: 'specify init . --force --integration cursor'
  },
  windsurf: {
    commandNew: 'specify init . --integration windsurf',
    commandAdopt: 'specify init . --force --integration windsurf'
  },
  generic: {
    commandNew: null,
    commandAdopt: null
  }
};
