"""Merge + dedup tests for season 2 cumulative uploads."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

from process import (  # noqa: E402
    compute_basic_analytics,
    load_messages_jsonl,
    merge_messages,
    parse_layer1,
    write_messages_jsonl,
)

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_chat.txt"


class TestMergeMessages(unittest.TestCase):
    def test_merge_deduplicates_by_hash(self) -> None:
        batch_a = parse_layer1(FIXTURE)
        batch_b = parse_layer1(FIXTURE)
        merged = merge_messages(batch_a, batch_b)
        self.assertEqual(len(merged), len(batch_a))
        self.assertEqual(len({m["hash"] for m in merged}), len(merged))

    def test_merge_appends_new_messages(self) -> None:
        existing = [
            {
                "dt": "2025년 1월 1일 오전 9:00",
                "sender": "A/총무/IT",
                "text": "hello",
                "hash": "aaa",
            }
        ]
        incoming = [
            {
                "dt": "2025년 1월 2일 오전 9:00",
                "sender": "B/총무/IT",
                "text": "world",
                "hash": "bbb",
            }
        ]
        merged = merge_messages(existing, incoming)
        self.assertEqual(len(merged), 2)
        self.assertEqual(merged[0]["hash"], "aaa")
        self.assertEqual(merged[1]["hash"], "bbb")

    def test_merge_skips_duplicate_in_incoming(self) -> None:
        msg = {
            "dt": "2025년 1월 1일 오전 9:00",
            "sender": "A/총무/IT",
            "text": "dup",
            "hash": "same",
        }
        merged = merge_messages([msg], [msg, msg])
        self.assertEqual(len(merged), 1)

    def test_load_and_write_jsonl_roundtrip(self) -> None:
        messages = parse_layer1(FIXTURE)[:5]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "messages.jsonl"
            write_messages_jsonl(messages, path)
            loaded = load_messages_jsonl(path)
            self.assertEqual(loaded, messages)

    def test_load_missing_jsonl_returns_empty(self) -> None:
        self.assertEqual(load_messages_jsonl("/nonexistent/messages.jsonl"), [])


class TestComputeBasicAnalytics(unittest.TestCase):
    def test_analytics_fields(self) -> None:
        messages = parse_layer1(FIXTURE)
        stats = compute_basic_analytics(messages, season=2)
        self.assertEqual(stats["season"], 2)
        self.assertEqual(stats["total_messages"], len(messages))
        self.assertGreater(stats["member_count"], 0)
        self.assertIn("hourly", stats["time_analysis"])
        self.assertIn("weekday", stats["time_analysis"])
        self.assertIn("peak_hour", stats["time_analysis"])
        self.assertIsInstance(stats["monthly_stats"], dict)
        self.assertGreater(len(stats["monthly_stats"]), 0)
        self.assertEqual(len(stats["top_members"]), min(10, stats["member_count"]))


if __name__ == "__main__":
    unittest.main()
