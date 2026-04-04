---
name: get-pr-code-review
description: >-
  Pull Codex and CodeRabbit code review feedback from a GitHub PR, analyze each
  finding against the actual code, rank by priority, and label every item with
  emoji verdicts (✅ agree, ❌ disagree, 🤔 needs human review). Use this skill
  whenever the user wants to triage PR review comments, understand which review
  findings matter, or get a prioritized summary of automated code review feedback.
  Also triggers when the user mentions "review feedback", "codex review",
  "coderabbit review", "triage PR comments", or "what did the reviewers say".
---

# Fix PR Review

Sync automated review feedback from Codex and CodeRabbit on a GitHub PR, analyze
every finding against the current branch, rank by priority, and label each one
with an emoji verdict so the user instantly knows what to act on.

## Prerequisites

- `gh` CLI must be installed and authenticated (`gh auth status`).
- If the user provides a PR URL, use that. Otherwise, use the PR for the current branch.

## Step 1: Sync Feedback

Run the bundled sync script to pull review comments from GitHub:

```bash
python3 .claude/skills/get-pr-code-review/scripts/sync_review_feedback.py --pr <pr-url> --debug
```

Or for the current branch:

```bash
python3 .claude/skills/get-pr-code-review/scripts/sync_review_feedback.py --debug
```

Always use `--debug` so you get the structured `items.json` and full context needed
for analysis. Read the generated files from `.review/`.

## Step 2: Analyze Each Finding

For every actionable finding from the sync output:

1. **Read the actual code** at the referenced file and line range. Don't trust the
   bot's description blindly — check whether the issue actually exists in the
   current branch.
2. **Assess validity** — is the finding correct? Has it already been fixed? Is it
   a false positive?
3. **Assess priority** using this scale:
   - **P0 — Critical**: Security vulnerabilities, data loss, crashes, broken auth
   - **P1 — Bug**: Logic errors, race conditions, incorrect behavior
   - **P2 — Quality**: Missing error handling, poor patterns, maintainability issues
   - **P3 — Nitpick**: Style, naming, minor suggestions, cosmetic
4. **Assign an emoji verdict**:
   - ✅ **Agree** — The finding is valid and should be fixed
   - ❌ **Disagree** — The finding is incorrect, already addressed, or not applicable
   - 🤔 **Needs Human Review** — The finding involves a product decision, architecture
     tradeoff, or is ambiguous enough that a human should weigh in

## Step 3: Write the Report to the Review File

Append the analysis directly to the same `.review/` markdown file that was generated
by the sync script in Step 1. Do NOT output the report to the conversation only — it
must be persisted in the file.

Use the Edit tool to append a `## Triage Analysis` section to the end of the synced
review file. The format:

```
## Triage Analysis

| Verdict | Count |
|---------|-------|
| ✅ Agree | N |
| ❌ Disagree | N |
| 🤔 Needs Human | N |

**Priority breakdown**: P0: N · P1: N · P2: N · P3: N

### <emoji> [P<n>] <short title>
**Source**: <codex|coderabbit> · **File**: `<path>:<line>`
**Verdict**: <Agree|Disagree|Needs Human Review>

<1-2 sentence rationale explaining why you agree, disagree, or are unsure>

> <original reviewer comment, abbreviated if long>
```

Group findings by priority (P0 first, P3 last). Within each priority group, list
agree items first, then needs-human, then disagree.

### Collapsing Duplicates

When Codex and CodeRabbit flag the same issue, merge them into a single entry.
Note both sources. Don't inflate the count with duplicate findings.

## Step 4: Show Summary and Offer to Fix

After writing the report to the file, show the user a brief summary in the
conversation (verdict counts + priority breakdown) and tell them the full
analysis was written to the review file.

Then ask:

> "Want me to fix the ✅ agreed items? I can work through them by priority."

If the user says yes, fix them starting from P0 down. Commit each fix atomically
with a clear message referencing the finding.

## References

- Sync script: [scripts/sync_review_feedback.py](scripts/sync_review_feedback.py)
- Artifact format: [references/artifacts.md](references/artifacts.md)
