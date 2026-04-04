# Review Artifacts

The sync script defaults to a minimal workspace-local artifact set:

- `.review/pr-<number>-<timestamp>.md`: the only default output, containing the combined human-readable handoff

The timestamp uses sortable UTC format `YYYYMMDDTHHMMSSZ`, so listing files alphabetically also lists them chronologically.

If the sync is run with `--debug`, it also writes:

- `.review/pr-<number>-<timestamp>.debug/manifest.json`: sync metadata
- `.review/pr-<number>-<timestamp>.debug/raw.json`: raw normalized GitHub payload from the latest review round
- `.review/pr-<number>-<timestamp>.debug/items.json`: normalized actionable/context items used by the workflow
- `.review/pr-<number>-<timestamp>.debug/summary.md`: concise overview plus pointers to the main prompt-ready files
- `.review/pr-<number>-<timestamp>.debug/coderabbit_prompt.txt`: consolidated CodeRabbit prompt extracted from `🤖 Prompt for all review comments with AI agents`
- `.review/pr-<number>-<timestamp>.debug/codex_findings.md`: plain-language Codex findings extracted from inline comments
- `.review/pr-<number>-<timestamp>.debug/prompt_ready.json`: structured version of the prompt-ready handoff
- `.review/pr-<number>-<timestamp>.debug/triage.json`: mutable working state for validation and execution

## Triage Statuses

- `pending`: not reviewed yet
- `accepted`: valid and queued for implementation
- `rejected`: not valid for the current branch
- `duplicate`: covered by another accepted item
- `already-addressed`: already fixed in the current branch
- `needs-user`: blocked on a product or architecture decision
- `implemented`: fix completed locally

## Working Conventions

- The default sync keeps only timestamped markdown review files under `.review/`.
- The sync pulls only the latest review round for the PR head commit, not the full historical review set.
- `coderabbit_prompt.txt` and `codex_findings.md` only exist in debug mode.
- `items.json` is append-only per sync and should not be hand-edited unless the workflow is being repaired.
- `triage.json` is expected to be updated by Codex during review validation.
- Use `finding_id` as the stable link between `items.json`, `triage.json`, and any execution notes.
- Prefer one accepted workstream per distinct file ownership area.
