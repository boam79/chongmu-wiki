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


def load_messages_jsonl(path: Path | str) -> list[dict]:
    """Load messages from JSONL (empty list if missing)."""
    jsonl_path = Path(path)
    if not jsonl_path.is_file():
        return []
    messages: list[dict] = []
    with jsonl_path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            messages.append(json.loads(line))
    return messages


def merge_messages(existing: list[dict], incoming: list[dict]) -> list[dict]:
    """Append incoming messages, deduplicating by hash (existing order preserved)."""
    seen = {message["hash"] for message in existing}
    merged = list(existing)
    for message in incoming:
        if message["hash"] in seen:
            continue
        seen.add(message["hash"])
        merged.append(message)
    return merged


KOREAN_DT = re.compile(
    r"^(\d{4})년\s*(\d+)월\s*(\d+)일\s*(오전|오후)\s*(\d+):(\d+)$"
)
WEEKDAY_KO = ("월", "화", "수", "목", "금", "토", "일")


def parse_korean_datetime(dt_str: str) -> tuple[str | None, int | None, str | None]:
    """Return (iso_date, hour_0_23, weekday_ko) from KakaoTalk datetime string."""
    match = KOREAN_DT.match(dt_str.strip())
    if not match:
        return None, None, None

    year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
    ampm, hour12 = match.group(4), int(match.group(5))
    if ampm == "오전":
        hour = 0 if hour12 == 12 else hour12
    else:
        hour = 12 if hour12 == 12 else hour12 + 12

    from datetime import date

    parsed_date = date(year, month, day)
    iso_date = parsed_date.isoformat()
    weekday = WEEKDAY_KO[parsed_date.weekday()]
    return iso_date, hour, weekday


def compute_basic_analytics(messages: list[dict], season: int) -> dict:
    """Layer 1 stats for analytics_snapshots (MVP slice)."""
    from collections import Counter
    from datetime import date

    sender_counts: Counter[str] = Counter()
    hourly: Counter[int] = Counter()
    weekday: Counter[str] = Counter()
    monthly: Counter[str] = Counter()
    dates: list[date] = []

    for message in messages:
        sender_counts[message["sender"]] += 1
        iso_date, hour, wd = parse_korean_datetime(message["dt"])
        if iso_date:
            parsed = date.fromisoformat(iso_date)
            dates.append(parsed)
            monthly[f"{parsed.year:04d}-{parsed.month:02d}"] += 1
        if hour is not None:
            hourly[hour] += 1
        if wd:
            weekday[wd] += 1

    first_date = min(dates).isoformat() if dates else None
    last_date = max(dates).isoformat() if dates else None
    top_members = [
        {"name": name, "count": count}
        for name, count in sender_counts.most_common(10)
    ]
    monthly_stats = dict(sorted(monthly.items()))
    peak_hour = max(hourly, key=hourly.get) if hourly else None

    season_labels = {
        1: "시즌 1 · 아카이브",
        2: "시즌 2 · 실무왕 박총무",
    }

    return {
        "season": season,
        "season_label": season_labels.get(season, f"시즌 {season}"),
        "season_start": first_date,
        "season_end": last_date if season == 1 else None,
        "snapshot_date": date.today().isoformat(),
        "first_date": first_date,
        "last_date": last_date,
        "total_messages": len(messages),
        "member_count": len(sender_counts),
        "active_months": len(monthly_stats),
        "top_members": top_members,
        "monthly_stats": monthly_stats,
        "time_analysis": {
            "hourly": {str(h): hourly.get(h, 0) for h in range(24)},
            "weekday": {wd: weekday.get(wd, 0) for wd in WEEKDAY_KO},
            "peak_hour": peak_hour,
        },
        "is_active": True,
    }


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


def seed_analytics_snapshot(analytics: dict) -> dict:
    """Insert active analytics_snapshots row (deactivates prior rows for season)."""
    import os
    import urllib.error
    import urllib.request

    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY", ""
    )
    if not base or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set for --seed-db"
        )

    season = analytics["season"]
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    deactivate_url = (
        f"{base}/rest/v1/analytics_snapshots?season=eq.{season}&is_active=eq.true"
    )
    deactivate_req = urllib.request.Request(
        deactivate_url,
        data=json.dumps({"is_active": False}).encode("utf-8"),
        headers={**headers, "Prefer": "return=minimal"},
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(deactivate_req, timeout=60):
            pass
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Deactivate failed ({exc.code}): {detail}") from exc

    row = {
        "season": analytics["season"],
        "season_label": analytics["season_label"],
        "season_start": analytics["season_start"],
        "season_end": analytics.get("season_end"),
        "snapshot_date": analytics["snapshot_date"],
        "first_date": analytics["first_date"],
        "last_date": analytics["last_date"],
        "total_messages": analytics["total_messages"],
        "member_count": analytics["member_count"],
        "active_months": analytics["active_months"],
        "top_members": analytics["top_members"],
        "monthly_stats": analytics.get("monthly_stats"),
        "time_analysis": analytics["time_analysis"],
        "is_active": True,
    }
    if season == 1:
        row["recent_batch"] = {
            "source": "KakaoTalkChats.txt",
            "archived": True,
        }

    insert_url = f"{base}/rest/v1/analytics_snapshots"
    insert_req = urllib.request.Request(
        insert_url,
        data=json.dumps(row, ensure_ascii=False).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(insert_req, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Insert failed ({exc.code}): {detail}") from exc

    return payload[0] if isinstance(payload, list) else payload


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
    parser.add_argument(
        "--merge",
        default=None,
        help="Existing messages.jsonl to merge with (season 2+ append mode)",
    )
    parser.add_argument(
        "--print-analytics",
        action="store_true",
        help="Print basic analytics JSON to stdout after processing",
    )
    parser.add_argument(
        "--seed-db",
        action="store_true",
        help="Upsert analytics_snapshots via Supabase REST (needs service key)",
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

    incoming = parse_layer1(source)
    if args.merge:
        existing = load_messages_jsonl(args.merge)
        messages = merge_messages(existing, incoming)
        print(
            f"merge: existing={len(existing)} incoming={len(incoming)} "
            f"merged={len(messages)}"
        )
    else:
        messages = incoming

    output.parent.mkdir(parents=True, exist_ok=True)
    write_messages_jsonl(messages, output)
    print(f"wrote {len(messages)} messages -> {output}")

    analytics = compute_basic_analytics(messages, args.season)

    if args.print_analytics:
        print("__ANALYTICS_JSON__" + json.dumps(analytics, ensure_ascii=False))

    if args.seed_db:
        inserted = seed_analytics_snapshot(analytics)
        print(
            f"seed-db: season={args.season} total_messages="
            f"{inserted.get('total_messages', analytics['total_messages'])}"
        )

    if args.upload:
        if args.season == 1:
            os.environ.setdefault("SEASON_ARCHIVE", "ARCHIVED")
        upload_season_artifacts(args.season, source.resolve(), output.resolve())
        print(f"season {args.season} storage upload complete")


if __name__ == "__main__":
    main()
