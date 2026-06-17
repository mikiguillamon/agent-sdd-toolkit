# Agent SDD Skills

Pack de skills pequenas para trabajar con coding agents de forma mas profesional y eficiente.

## Skills incluidas

1. `token-discipline`: reduce tokens y ruido.
2. `spec-driven-development`: aplica SDD y gates humanos.
3. `repo-cartographer`: crea mapas compactos del repo.
4. `minimal-implementer`: implementa el minimo cambio correcto.
5. `senior-code-reviewer`: revisa calidad sin overengineering.
6. `security-pass`: revisa riesgos de seguridad antes de merge.
7. `docs-writer`: crea documentacion util y compacta.
8. `ux-polish-reviewer`: revisa UX, estados, microcopy y polish.

## Targets

- `codex`: installable
- `claude`: exportable
- `generic`: exportable
- `copilot`: exportable
- `cursor`: exportable
- `windsurf`: exportable

## Instalacion en Codex

Desde esta carpeta:

```bash
./install.sh
```

Esto copia las skills a:

```text
~/.agents/skills/
```

## Instalacion manual

```bash
mkdir -p ~/.agents/skills
cp -R token-discipline ~/.agents/skills/
cp -R spec-driven-development ~/.agents/skills/
cp -R repo-cartographer ~/.agents/skills/
cp -R minimal-implementer ~/.agents/skills/
cp -R senior-code-reviewer ~/.agents/skills/
cp -R security-pass ~/.agents/skills/
cp -R docs-writer ~/.agents/skills/
cp -R ux-polish-reviewer ~/.agents/skills/
```

## Validacion

```bash
python3 validate_skills.py
agent-sdd skills validate
```

## Instalacion y exportacion con el toolkit

```bash
agent-sdd skills list
agent-sdd skills install --agents codex
agent-sdd skills export --agents claude,generic --output ./skills-export
agent-sdd skills doctor --agents codex,claude
```

## Uso recomendado

No invoques todas las skills a la vez. Usa una skill concreta segun la tarea:

```text
Usa token-discipline y repo-cartographer para mapear este repo sin gastar contexto innecesario.
Usa spec-driven-development para preparar la proxima feature. No implementes todavia.
Usa minimal-implementer para implementar solo la spec aprobada.
Usa senior-code-reviewer para revisar antes de merge.
Usa security-pass para revisar auth, webhooks, tokens y permisos.
Usa docs-writer para actualizar README y docs/commands.md.
Usa ux-polish-reviewer para revisar la pantalla de onboarding.
```

## Politica

`AGENTS.md` sigue siendo la fuente de verdad del repo. Estas skills no deben contradecirlo.
