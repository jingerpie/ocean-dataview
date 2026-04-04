#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_AUTHORS = (
    "chatgpt-codex-connector",
    "coderabbitai",
)

PR_URL_RE = re.compile(
    r"https://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+)/pull/(?P<number>\d+)"
)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
DETAILS_BLOCK_RE = re.compile(r"<details>.*?</details>", re.DOTALL | re.IGNORECASE)
HTML_TAG_RE = re.compile(r"<[^>]+>")
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")
MARKDOWN_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
WHITESPACE_RE = re.compile(r"\s+")
SEVERITY_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("P0", re.compile(r"\bP0\b", re.IGNORECASE)),
    ("P1", re.compile(r"\bP1\b", re.IGNORECASE)),
    ("P2", re.compile(r"\bP2\b", re.IGNORECASE)),
    ("P3", re.compile(r"\bP3\b", re.IGNORECASE)),
    ("critical", re.compile(r"\bcritical\b", re.IGNORECASE)),
    ("major", re.compile(r"\bmajor\b", re.IGNORECASE)),
    ("minor", re.compile(r"\bminor\b", re.IGNORECASE)),
    ("nitpick", re.compile(r"\bnitpick\b", re.IGNORECASE)),
)
GENERIC_TITLE_PATTERNS = (
    re.compile(r"^codex review$", re.IGNORECASE),
    re.compile(r"^actionable comments posted: \d+$", re.IGNORECASE),
    re.compile(r"^potential issue\s*\|\s*(critical|major|minor|nitpick)$", re.IGNORECASE),
    re.compile(r"^walkthrough$", re.IGNORECASE),
)
CODERABBIT_ALL_REVIEW_PROMPT_SUMMARY = "🤖 Prompt for all review comments with AI agents"
CODERABBIT_FILE_HEADER_RE = re.compile(r"^In `@?([^`]+)`:$")
PROMPT_LINE_PREFIX_RE = re.compile(
    r"^(?:Around line\s+(?P<around>\d+)(?:-\d+)?|Line\s+(?P<line>\d+)):\s*",
    re.IGNORECASE,
)
GRAPHQL_QUERY = """
query(
  $owner: String!,
  $repo: String!,
  $number: Int!,
  $commentsCursor: String,
  $reviewsCursor: String,
  $threadsCursor: String
) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number
      url
      title
      state
      comments(first: 100, after: $commentsCursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          body
          createdAt
          updatedAt
          url
          author {
            login
          }
        }
      }
      reviews(first: 100, after: $reviewsCursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          state
          body
          submittedAt
          url
          author {
            login
          }
          commit {
            oid
          }
        }
      }
      reviewThreads(first: 100, after: $threadsCursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          startLine
          originalStartLine
          comments(first: 100) {
            nodes {
              id
              body
              createdAt
              updatedAt
              url
              path
              line
              originalLine
              diffHunk
              author {
                login
              }
            }
          }
        }
      }
    }
  }
}
""".strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Fetch Codex and CodeRabbit PR feedback from GitHub and write "
            "normalized artifacts into .review/."
        )
    )
    parser.add_argument(
        "--pr",
        help="Pull request URL or number. Defaults to the PR for the current branch.",
    )
    parser.add_argument(
        "--repo",
        help="GitHub repository slug like owner/repo. Required when --pr is a number outside the current repo.",
    )
    parser.add_argument(
        "--out-dir",
        default=".review",
        help="Output directory for review artifacts. Defaults to .review.",
    )
    parser.add_argument(
        "--authors",
        default=",".join(DEFAULT_AUTHORS),
        help=(
            "Comma-separated GitHub logins to include. Logins are canonicalized "
            "so bot suffixes like [bot] are ignored."
        ),
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help=(
            "Keep extra artifacts like manifest, raw payloads, items, and triage. "
            "By default the script only writes .review/current/prompt_ready.md."
        ),
    )
    return parser.parse_args()


def run_command(command: list[str], stdin: str | None = None) -> str:
    completed = subprocess.run(
        command,
        input=stdin,
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            "Command failed:\n"
            f"{' '.join(command)}\n\n"
            f"{completed.stderr.strip()}"
        )
    return completed.stdout


def run_json_command(command: list[str], stdin: str | None = None) -> dict[str, Any] | list[Any]:
    output = run_command(command, stdin=stdin)
    try:
        return json.loads(output)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            "Failed to parse JSON from command output.\n"
            f"Command: {' '.join(command)}\n"
            f"Output: {output}"
        ) from error


def ensure_gh_ready() -> None:
    try:
        run_command(["gh", "auth", "status"])
    except RuntimeError as error:
        raise RuntimeError(
            "GitHub CLI is not authenticated. Run `gh auth login` and retry."
        ) from error


def canonicalize_author(login: str | None) -> str:
    if not login:
        return ""
    return login.lower().removesuffix("[bot]")


def parse_repo_slug(repo_slug: str) -> tuple[str, str]:
    parts = repo_slug.split("/", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError(f"Invalid repo slug: {repo_slug}")
    return parts[0], parts[1]


def resolve_current_repo() -> tuple[str, str]:
    repo_data = run_json_command(["gh", "repo", "view", "--json", "nameWithOwner"])
    if not isinstance(repo_data, dict) or "nameWithOwner" not in repo_data:
        raise RuntimeError("Unable to resolve the current GitHub repository.")
    return parse_repo_slug(str(repo_data["nameWithOwner"]))


def resolve_pull_request(pr_arg: str | None, repo_arg: str | None) -> tuple[str, str, int]:
    if not pr_arg:
        pr_data = run_json_command(["gh", "pr", "view", "--json", "url"])
        if not isinstance(pr_data, dict) or "url" not in pr_data:
            raise RuntimeError("Unable to resolve the current pull request.")
        return parse_pr_url(str(pr_data["url"]))

    pr_match = PR_URL_RE.fullmatch(pr_arg)
    if pr_match:
        return (
            pr_match.group("owner"),
            pr_match.group("repo"),
            int(pr_match.group("number")),
        )

    if pr_arg.isdigit():
        owner, repo = parse_repo_slug(repo_arg) if repo_arg else resolve_current_repo()
        return owner, repo, int(pr_arg)

    raise ValueError(
        "--pr must be either a full GitHub pull request URL or a numeric pull request number."
    )


def parse_pr_url(url: str) -> tuple[str, str, int]:
    match = PR_URL_RE.fullmatch(url)
    if not match:
        raise ValueError(f"Unsupported pull request URL: {url}")
    return match.group("owner"), match.group("repo"), int(match.group("number"))


def gh_rest(endpoint: str) -> dict[str, Any] | list[Any]:
    return run_json_command(["gh", "api", endpoint])


def gh_rest_paginated(endpoint: str) -> list[dict[str, Any]]:
    page = 1
    items: list[dict[str, Any]] = []

    while True:
        separator = "&" if "?" in endpoint else "?"
        payload = gh_rest(f"{endpoint}{separator}per_page=100&page={page}")
        if not isinstance(payload, list):
            raise RuntimeError(f"Expected list payload from GitHub REST API: {endpoint}")
        page_items = [item for item in payload if isinstance(item, dict)]
        items.extend(page_items)
        if len(page_items) < 100:
            break
        page += 1

    return items


def fetch_feedback(owner: str, repo: str, number: int) -> dict[str, Any]:
    pr_response = gh_rest(f"repos/{owner}/{repo}/pulls/{number}")
    if not isinstance(pr_response, dict):
        raise RuntimeError(f"Pull request not found for {owner}/{repo}#{number}.")

    latest_commit_sha = ((pr_response.get("head") or {}).get("sha") or "").strip()
    if not latest_commit_sha:
        raise RuntimeError(f"Unable to resolve the latest commit for {owner}/{repo}#{number}.")

    reviews = [
        review
        for review in gh_rest_paginated(f"repos/{owner}/{repo}/pulls/{number}/reviews")
        if (review.get("commit_id") or "").strip() == latest_commit_sha
    ]
    review_comments = [
        comment
        for comment in gh_rest_paginated(f"repos/{owner}/{repo}/pulls/{number}/comments")
        if ((comment.get("original_commit_id") or "").strip() == latest_commit_sha)
        or ((comment.get("commit_id") or "").strip() == latest_commit_sha)
    ]

    return {
        "pull_request": {
            "owner": owner,
            "repo": repo,
            "number": number,
            "url": pr_response.get("html_url"),
            "title": pr_response.get("title"),
            "state": pr_response.get("state"),
            "latest_commit_sha": latest_commit_sha,
        },
        "reviews": reviews,
        "review_comments": review_comments,
    }


def clean_text(value: str) -> str:
    without_comments = HTML_COMMENT_RE.sub(" ", value)
    without_fences = MARKDOWN_FENCE_RE.sub(" ", without_comments)
    without_images = MARKDOWN_IMAGE_RE.sub(" ", without_fences)
    without_links = MARKDOWN_LINK_RE.sub(r"\1", without_images)
    without_tags = HTML_TAG_RE.sub(" ", without_links)
    return WHITESPACE_RE.sub(" ", without_tags).strip()


def normalize_title_line(value: str) -> str:
    cleaned = clean_text(value)
    cleaned = re.sub(r"^[*_`#>\s]+", "", cleaned)
    cleaned = re.sub(r"[*_`#>\s]+$", "", cleaned)
    cleaned = re.sub(r"^\W*P\d\W+Badge\W+", "", cleaned, flags=re.IGNORECASE)
    return WHITESPACE_RE.sub(" ", cleaned).strip()


def extract_title(body: str) -> str:
    title_body = DETAILS_BLOCK_RE.sub(" ", body)
    for raw_line in title_body.splitlines():
        line = normalize_title_line(raw_line)
        if not line:
            continue
        line_lower = line.casefold()
        if any(pattern.fullmatch(line) for pattern in GENERIC_TITLE_PATTERNS):
            continue
        if line_lower in {"analysis chain"}:
            continue
        if "potential issue" in line_lower and any(
            keyword in line_lower for keyword in ("critical", "major", "minor", "nitpick")
        ):
            continue
        if line_lower.startswith("also applies to:"):
            continue
        return line[:160]
    return "Untitled finding"


def extract_severity(body: str) -> str | None:
    haystack = clean_text(body).casefold()
    for severity, pattern in SEVERITY_PATTERNS:
        if pattern.search(haystack):
            return severity
    return None


def extract_details_code_block(body: str, summary_text: str) -> str | None:
    pattern = re.compile(
        r"<summary>\s*"
        + re.escape(summary_text)
        + r"\s*</summary>\s*\n?\s*```(?:\w+)?\n(.*?)\n```",
        re.DOTALL,
    )
    match = pattern.search(body)
    return match.group(1).strip() if match else None


def normalize_wrapped_text(lines: list[str]) -> str:
    paragraphs: list[str] = []
    current: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current:
                paragraphs.append(" ".join(current))
                current = []
            continue
        current.append(stripped)

    if current:
        paragraphs.append(" ".join(current))

    return "\n\n".join(paragraphs).strip()


def extract_prompt_line_number(text: str) -> int | None:
    match = PROMPT_LINE_PREFIX_RE.match(text)
    if not match:
        return None
    line_number = match.group("around") or match.group("line")
    return int(line_number) if line_number else None


def strip_prompt_line_prefix(text: str) -> str:
    return PROMPT_LINE_PREFIX_RE.sub("", text, count=1).strip()


def extract_codex_comment_text(body: str) -> str:
    without_footer = re.split(r"\n\s*\nUseful\?\s*", body, maxsplit=1)[0]
    paragraphs = [
        clean_text(paragraph)
        for paragraph in re.split(r"\n\s*\n", without_footer)
        if clean_text(paragraph)
    ]
    if len(paragraphs) >= 2:
        return paragraphs[1]
    return paragraphs[0] if paragraphs else ""


def build_item(
    *,
    index: int,
    source_author: str,
    kind: str,
    body: str,
    url: str | None,
    created_at: str | None,
    updated_at: str | None,
    path: str | None = None,
    line: int | None = None,
    original_line: int | None = None,
    thread_id: str | None = None,
    is_resolved: bool | None = None,
    is_outdated: bool | None = None,
    review_id: str | None = None,
    review_state: str | None = None,
    commit_oid: str | None = None,
    title_override: str | None = None,
    severity_override: str | None = None,
    actionable: bool | None = None,
) -> dict[str, Any]:
    canonical_source = canonicalize_author(source_author)
    return {
        "finding_id": f"F{index:03d}",
        "source": canonical_source,
        "raw_author": source_author,
        "kind": kind,
        "title": title_override or extract_title(body),
        "severity": severity_override if severity_override is not None else extract_severity(body),
        "actionable": actionable if actionable is not None else kind == "review_thread_comment",
        "path": path,
        "line": line,
        "original_line": original_line,
        "thread_id": thread_id,
        "review_id": review_id,
        "review_state": review_state,
        "commit_oid": commit_oid,
        "is_resolved": is_resolved,
        "is_outdated": is_outdated,
        "url": url,
        "created_at": created_at,
        "updated_at": updated_at,
        "body": body.strip(),
    }


def parse_coderabbit_prompt_items(
    prompt_text: str,
    review_url: str | None,
    start_index: int,
) -> tuple[list[dict[str, Any]], int]:
    items: list[dict[str, Any]] = []
    next_index = start_index
    current_file: str | None = None
    current_section: str | None = None
    current_bullet_lines: list[str] = []

    def flush_current_bullet() -> None:
        nonlocal current_bullet_lines
        nonlocal next_index

        if not current_file or not current_bullet_lines:
            current_bullet_lines = []
            return

        body = normalize_wrapped_text(current_bullet_lines)
        line_number = extract_prompt_line_number(body)
        title = strip_prompt_line_prefix(body)
        severity = "nitpick" if current_section == "nitpick comments" else None
        items.append(
            build_item(
                index=next_index,
                source_author="coderabbitai",
                kind="coderabbit_prompt_item",
                body=body,
                url=review_url,
                created_at=None,
                updated_at=None,
                path=current_file,
                line=line_number,
                title_override=title[:160],
                severity_override=severity,
                actionable=True,
            )
        )
        next_index += 1
        current_bullet_lines = []

    for raw_line in prompt_text.splitlines():
        stripped = raw_line.strip()

        if not stripped:
            if current_bullet_lines:
                current_bullet_lines.append("")
            continue

        if stripped in {"Inline comments:", "Nitpick comments:"}:
            flush_current_bullet()
            current_section = stripped[:-1].casefold()
            current_file = None
            continue

        if stripped == "---":
            flush_current_bullet()
            current_file = None
            continue

        file_match = CODERABBIT_FILE_HEADER_RE.match(stripped)
        if file_match:
            flush_current_bullet()
            current_file = file_match.group(1)
            continue

        if stripped.startswith("- "):
            flush_current_bullet()
            current_bullet_lines = [stripped[2:]]
            continue

        if current_bullet_lines:
            current_bullet_lines.append(stripped)

    flush_current_bullet()
    return items, next_index


def extract_coderabbit_prompt_bundle(
    payload: dict[str, Any],
) -> tuple[str | None, str | None]:
    sorted_reviews = sorted(
        payload["reviews"],
        key=lambda review: str(review.get("submitted_at") or ""),
        reverse=True,
    )
    for review in sorted_reviews:
        author_login = canonicalize_author(review.get("user", {}).get("login"))
        if author_login != "coderabbitai":
            continue
        body = str(review.get("body") or "")
        prompt_text = extract_details_code_block(body, CODERABBIT_ALL_REVIEW_PROMPT_SUMMARY)
        if prompt_text:
            return prompt_text, review.get("html_url")
    return None, None


def flatten_relevant_items(
    payload: dict[str, Any],
    allowed_authors: set[str],
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    next_index = 1
    coderabbit_prompt_text, coderabbit_review_url = extract_coderabbit_prompt_bundle(payload)

    for review in payload["reviews"]:
        author_login = review.get("user", {}).get("login")
        canonical_author = canonicalize_author(author_login)
        if canonical_author not in allowed_authors:
            continue
        items.append(
            build_item(
                index=next_index,
                source_author=str(author_login),
                kind="review_body",
                body=str(review.get("body") or ""),
                url=review.get("html_url"),
                created_at=review.get("submitted_at"),
                updated_at=review.get("submitted_at"),
                review_id=review.get("id"),
                review_state=review.get("state"),
                commit_oid=review.get("commit_id"),
                actionable=False,
            )
        )
        next_index += 1
        if canonical_author == "coderabbitai" and coderabbit_prompt_text:
            prompt_items, next_index = parse_coderabbit_prompt_items(
                coderabbit_prompt_text,
                coderabbit_review_url,
                next_index,
            )
            items.extend(prompt_items)
            coderabbit_prompt_text = None

    for comment in payload["review_comments"]:
        author_login = comment.get("user", {}).get("login")
        canonical_author = canonicalize_author(author_login)
        if canonical_author not in allowed_authors:
            continue
        if canonical_author == "coderabbitai" and coderabbit_review_url:
            continue
        items.append(
            build_item(
                index=next_index,
                source_author=str(author_login),
                kind="review_comment",
                body=str(comment.get("body") or ""),
                url=comment.get("html_url"),
                created_at=comment.get("created_at"),
                updated_at=comment.get("updated_at"),
                path=comment.get("path"),
                line=comment.get("line"),
                original_line=comment.get("original_line"),
                thread_id=str(comment.get("pull_request_review_id") or ""),
                commit_oid=comment.get("commit_id"),
            )
        )
        next_index += 1

    items.sort(
        key=lambda item: (
            item["actionable"] is False,
            item["path"] or "",
            item["line"] or 0,
            item["source"],
            item["finding_id"],
        )
    )
    return items


def build_prompt_ready_payload(
    *,
    pull_request: dict[str, Any],
    items: list[dict[str, Any]],
    coderabbit_prompt: str | None,
    coderabbit_review_url: str | None,
) -> dict[str, Any]:
    codex_findings = [
        {
            "finding_id": item["finding_id"],
            "path": item["path"],
            "line": item["line"],
            "title": item["title"],
            "text": extract_codex_comment_text(item["body"]),
            "url": item["url"],
        }
        for item in items
        if item["source"] == "chatgpt-codex-connector"
        and item["kind"] == "review_comment"
    ]
    return {
        "pull_request": pull_request,
        "coderabbit": {
            "review_url": coderabbit_review_url,
            "prompt": coderabbit_prompt,
            "item_count": len(
                [
                    item
                    for item in items
                    if item["source"] == "coderabbitai"
                    and item["kind"] == "coderabbit_prompt_item"
                ]
            ),
        },
        "codex": {
            "finding_count": len(codex_findings),
            "findings": codex_findings,
        },
    }


def build_triage_template(
    pull_request: dict[str, Any],
    items: list[dict[str, Any]],
    run_id: str,
    pulled_at: str,
) -> dict[str, Any]:
    actionable_items = [item for item in items if item["actionable"]]
    return {
        "metadata": {
            "run_id": run_id,
            "pulled_at": pulled_at,
            "pull_request": pull_request,
            "actionable_count": len(actionable_items),
        },
        "items": [
            {
                "finding_id": item["finding_id"],
                "source": item["source"],
                "kind": item["kind"],
                "title": item["title"],
                "path": item["path"],
                "line": item["line"],
                "severity": item["severity"],
                "status": "pending",
                "rationale": "",
                "plan": "",
                "workstream": "",
                "owner": "",
                "url": item["url"],
            }
            for item in actionable_items
        ],
    }


def render_summary(
    *,
    run_id: str,
    pulled_at: str,
    pull_request: dict[str, Any],
    items: list[dict[str, Any]],
    prompt_ready_payload: dict[str, Any],
) -> str:
    actionable_items = [item for item in items if item["actionable"]]
    context_items = [item for item in items if not item["actionable"]]
    source_counts = Counter(item["source"] for item in items)
    kind_counts = Counter(item["kind"] for item in items)
    lines = [
        "# Review Sync Summary",
        "",
        f"- Run ID: `{run_id}`",
        f"- Pulled at: `{pulled_at}`",
        (
            f"- PR: [{pull_request['owner']}/{pull_request['repo']}#{pull_request['number']}]"
            f"({pull_request['url']}) - {pull_request['title']}"
        ),
        "- Sources: "
        + ", ".join(
            f"`{source}` ({count})" for source, count in sorted(source_counts.items())
        ),
        "- Kinds: "
        + ", ".join(
            f"`{kind}` ({count})" for kind, count in sorted(kind_counts.items())
        ),
        f"- Actionable items: `{len(actionable_items)}`",
        f"- Context-only items: `{len(context_items)}`",
        "- Primary outputs: `prompt_ready.md`, `coderabbit_prompt.txt`, `codex_findings.md`",
        "",
        "## Prompt Sources",
        "",
        (
            "- CodeRabbit consolidated prompt: "
            + ("available" if prompt_ready_payload["coderabbit"]["prompt"] else "not found")
        ),
        f"- CodeRabbit prompt items: `{prompt_ready_payload['coderabbit']['item_count']}`",
        f"- Codex findings: `{prompt_ready_payload['codex']['finding_count']}`",
        "",
        "## Codex Snapshot",
        "",
    ]

    codex_findings = prompt_ready_payload["codex"]["findings"]
    if codex_findings:
        for finding in codex_findings:
            location = finding["path"] or "pull-request"
            if finding["line"]:
                location = f"{location}:{finding['line']}"
            lines.append(f"- `{location}`")
            lines.append(f"  {finding['text']}")
    else:
        lines.append("- No Codex inline findings were extracted.")

    lines.extend(["", "## Context Only", ""])

    if context_items:
        for item in context_items:
            lines.append(
                f"- `{item['finding_id']}` | `{item['source']}` | `{item['kind']}`"
            )
            lines.append(f"  {item['title']}")
            if item["url"]:
                lines.append(f"  {item['url']}")
    else:
        lines.append("- No context-only items matched the configured sources.")

    return "\n".join(lines) + "\n"


def write_json(path: Path, value: Any) -> None:
    path.write_text(f"{json.dumps(value, indent=2)}\n", encoding="utf-8")


def cleanup_review_dir(out_dir: Path) -> None:
    if not out_dir.exists():
        return

    for child in out_dir.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
            continue
        if child.suffix != ".md":
            child.unlink()


def render_coderabbit_prompt_file(prompt_ready_payload: dict[str, Any]) -> str:
    prompt = prompt_ready_payload["coderabbit"]["prompt"]
    return f"{prompt}\n" if prompt else ""


def render_codex_findings_file(prompt_ready_payload: dict[str, Any]) -> str:
    pull_request = prompt_ready_payload["pull_request"]
    findings = prompt_ready_payload["codex"]["findings"]
    lines = [
        "# Codex Findings",
        "",
        (
            f"- PR: [{pull_request['owner']}/{pull_request['repo']}#{pull_request['number']}]"
            f"({pull_request['url']})"
        ),
        f"- Findings: `{len(findings)}`",
        "",
    ]

    if not findings:
        lines.append("No Codex findings were extracted.")
        return "\n".join(lines) + "\n"

    for index, finding in enumerate(findings, start=1):
        location = finding["path"] or "pull-request"
        if finding["line"]:
            location = f"{location}:{finding['line']}"
        lines.append(f"## {index}. `{location}`")
        lines.append("")
        lines.append(finding["text"])
        lines.append("")
        if finding["url"]:
            lines.append(f"Source: {finding['url']}")
            lines.append("")

    return "\n".join(lines) + "\n"


def render_prompt_ready_file(prompt_ready_payload: dict[str, Any]) -> str:
    pull_request = prompt_ready_payload["pull_request"]
    coderabbit_prompt = prompt_ready_payload["coderabbit"]["prompt"]
    coderabbit_review_url = prompt_ready_payload["coderabbit"]["review_url"]
    codex_findings = prompt_ready_payload["codex"]["findings"]

    lines = [
        "# Prompt-Ready Review Output",
        "",
        (
            f"- PR: [{pull_request['owner']}/{pull_request['repo']}#{pull_request['number']}]"
            f"({pull_request['url']}) - {pull_request['title']}"
        ),
        "",
        "## CodeRabbit",
        "",
    ]

    if coderabbit_review_url:
        lines.append(f"Source: {coderabbit_review_url}")
        lines.append("")

    if coderabbit_prompt:
        lines.append("```text")
        lines.append(coderabbit_prompt)
        lines.append("```")
    else:
        lines.append("No consolidated CodeRabbit prompt was extracted.")

    lines.extend(["", "## Codex", ""])

    if codex_findings:
        for index, finding in enumerate(codex_findings, start=1):
            location = finding["path"] or "pull-request"
            if finding["line"]:
                location = f"{location}:{finding['line']}"
            lines.append(f"{index}. `{location}`")
            lines.append(finding["text"])
            if finding["url"]:
                lines.append(f"   Source: {finding['url']}")
    else:
        lines.append("No Codex findings were extracted.")

    return "\n".join(lines) + "\n"


def write_outputs(
    *,
    out_dir: Path,
    pull_number: int,
    run_id: str,
    manifest: dict[str, Any],
    raw_payload: dict[str, Any],
    items: list[dict[str, Any]],
    triage: dict[str, Any],
    summary: str,
    prompt_ready_payload: dict[str, Any],
    debug: bool,
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    cleanup_review_dir(out_dir)
    output_file = out_dir / f"pr-{pull_number}-{run_id}.md"

    output_file.write_text(
        render_prompt_ready_file(prompt_ready_payload),
        encoding="utf-8",
    )

    if not debug:
        return output_file

    debug_dir = out_dir / f"pr-{pull_number}-{run_id}.debug"
    debug_dir.mkdir(parents=True, exist_ok=True)

    write_json(debug_dir / "manifest.json", manifest)
    write_json(debug_dir / "raw.json", raw_payload)
    write_json(debug_dir / "items.json", {"items": items})
    write_json(debug_dir / "triage.json", triage)
    write_json(debug_dir / "prompt_ready.json", prompt_ready_payload)
    (debug_dir / "summary.md").write_text(summary, encoding="utf-8")
    (debug_dir / "coderabbit_prompt.txt").write_text(
        render_coderabbit_prompt_file(prompt_ready_payload),
        encoding="utf-8",
    )
    (debug_dir / "codex_findings.md").write_text(
        render_codex_findings_file(prompt_ready_payload),
        encoding="utf-8",
    )
    (debug_dir / "prompt_ready.md").write_text(
        render_prompt_ready_file(prompt_ready_payload),
        encoding="utf-8",
    )

    return output_file


def main() -> None:
    args = parse_args()
    ensure_gh_ready()

    allowed_authors = {
        canonicalize_author(author.strip())
        for author in args.authors.split(",")
        if author.strip()
    }
    owner, repo, number = resolve_pull_request(args.pr, args.repo)
    pulled_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    raw_payload = fetch_feedback(owner, repo, number)
    items = flatten_relevant_items(raw_payload, allowed_authors)
    coderabbit_prompt, coderabbit_review_url = extract_coderabbit_prompt_bundle(raw_payload)
    prompt_ready_payload = build_prompt_ready_payload(
        pull_request=raw_payload["pull_request"],
        items=items,
        coderabbit_prompt=coderabbit_prompt,
        coderabbit_review_url=coderabbit_review_url,
    )
    triage = build_triage_template(raw_payload["pull_request"], items, run_id, pulled_at)
    summary = render_summary(
        run_id=run_id,
        pulled_at=pulled_at,
        pull_request=raw_payload["pull_request"],
        items=items,
        prompt_ready_payload=prompt_ready_payload,
    )
    out_dir = Path(args.out_dir)
    manifest = {
        "latest_run_id": run_id,
        "latest_run_dir": str((out_dir / "runs" / run_id).as_posix()),
        "pulled_at": pulled_at,
        "sources": sorted(allowed_authors),
        "pull_request": raw_payload["pull_request"],
        "counts": {
            "total_items": len(items),
            "actionable_items": len([item for item in items if item["actionable"]]),
            "context_items": len([item for item in items if not item["actionable"]]),
        },
        "prompt_outputs": {
            "coderabbit_prompt": bool(coderabbit_prompt),
            "coderabbit_prompt_items": prompt_ready_payload["coderabbit"]["item_count"],
            "codex_findings": prompt_ready_payload["codex"]["finding_count"],
        },
    }
    output_file = write_outputs(
        out_dir=out_dir,
        pull_number=number,
        run_id=run_id,
        manifest=manifest,
        raw_payload=raw_payload,
        items=items,
        triage=triage,
        summary=summary,
        prompt_ready_payload=prompt_ready_payload,
        debug=args.debug,
    )

    print(f"Synced review feedback for {owner}/{repo}#{number}")
    print(f"Run: {run_id}")
    print(f"Output: {output_file}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        sys.exit(1)
