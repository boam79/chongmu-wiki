# 총무위키 (chongmu-wiki) — Planner Scratchpad

> **모드**: Executor  
> **최종 갱신**: 2026-06-02  
> **레퍼런스**: https://chongmu-wiki-06011322.netlify.app/

---

## Background and Motivation

### 현재 저장소 상태
| 항목 | 상태 |
|------|------|
| `총무위키_PRD_v2.0.md` | ✅ 완료 (1,381줄, DRAFT) |
| `KakaoTalkChats.txt` | ✅ 시즌 1 원본 (~17MB, 189K lines) |
| `scripts/process.py` L1 | ✅ + 테스트 16/16 |
| Next.js 앱 | ✅ scaffold, build OK, Sidebar(272px) |
| Supabase `chongmu-wiki` | ✅ `ibzxzhepsorsqqdcbfgo`, 4 tables + RLS |
| GitHub | ✅ https://github.com/boam79/chongmu-wiki (`main`, initial push) |
| Vercel `chongmu-wiki` 프로젝트 | ✅ https://chongmu-wiki.vercel.app (GitHub `boam79/chongmu-wiki` 연동) |

### 제품 목표 (PRD One-liner)
KakaoTalk 오픈채팅 163K 메시지에서 **파싱 가능한 데이터를 최대 추출** → 총무·경영지원 실무 **데이터 기반 위키** (`chongmu-wiki.com`).

### 시즌 전략
- **시즌 1**: `KakaoTalkChats.txt` → `ARCHIVED` (불변)
- **시즌 2**: 2026-06-01~ 신규 방, 6개월마다 append

### TXT 실측 vs PRD (Planner 검증, 2026-06-02)
| 지표 | TXT 스캔 | PRD |
|------|----------|-----|
| 유효 대화 | 165,986 | 163,979 |
| 발신자 | 122 | 121 |
| 60자+ | 2,272 | 2,278 |
| 피크 시간 | 15·16시 | 15·16시 |
| 기간 | 2025-03 ~ 2026-05 | 2025-03-11 ~ 2026-05-26 |

차이는 **MD5 중복 제거·질문 패턴 확장·시스템 메시지 정의**로 설명 가능 → `process.py` 골든 테스트로 PRD 수치 수렴 목표.

---

## Key Challenges and Analysis

### 1. 데이터 파이프라인 (최우선 리스크)
- 17MB 단일 파일 → **스트리밍 파싱** 필수 (전체 메모리 로드 지양)
- UTF-8 **BOM** (`﻿`) 첫 줄 → `utf-8-sig` 또는 strip
- 이모티콘 13K+ 건 → Layer 1 필터 정확도가 지표 전체에 영향
- PRD: **stdlib only** → 테스트는 `pytest` 또는 `unittest` (의존성 문서화 필요)

### 2. 인프라 의존성 (Robin 결정 필요)
| 결정 | 권장 (Planner) | 근거 |
|------|----------------|------|
| Supabase | **신규 프로젝트** `chongmu-wiki`, region `ap-northeast-2` | 기존 `policyfund-ai-v2` 등과 분리 |
| Vercel | 신규 프로젝트 + GitHub 연동 | 팀 `ckadltmfxhrxhrxhr-5008s-projects` 확인됨 |
| 도메인 | `chongmu-wiki.com` | PRD 확정, DNS는 Robin |
| 레퍼런스 UI | PRD 색상/레이아웃 스펙 유지 | 별도 URL 미포함 → Robin 스크린샷/URL 요청 |

### 3. 보안 (MCP Supabase 문서 반영)
- **Service Role Key**: 서버 Route Handler 전용 (`/api/admin/upload`)
- RLS: `SELECT` 공개(anon), `INSERT/UPDATE` authenticated only
- Admin: `/admin/**` — Proxy에서 `getClaims()` / `getUser()`로 보호 (PRD: 이메일 1인)
- `messages.jsonl` → Supabase Storage (~26MB) — 버킷 정책 별도 설계

### 4. 렌더링 (MCP Vercel 문서 반영)
- `/dashboard`, `/activity`: `export const revalidate = 3600`
- `/[slug]`: `revalidate = 86400`
- 업로드 후: `revalidatePath('/dashboard')` + `revalidatePath('/activity')` + `REVALIDATE_SECRET` 쿼리

### 5. 병렬 개발 전략
```
Track A (Data)     process.py L1→L6 → analytics.json → Supabase upsert
Track B (Infra)    Supabase migration + Auth + Storage
Track C (Web)      Next.js scaffold → layout → dashboard/activity
```
- **병목**: Track C는 `analytics.json` 샘플 또는 목(mock) JSON으로 UI 선행 가능
- **통합 게이트**: M2 — 실데이터 차트 5종 + Supabase `is_active` 스냅샷

### 6. 서브에이전트 / MCP 실행 로그 (2026-06-02)
| 도구 | 결과 |
|------|------|
| Task (explore ×2) | API 한도 → Composer 폴백, 본 Planner가 대체 분석 |
| Supabase `list_projects` | 2개 (policyfund, boam79) — **chongmu-wiki 없음** |
| Supabase `search_docs` | SSR `@supabase/ssr`, RLS 패턴 확보 |
| Vercel `search_vercel_documentation` | ISR `revalidate`, `revalidatePath` 패턴 확보 |
| Vercel `list_projects` | 9개 — chongmu-wiki 미등록 |
| Context7 `resolve-library-id` | 파라미터 스키마 불일치 — Executor 시 `libraryName` 사용 |

---

## High-level Task Breakdown

> Executor는 **한 번에 1개 태스크만** 수행. 완료 후 Robin 검증 → 다음 태스크.

### Phase 0 — 저장소 기반 (0.5일)
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P0-1 | `.gitignore` (`.env*`, `messages.jsonl`, `analytics.json`, `__pycache__`) | 민감/대용량 미커밋 |
| P0-2 | `README.md` 최소 (실행 명령, env 목록) | Robin이 로컬 재현 가능 |
| P0-3 | `data/` 디렉터리 + `KakaoTalkChats.txt` 심볼릭 링크 또는 문서화 | 파이프라인 경로 고정 |

### Phase 1 — Track A: `process.py` v2 (4~5일, TDD)

#### P1-A: Layer 1 기본 파싱
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P1-1 | `tests/fixtures/sample_chat.txt` (50줄, BOM·이모티콘·시스템 포함) | fixture 커밋 |
| P1-2 | `process.py` L1: regex, SKIP, MD5 dedup | 테스트 green |
| P1-3 | `messages.jsonl` 출력 + `--dry` | 샘플 50줄 → N건 일치 |
| P1-4 | **풀런** `KakaoTalkChats.txt` | `total_messages` ∈ [163900, 164100], members ∈ [120,122] |

**TDD 순서 (권장)**
1. `test_parse_message_line` — 정규식
2. `test_skip_media_and_system`
3. `test_dedup_hash`
4. `test_full_file_counts` — `@pytest.mark.slow` (CI optional)

#### P1-B: Layer 2~3
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P1-5 | L2 time_analysis (hourly, weekday, monthly) | peak_hour=15, peak_weekday=Wed |
| P1-6 | L3 nickname parser + industry_map | slash 닉 100+ 샘플 통과 |
| P1-7 | member_profiles + industry_distribution | top_member 1위 ≈ 만(나성)피로 |

#### P1-C: Layer 4~6
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P1-8 | L4 TOPICS/VENDORS/LAWS/AMOUNT 사전 | topic_counts 20+ 키 |
| P1-9 | L5 questions + community_health | questions.total ≈ 14.9K (±5%) |
| P1-10 | L6 quotes score + auto_insights | top_quotes 50건, season_headline 비空 |
| P1-11 | `analytics.json` v2 스키마 검증 | PRD §3-8 필드 전부 존재 |
| P1-12 | CLI: `--season`, `--generate`, `--analyze-only` | help 문서화 |

#### P1-D: 업로드 (Supabase 준비 후)
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P1-13 | `--upload` upsert `analytics_snapshots` | season=1, is_active=true 1행 |
| P1-14 | Storage `messages.jsonl` 업로드 | ~26MB 완료 |

### Phase 1 — Track B: Supabase (1~2일)
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P1-15 | Supabase 프로젝트 생성 (ap-northeast-2) | URL·keys 확보 |
| P1-16 | migration: 4 tables (PRD §6) | `list_tables` 확인 |
| P1-17 | RLS: public read, auth write | anon SELECT OK |
| P1-18 | Auth: Robin 이메일 1계정 | `/admin` 로그인 |
| P1-19 | seed: `wiki_sections` 9행 | slug 9개 |
| P1-20 | seed: season 1 `analytics_snapshots` | dashboard API 응답 |

### Phase 1 — Track C: Next.js MVP (5~7일)
| ID | 작업 | 성공 기준 |
|----|------|-----------|
| P1-21 | `create-next-app` TS + Tailwind + App Router | `npm run build` OK |
| P1-22 | shadcn + 다크 테마 (PRD §10 색상) | Sidebar 260px |
| P1-23 | `@supabase/ssr` client/server + proxy | admin 보호 |
| P1-24 | `lib/analytics.ts` getLatestAnalytics(season) | 타입 정의 |
| P1-25 | `/dashboard` ISR 3600 | 4 stat cards + headline |
| P1-26 | `/activity` 시즌 탭 + MonthlyChart | 시즌 1 데이터 |
| P1-27 | `/[slug]` + ContentBlock 5종 | 9 slug SSG |
| P1-28 | `/api/admin/upload` + revalidate route | 업로드 후 캐시 갱신 |
| P1-29 | Vercel 배포 + env | preview URL 동작 |

### Phase 2 — 고도화 (1~2주, PRD)
- HourlyHeatmap, TopicTrendChart, VendorRankChart
- FAQ `/activity` 하단
- 위키 vendor mention 자동 주입
- Admin 블록 편집 + dnd-kit

### Phase 3 — 미래
- FTS/Algolia, ⌘K, GA4, OG dynamic

---

## Effort Estimate (Planner)

| Phase | 기간 | 인력 |
|-------|------|------|
| P0 + P1-A (L1~L3) | 3~4일 | 1 Executor |
| P1-A (L4~6) + upload | 2일 | 1 Executor |
| P1-B Supabase | 1~2일 | Robin MCP 승인 + Executor |
| P1-C Next.js | 5~7일 | Executor (UI mock 병행 가능) |
| **MVP 합계** | **2~3주** | PRD Phase 1과 일치 |

---

## Milestones (PRD §12 정렬)

| ID | 완료 기준 | 의존 태스크 |
|----|-----------|-------------|
| **M1** | 레퍼런스 UI 재현 (정적 위키 9섹션) | P1-21~27 + wiki seed |
| **M2** | analytics → dashboard/activity 차트 | P1-4~11, P1-20, P1-25~26 |
| **M3** | chongmu-wiki.com, Lighthouse ≥90 | P1-29, DNS |
| **M4** | `process.py --season 2` 5분 반영 | P1-13~14, P1-28 |

---

## Project Status Board

### Planner
- [x] PRD·TXT 분석 완료
- [x] MCP 인프라 조사 (Supabase/Vercel)
- [x] scratchpad 초안 작성
- [ ] Robin: Supabase 신규 프로젝트 생성 승인
- [ ] Robin: 레퍼런스 사이트 URL/스크린샷 제공
- [ ] Robin: Executor 모드 1차 태스크 승인 (**권장: P0-1 또는 P1-1**)

### Executor (P1-1, P1-2 완료 — 2026-06-02)
- [x] P0-1 `.gitignore`
- [x] P1-1 `scripts/tests/fixtures/sample_chat.txt` (50줄, BOM·이모티콘·시스템·중복 포함)
- [x] P1-2 `scripts/process.py` Layer 1 (regex, SKIP, SYSTEM, MD5 dedup, utf-8-sig)
- [x] `scripts/tests/test_process_l1.py` — 16 tests green
- [x] `README.md` 최소 명령
- [x] P1-3 `--dry` CLI (`scripts/process.py`)
- [ ] P1-4 풀런 KakaoTalkChats.txt → messages.jsonl
- [x] P1-15~17 Supabase `chongmu-wiki` ref `ibzxzhepsorsqqdcbfgo`
- [x] P1-21~27 Next.js + Netlify 레퍼런스 Sidebar(272px) + build OK

---

## Executor's Feedback or Assistance Requests

### P1-1 / P1-2 완료 보고 (2026-06-02)
- Layer 1 파서 + 16개 unittest 전부 통과
- fixture 50줄 → 유효 메시지 33건 (미디어·시스템·중복 1건 제거)
- **다음 태스크**: P1-3 (`--dry`, messages.jsonl CLI) — Robin 검증 후 진행

### Vercel 배포 완료 (2026-06-02, Executor)
- `vercel link --project chongmu-wiki` → `prj_kHswHmWsS6KE2pw8XmCHGNLJUz6H`
- Production: **https://chongmu-wiki.vercel.app** (`dpl_GT23cqcVqY9nB7BkRhpPK6YcSVcv`, READY)
- Vercel MCP: `list_projects`, `get_project`, `list_deployments`, `web_fetch_vercel_url` 확인 / `deploy_to_vercel`는 CLI 안내
- Production env (Vercel): `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_URL`, `REVALIDATE_SECRET`, `VERCEL_REVALIDATE_TOKEN`, `VERCEL_PROJECT_URL`
- **미설정 (로컬 `.env.local`도 비어 있음)**: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY` → admin 업로드·Storage용 Dashboard 수동 입력
- **수동 남은 것**: Git 연동 확인( Settings → Git ), Preview/Development env 복제, PRD 도메인 `chongmu-wiki.com`

### Robin에게 필요한 결정 (블로커)
1. **Supabase**: 신규 `chongmu-wiki` 프로젝트 생성해도 될까요? (region: Seoul)
2. **레퍼런스 사이트 URL**: M1 UI 매칭용
3. **Executor 1차 태스크**: `P1-1`(TDD fixture) vs `P1-21`(Next scaffold) 중 우선순위
4. **위키 초기 콘텐츠**: PRD 9섹션 — 수동 작성 vs 레퍼런스 크롤(법적 검토)

### MCP 활용 계획 (Executor 단계)
| 단계 | MCP |
|------|-----|
| 스키마 | Supabase `apply_migration`, `get_advisors` |
| Next.js | Context7 `/vercel/next.js`, Vercel `search_vercel_documentation` |
| 배포 | Vercel `deploy_to_vercel`, `list_deployments` |
| 도메인 | Vercel domain tools (`names: ["chongmu-wiki.com"]`) |

---

## Lessons

- KakaoTalk export: **utf-8-sig**, BOM strip 필수
- PRD 메시지 수 ≠ raw line count — **dedup 후** 스냅샷 기준
- Supabase MCP: 스키마 반복 시 `execute_sql`로 개발 → 완료 후 `db pull` migration (skill 권장)
- Vercel ISR: App Router `export const revalidate` + on-demand `revalidatePath`
- 서브에이전트 API 한도 시 Planner가 로컬 스캔으로 대체 가능

---

## Appendix: 권장 디렉터리 구조 (Executor 참고)

```
chongmu-wiki/
├── .cursor/scratchpad.md
├── data/
│   └── KakaoTalkChats.txt          # 원본 (gitignore 권장)
├── scripts/
│   ├── process.py
│   └── tests/
├── analytics/
│   └── season-1/analytics.json     # gitignore or release artifact
├── supabase/migrations/
├── src/                            # Next.js (P1-21 이후)
├── 총무위키_PRD_v2.0.md
└── README.md
```

---

*Planner 완료 — Executor 시작 전 Robin 검토 요청*
