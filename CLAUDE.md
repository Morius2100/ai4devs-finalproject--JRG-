@AGENTS.md

# Prompt logging

Every prompt submitted by the user in this project is automatically appended to [Prompts.md](Prompts.md) via a `UserPromptSubmit` hook configured in `.claude/settings.json` (`.claude/hooks/log-prompt.cjs`). Do not rely on manually copying prompts there — the hook handles it on every turn.
