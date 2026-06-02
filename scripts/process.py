#!/usr/bin/env python3
"""KakaoTalk chat parser — Layer 1 (basic parsing) per PRD v2."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Iterator

MSG_PATTERN = re.compile(
    r"^(\d{4}년\s*\d+월\s*\d+일\s*(?:오전|오후)\s*\d+:\d+),\s*([^:]+?)\s*:\s*(.+)$"
)

SKIP = {"이모티콘", "<사진 읽지 않음>", "동영상", "파일", "연락처", "음성메시지"}
SYSTEM = ["들어왔습니다", "나갔습니다", "초대했습니다", "오픈채팅봇"]


def make_hash(dt: str, sender: str, text: str) -> str:
    """MD5(datetime + sender + text[:120]) for deduplication."""
    key = dt + sender + text[:120]
    return hashlib.md5(key.encode("utf-8")).hexdigest()


def is_skipped(text: str, sender: str) -> bool:
    """Return True for media placeholders or system messages."""
    stripped = text.strip()
    if stripped in SKIP:
        return True
    return any(keyword in stripped or keyword in sender for keyword in SYSTEM)


def parse_message_line(line: str) -> dict | None:
    """Parse a single KakaoTalk export line into a message dict, or None."""
    match = MSG_PATTERN.match(line.strip())
    if not match:
        return None

    dt, sender, text = match.group(1), match.group(2).strip(), match.group(3)
    if is_skipped(text, sender):
        return None

    return {
        "dt": dt,
        "sender": sender,
        "text": text,
        "hash": make_hash(dt, sender, text),
    }


def parse_layer1(source: Path | str) -> list[dict]:
    """Layer 1: extract messages, filter media/system, deduplicate by hash."""
    path = Path(source)
    seen: set[str] = set()
    messages: list[dict] = []

    with path.open(encoding="utf-8-sig") as handle:
        for line in handle:
            message = parse_message_line(line)
            if message is None:
                continue
            if message["hash"] in seen:
                continue
            seen.add(message["hash"])
            messages.append(message)

    return messages


def write_messages_jsonl(messages: list[dict], output: Path | str) -> None:
    """Write parsed messages to JSONL."""
    out_path = Path(output)
    with out_path.open("w", encoding="utf-8") as handle:
        for message in messages:
            handle.write(json.dumps(message, ensure_ascii=False) + "\n")


def iter_messages(source: Path | str) -> Iterator[dict]:
    """Stream Layer 1 messages without loading the full file into a list."""
    path = Path(source)
    seen: set[str] = set()

    with path.open(encoding="utf-8-sig") as handle:
        for line in handle:
            message = parse_message_line(line)
            if message is None:
                continue
            if message["hash"] in seen:
                continue
            seen.add(message["hash"])
            yield message


STORAGE_BUCKET = "chat-exports"


def _load_env_file(path: Path) -> None:
    """Load KEY=VALUE lines into os.environ (does not override existing)."""
    import os

    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if key and key not in os.environ:
            os.environ[key] = value


def upload_file_to_storage(
    local_path: Path,
    remote_path: str,
    *,
    content_type: str,
    upsert: bool = True,
) -> dict:
    """Upload a file to Supabase Storage via REST (stdlib only)."""
    import os
    import urllib.error
    import urllib.request

    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY", ""
    )
    if not base or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) "
            "must be set in .env.local for --upload"
        )

    body = local_path.read_bytes()
    url = f"{base}/storage/v1/object/{STORAGE_BUCKET}/{remote_path}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": content_type,
        "x-upsert": "true" if upsert else "false",
    }
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Storage upload failed ({exc.code}): {detail}") from exc

    return {"path": remote_path, "bytes": len(body), "response": payload}


def upload_season_artifacts(
    season: int,
    source_txt: Path,
    messages_jsonl: Path,
) -> None:
    """Season 1 archive: raw .txt + parsed .jsonl (PRD Storage)."""
    prefix = f"season-{season}"
    print(f"uploading to {STORAGE_BUCKET}/{prefix}/ ...")

    upload_file_to_storage(
        source_txt,
        f"{prefix}/KakaoTalkChats.txt",
        content_type="text/plain; charset=utf-8",
        upsert=season != 1,
    )
    print(f"  OK {prefix}/KakaoTalkChats.txt")

    if messages_jsonl.is_file():
        upload_file_to_storage(
            messages_jsonl,
            f"{prefix}/messages.jsonl",
            content_type="application/x-ndjson",
            upsert=season != 1,
        )
        print(f"  OK {prefix}/messages.jsonl")


def main() -> None:
    import argparse
    import os

    parser = argparse.ArgumentParser(description="KakaoTalk parser v2")
    parser.add_argument("source", nargs="?", help="KakaoTalk export .txt")
    parser.add_argument("--season", type=int, default=1)
    parser.add_argument("--dry", action="store_true", help="Parse only, print stats")
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Upload season txt + messages.jsonl to Supabase Storage",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output JSONL path (default: analytics/season-N/messages.jsonl)",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    _load_env_file(repo_root / ".env.local")

    if not args.source:
        parser.print_help()
        return

    source = Path(args.source)
    output = Path(
        args.output or repo_root / "analytics" / f"season-{args.season}" / "messages.jsonl"
    )

    if args.dry:
        messages = parse_layer1(source)
        print(f"season={args.season} messages={len(messages)}")
        if messages:
            print(f"first={messages[0]['dt']} sender={messages[0]['sender']}")
            print(f"last={messages[-1]['dt']} sender={messages[-1]['sender']}")
        return

    messages = parse_layer1(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    write_messages_jsonl(messages, output)
    print(f"wrote {len(messages)} messages -> {output}")

    if args.upload:
        if args.season == 1:
            os.environ.setdefault("SEASON_ARCHIVE", "ARCHIVED")
        upload_season_artifacts(args.season, source.resolve(), output.resolve())
        print(f"season {args.season} storage upload complete")


if __name__ == "__main__":
    main()
