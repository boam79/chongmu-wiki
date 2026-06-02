"""Layer 1 parser tests — regex, skip filters, MD5 dedup, BOM handling."""

from __future__ import annotations

import hashlib
import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

from process import (  # noqa: E402
    MSG_PATTERN,
    SKIP,
    SYSTEM,
    is_skipped,
    make_hash,
    parse_layer1,
    parse_message_line,
)

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_chat.txt"


class TestParseMessageLine(unittest.TestCase):
    def test_valid_message(self) -> None:
        line = "2025년 3월 11일 오후 2:21, 태현/총무/제조업 : 그룹웨어 어떤거 쓰시나요?"
        result = parse_message_line(line)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["dt"], "2025년 3월 11일 오후 2:21")
        self.assertEqual(result["sender"], "태현/총무/제조업")
        self.assertEqual(result["text"], "그룹웨어 어떤거 쓰시나요?")
        self.assertEqual(len(result["hash"]), 32)

    def test_header_line_returns_none(self) -> None:
        self.assertIsNone(parse_message_line("저장한 날짜 : 2026년 6월 1일 오전 10:39"))

    def test_join_without_colon_returns_none(self) -> None:
        line = "2025년 3월 11일 오후 2:08, 총무(GA) / IT / 11년차님이 들어왔습니다."
        self.assertIsNone(parse_message_line(line))

    def test_regex_matches_prd_pattern(self) -> None:
        sample = "2025년 3월 11일 오후 2:21, 태현/총무/제조업 : hello"
        self.assertIsNotNone(MSG_PATTERN.match(sample))


class TestSkipMediaAndSystem(unittest.TestCase):
    def test_skip_media_placeholders(self) -> None:
        for text in SKIP:
            with self.subTest(text=text):
                self.assertTrue(is_skipped(text, "someone/총무/IT"))

    def test_skip_openchat_bot_sender(self) -> None:
        self.assertTrue(is_skipped("안녕하세요", "오픈채팅봇"))

    def test_skip_system_keywords_in_text(self) -> None:
        for keyword in SYSTEM:
            if keyword == "오픈채팅봇":
                continue
            with self.subTest(keyword=keyword):
                self.assertTrue(is_skipped(f"홍길동님이 {keyword}", "시스템"))

    def test_emoticon_message_skipped(self) -> None:
        self.assertIsNone(
            parse_message_line("2025년 3월 11일 오후 2:09, 재민/관리/의료기관 : 이모티콘")
        )

    def test_bot_message_skipped(self) -> None:
        self.assertIsNone(
            parse_message_line(
                "2025년 3월 11일 오후 2:08, 오픈채팅봇 : 안녕하세요. 총무를 위한 커뮤니티 입니다"
            )
        )


class TestDedupHash(unittest.TestCase):
    def test_hash_uses_first_120_chars(self) -> None:
        dt, sender = "2025년 3월 11일 오후 2:21", "태현/총무/제조업"
        long_text = "a" * 200
        expected = hashlib.md5((dt + sender + "a" * 120).encode("utf-8")).hexdigest()
        self.assertEqual(make_hash(dt, sender, long_text), expected)

    def test_duplicate_messages_removed(self) -> None:
        messages = parse_layer1(FIXTURE)
        texts = [message["text"] for message in messages]
        question = "다른분들 회사에서 그룹웨어 어떤거 쓰시나요?"
        self.assertEqual(texts.count(question), 1)

    def test_duplicate_morezon_messages_kept_once_each_sender(self) -> None:
        messages = parse_layer1(FIXTURE)
        morezon = [message for message in messages if message["text"] == "더존"]
        self.assertEqual(len(morezon), 2)


class TestLayer1Fixture(unittest.TestCase):
    def test_bom_handled(self) -> None:
        raw = FIXTURE.read_bytes()
        self.assertTrue(raw.startswith(b"\xef\xbb\xbf"))
        messages = parse_layer1(FIXTURE)
        self.assertGreater(len(messages), 0)
        self.assertEqual(messages[0]["sender"], "태현/총무/제조업")

    def test_expected_message_count(self) -> None:
        messages = parse_layer1(FIXTURE)
        # 50-line fixture: headers/system/media skipped; 1 exact duplicate removed
        self.assertEqual(len(messages), 33)

    def test_output_schema(self) -> None:
        messages = parse_layer1(FIXTURE)
        for message in messages:
            self.assertEqual(set(message.keys()), {"dt", "sender", "text", "hash"})
            self.assertRegex(message["dt"], r"^\d{4}년\s*\d+월\s*\d+일")
            self.assertEqual(len(message["hash"]), 32)

    def test_no_skipped_content_in_output(self) -> None:
        messages = parse_layer1(FIXTURE)
        for message in messages:
            self.assertNotIn(message["text"].strip(), SKIP)
            for keyword in SYSTEM:
                self.assertNotIn(keyword, message["text"])
                self.assertNotIn(keyword, message["sender"])


if __name__ == "__main__":
    unittest.main()
