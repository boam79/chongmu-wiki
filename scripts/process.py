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


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="KakaoTalk parser v2")
    parser.add_argument("source", nargs="?", help="KakaoTalk export .txt")
    parser.add_argument("--season", type=int, default=1)
    parser.add_argument("--dry", action="store_true", help="Parse only, print stats")
    parser.add_argument(
        "-o",
        "--output",
        default="messages.jsonl",
        help="Output JSONL path",
    )
    args = parser.parse_args()

    if not args.source:
        parser.print_help()
        return

    messages = parse_layer1(args.source)
    if args.dry:
        print(f"season={args.season} messages={len(messages)}")
        if messages:
            print(f"first={messages[0]['dt']} sender={messages[0]['sender']}")
            print(f"last={messages[-1]['dt']} sender={messages[-1]['sender']}")
        return

    write_messages_jsonl(messages, args.output)
    print(f"wrote {len(messages)} messages -> {args.output}")


if __name__ == "__main__":
    main()
