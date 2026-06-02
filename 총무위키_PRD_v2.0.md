# 총무 실무 위키 — PRD v2.0

| 항목 | 내용 |
|---|---|
| **버전** | v2.0 |
| **작성일** | 2026-06-01 |
| **작성자** | Robin (로빈) |
| **상태** | `DRAFT` |
| **도메인** | `chongmu-wiki.com` |
| **배포** | Vercel (icn1 리전) |
| **백엔드** | Supabase Free Tier |
| **운영자** | 1인 (Robin) |

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [시즌 구조](#2-시즌-구조)
3. [파싱 엔진 설계](#3-파싱-엔진-설계) ← **핵심**
4. [기술 스택](#4-기술-스택)
5. [시스템 아키텍처](#5-시스템-아키텍처)
6. [데이터 모델](#6-데이터-모델)
7. [IA · 페이지 구조](#7-ia--페이지-구조)
8. [기능 요구사항](#8-기능-요구사항)
9. [데이터 → UI 매핑](#9-데이터--ui-매핑)
10. [UI/UX 요구사항](#10-uiux-요구사항)
11. [비기능 요구사항](#11-비기능-요구사항)
12. [개발 로드맵](#12-개발-로드맵)
13. [확정 사항](#13-확정-사항)

---

## 1. 제품 개요

### One-liner

> KakaoTalk 오픈채팅 163K 메시지의 **모든 파싱 가능한 데이터를 최대로 추출**하고,  
> 총무·경영지원 실무자를 위한 데이터 기반 지식 위키로 시각화한다.

### 핵심 차별점

현재 레퍼런스 사이트는 메시지를 단순 키워드 빈도로만 활용한다.  
이 PRD는 **6개 레이어 파싱 엔진**으로 같은 데이터에서 10배 이상의 인사이트를 추출한다.

| 구분 | 현재 (v1) | 목표 (v2) |
|---|---|---|
| 분석 지표 수 | 8개 (토픽 빈도만) | **50개+** |
| 멤버 프로파일 | 메시지 수만 | 업종·활동패턴·질문성향 |
| 시간 분석 | 없음 | 시간대·요일·트렌드 |
| 업체 분석 | 없음 | 50개 업체 언급 추이 |
| 토픽 트렌드 | 없음 | 월별 토픽 변화 시각화 |
| 질문 분석 | 없음 | 14,925개 질문 → FAQ 자동 생성 |
| 자동 인사이트 | 없음 | 명언 후보·시즌 요약 자동 추출 |

### 시즌 1 확인된 파싱 가능 수치

| 지표 | 값 |
|---|---|
| 총 메시지 | **163,979개** |
| 참여 멤버 | **121명** |
| 피크 시간대 | **15시, 16시** (평일 업무 후반) |
| 피크 요일 | **수요일** (35,477건) |
| 주말 비율 | **0.8%** (직장인 커뮤니티 확인) |
| 질문 메시지 | **14,925개 (9.1%)** |
| 금액 언급 | **2,003건** (만원 848 / % 582 / 억 532) |
| 명언 후보 | **2,278건** (60자+ 의미 있는 메시지) |
| URL 공유 | forms.gle, naver.me, kakao, LinkedIn 순 |

---

## 2. 시즌 구조

### 구조 개요

```
시즌 1 ─────────────────────────────────────── 시즌 2 ──────────────→ 진행 중
2025-03-11                                2026-06-01 (사이트 오픈)
  [기존 채팅방 아카이브]                    [신규 채팅방, 6개월마다 업데이트]
  163,979 메시지 | 121명 | 15개월           새로운 멤버, 새로운 이슈
  상태: ARCHIVED (불변)                     상태: ACTIVE (누적)
```

### 시즌 1 — 아카이브

| 항목 | 값 |
|---|---|
| **기간** | 2025-03-11 ~ 2026-06-01 |
| **채팅방** | 실무왕 김총무 (기존 방) |
| **상태** | `ARCHIVED` — 데이터 추가·수정 없음 |
| **소스** | `KakaoTalkChats.txt` |
| **메시지** | 163,979개 |
| **멤버** | 121명 |

### 시즌 2 — 진행 중

| 항목 | 값 |
|---|---|
| **시작** | 2026-06-01 (사이트 오픈일) |
| **채팅방** | **신규 개설** (시즌 1과 다른 방) |
| **상태** | `ACTIVE` — 6개월마다 업데이트 |
| **업데이트 명령** | `python process.py new.txt --season 2 --upload` |

### 시즌 규칙

- **시즌 1 불변**: 읽기 전용 아카이브. 절대 덮어쓰지 않음
- **시즌 2+ 누적**: 6개월마다 신규 메시지 append, 중복 해시 자동 제거
- **위키 콘텐츠**: 시즌 무관 공통 적용 + 시즌 2 신규 인사이트에 배지 표기
- **비교 가능**: 활동 데이터 페이지에서 시즌 간 나란히 비교

---

## 3. 파싱 엔진 설계

> 이 섹션이 본 PRD의 핵심이다.  
> `process.py v2`는 외부 라이브러리 없이 Python stdlib만으로 6개 레이어를 순차 처리한다.

### 3-1. 파싱 엔진 아키텍처

```
KakaoTalk .txt
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 1: 기본 파싱                                      │
│  날짜·시간·발신자·본문 추출 / 이모티콘·사진 필터 / 중복 제거  │
└────────────────────────┬────────────────────────────────┘
                         │ messages.jsonl (누적)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: 시간 분석                                      │
│  시간대별(24h) · 요일별(7d) · 월별 트렌드                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: 멤버 프로파일링                                 │
│  닉네임 파싱(이름/직무/업종) · 활동 통계 · 질문성향 분류     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4: 콘텐츠 사전 매핑                               │
│  토픽(30개) · 업체(50개+) · 법규 · 금액 · URL            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 5: 행동 패턴 분석                                  │
│  질문 탐지 · 스레드 감지 · 커뮤니티 건강도                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 6: 자동 인사이트 생성                              │
│  명언 후보 스코어링 · FAQ 추출 · 시즌 요약 · 트렌드 진단     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                  analytics.json v2
                         │
                         ▼
              Supabase (--upload 시)
```

---

### 3-2. Layer 1 — 기본 파싱

```python
# 파싱 대상
MSG_PATTERN = r'^(\d{4}년\s*\d+월\s*\d+일\s*(?:오전|오후)\s*\d+:\d+),\s*([^:]+?)\s*:\s*(.+)$'

# 필터 제거 대상
SKIP = {'이모티콘', '<사진 읽지 않음>', '동영상', '파일', '연락처', '음성메시지'}
SYSTEM = ['들어왔습니다', '나갔습니다', '초대했습니다', '오픈채팅봇']

# 중복 제거: MD5(datetime + sender + text[:120])
```

**출력**: `messages.jsonl` — `{dt, sender, text, hash}`

---

### 3-3. Layer 2 — 시간 분석

**시즌 1 실측 데이터 기반 설계**

```python
# 추출 항목
time_analysis = {
    "hourly_stats":   # 0~23시별 메시지 수
    "weekday_stats":  # 월~일별 메시지 수 (Mon~Sun)
    "monthly_stats":  # YYYY-MM별 (기존 유지)
    "peak_hour":      # 최다 활성 시간 (실측: 15시)
    "peak_weekday":   # 최다 활성 요일 (실측: 수요일)
    "weekend_ratio":  # 주말 메시지 비율 (실측: 0.8%)
    "business_hours_ratio":  # 09~18시 비율
}
```

**위키 활용**: `/activity` 히트맵 차트, "이 커뮤니티는 수요일 오후에 가장 활발합니다" 자동 문구 생성

---

### 3-4. Layer 3 — 멤버 프로파일링

#### 닉네임 파서

카카오 오픈채팅 닉네임 규칙 `[이름/직무/업종]` 을 분해한다.

```python
def parse_nickname(sender: str) -> dict:
    parts = [p.strip() for p in sender.split('/')]
    return {
        "display_name": parts[0] if parts else sender,
        "role":         parts[1] if len(parts) > 1 else None,  # '총무', '인사총무', 'GA'
        "industry":     parts[2] if len(parts) > 2 else None,  # '제조업', 'IT', '의료기관'
        "industry_group": classify_industry(parts[2]) if len(parts) > 2 else "기타"
    }

# 업종 그룹 사전 (실측 데이터 기반)
INDUSTRY_MAP = {
    "제조": "제조업",     "제조업": "제조업",
    "IT": "IT·SW",       "SW": "IT·SW",        "it": "IT·SW",
    "바이오": "바이오",   "의료기관": "의료·바이오",  "의료기기": "의료·바이오",
    "연구": "연구·교육",  "교육": "연구·교육",
    "e커머스": "유통·커머스", "유통": "유통·커머스", "쇼핑몰": "유통·커머스",
    "프랜차이즈": "프랜차이즈·서비스",  "서비스": "프랜차이즈·서비스",
    "금융": "금융·핀테크",  "핀테크": "금융·핀테크",
    "GA": "IT·SW",
}
```

#### 멤버 개별 통계

```python
member_profile = {
    "name":                str,    # 원본 닉네임
    "display_name":        str,    # 첫 번째 파트
    "role":                str,    # 직무
    "industry":            str,    # 업종 원문
    "industry_group":      str,    # 그룹 분류
    "message_count":       int,    # 총 메시지 수
    "avg_msg_length":      float,  # 평균 글자 수
    "question_ratio":      float,  # 질문 메시지 비율 (물음표 포함)
    "long_msg_count":      int,    # 60자 이상 메시지 수 (정보 제공 성향)
    "peak_hour":           int,    # 가장 많이 활동한 시간
    "active_days":         int,    # 활동한 날 수
    "first_seen":          str,    # 첫 메시지 날짜
    "last_seen":           str,    # 마지막 메시지 날짜
    "top_topics":          list,   # 가장 많이 언급한 토픽 TOP 3
}
```

#### 업종 분포 집계

```python
industry_distribution = {
    "제조업": 27011,         # 실측
    "바이오": 27173,         # 실측 (가장 많음)
    "의료·바이오": 22147,
    "IT·SW": 13644,
    "프랜차이즈·서비스": 16125,
    ...
}
```

---

### 3-5. Layer 4 — 콘텐츠 사전 매핑

#### 토픽 키워드 사전 (8 → 30개 카테고리로 확장)

```python
TOPICS = {
    # ERP·그룹웨어 (세분화)
    "ERP·그룹웨어":       ["더존","아이큐브","비즈박스","아마란스","그룹웨어","erp","하이웍스","다우오피스","비즈메카","한비로"],
    "ERP 종료·전환":      ["서비스 종료","기술지원 중단","종료 통보","갈아타","마이그레이션"],
    
    # AI·디지털 (세분화)
    "AI·LLM":             ["claude","클로드","chatgpt","챗gpt","gemini","제미나이","perplexity","ai ","인공지능"],
    "AI 도구·워크플로":   ["mcp","cursor","커서","copilot","코파일럿","프롬프트","자동화"],
    "협업·생산성":        ["노션","notion","슬랙","slack","구글워크스페이스","notion ai","notebooklm"],
    
    # 법인차량 (세분화)
    "법인차량·렌트":      ["법인차","렌트","렌탈","리스","카니발","그랜저","차량"],
    "차량 세무·보험":     ["운행일지","업무용승용차","손금","1500만원","임직원한정","차량보험"],
    
    # 시설·안전 (세분화)
    "소방·방재":          ["소방","스프링쿨러","화재","방재실","소화기","소방점검"],
    "안전보건":           ["안전보건","산안위","산업안전","안전관리자","중대재해"],
    "시설관리":           ["승강기","엘리베이터","시설","공조","냉난방","전기안전","임차"],
    
    # 법무 (세분화)
    "등기·법무":          ["등기","임원변경","주총","정관","법무사","중임","선임"],
    "계약·라이선스":      ["한글","라이선스","실사","한컴","계약서","소프트웨어","sw라이선스"],
    
    # HR·급여 (세분화)
    "연봉·급여":          ["연봉","급여","인상","인상률","연봉협상","연봉통지"],
    "이직·채용":          ["이직","면접","채용","공고","퇴사","입사","링크드인"],
    "4대보험·세무":       ["4대보험","국민연금","건강보험","고용보험","산재","연말정산","식대"],
    "복리후생":           ["복리후생","명절","경조사","웰컴키트","선물","상조"],
    
    # 예산·구매 (세분화)
    "예산절감":           ["절감","예산절감","비용절감","세이브","줄였"],
    "구매·MRO":           ["구매","mro","견적","발주","납품","구매처"],
    "보안업체":           ["에스원","adt","캡스","sk쉴더스","cctv","출입통제","보안"],
    "정수기·사무용품":    ["정수기","청호","코웨이","사무용품","오피스디포","사무비품"],
    
    # 오피스·공간
    "오피스이전":         ["이사","사무실이전","이전","사옥","이사비용","포장이사"],
    "임차·부동산":        ["임차","임대","임대차","전세","보증금","알스퀘어","월세"],
    
    # 커리어·커뮤니티
    "커리어·자격증":      ["자격증","노무사","산업안전기사","소방안전관리자","커리어","성장"],
    "총무KPI":            ["kpi","인사고과","성과","평가","목표","대체불가"],
    "커뮤니티·모임":      ["정모","모임","오프라인","소모임","총무모임"],
    
    # 사회·이슈
    "경제·물가":          ["물가","인플레","금리","주식","부동산","경기"],
    "정부지원":           ["정부지원","보조금","소비쿠폰","지원사업","민생"],
    "AI 업계 동향":       ["오픈ai","앤트로픽","구글ai","ai규제","ai 트렌드"],
}
```

#### 업체 사전 (50개+)

```python
VENDORS = {
    # 그룹웨어·ERP
    "더존":        "그룹웨어·ERP",
    "아이큐브":    "그룹웨어·ERP",
    "비즈박스":    "그룹웨어·ERP",
    "아마란스":    "그룹웨어·ERP",
    "하이웍스":    "그룹웨어·ERP",
    "다우오피스":  "그룹웨어·ERP",
    "비즈메카":    "그룹웨어·ERP",
    "한비로":      "그룹웨어·ERP",
    "플렉스":      "HR·인사",
    "원티드":      "HR·인사",

    # 보안
    "에스원":      "보안·CCTV",
    "ADT캡스":    "보안·CCTV",
    "캡스":        "보안·CCTV",
    "SK쉴더스":   "보안·CCTV",

    # 법인차량
    "롯데렌탈":    "법인차량",
    "SK렌터카":   "법인차량",
    "현대캐피탈":  "법인차량",
    "AJ렌터카":   "법인차량",
    "헤이딜러":    "법인차량",

    # AI·디지털
    "클로드":      "AI",
    "Claude":      "AI",
    "ChatGPT":    "AI",
    "Cursor":      "AI",
    "커서":        "AI",
    "노션":        "협업·생산성",
    "Notion":      "협업·생산성",
    "슬랙":        "협업·생산성",
    "Slack":       "협업·생산성",
    "구글": "협업·생산성",
    "옵시디언":    "협업·생산성",
    "Perplexity": "AI",

    # 방역·청소
    "세스코":      "방역·시설",
    "애경산업":    "방역·시설",

    # 정수기·생활
    "코웨이":      "정수기·사무비품",
    "청호":        "정수기·사무비품",

    # MRO·사무용품
    "오피스디포":  "MRO·사무용품",
    "업무마켓":    "MRO·사무용품",
    "쿠팡":        "MRO·사무용품",

    # 부동산·인테리어
    "알스퀘어":    "부동산·인테리어",

    # 인쇄·명함
    "더원":        "인쇄·명함",

    # 경조·상조
    "삼신":        "경조·상조",
    "효성":        "경조·상조",

    # 소프트웨어 라이선스
    "한글과컴퓨터": "SW라이선스",
    "마이크로소프트": "SW라이선스",
    "MKN컴퍼니":   "SW라이선스",
}
```

#### 법규 조항 사전

```python
LAWS = {
    "산업안전보건법":    "안전",
    "근로기준법":        "노무",
    "상법":              "법무",
    "개인정보보호법":    "IT",
    "화재예방법":        "소방",
    "전기안전관리법":    "시설",
    "승강기안전관리법":  "시설",
    "남녀고용평등법":    "HR",
    "장애인고용법":      "HR",
    "근퇴법":            "HR",
    "국민연금법":        "4대보험",
    "317조":             "등기",  # 상법 317조 (임원 변경등기)
    "2주":               "등기",  # 2주 내 등기 문맥
    "중대재해처벌법":    "안전",
    "중대재해":          "안전",
}
```

#### 금액 패턴 추출

```python
# 정규식 패턴
AMOUNT_PATTERNS = [
    r'(\d+(?:\.\d+)?)\s*억',      # N억
    r'(\d+)\s*만\s*원',           # N만원
    r'(\d+)\s*천\s*만',           # N천만
    r'(\d+)\s*%',                 # N%
    r'(\d+(?:,\d{3})*)\s*원',     # N,NNN원
]

# 절감 문맥 탐지
SAVING_KEYWORDS = ['절감', '세이브', '줄였', '낮췄', '저렴', '아꼈']
COST_KEYWORDS = ['비용', '금액', '월세', '렌트료', '구축비', '도입비']
```

---

### 3-6. Layer 5 — 행동 패턴 분석

#### 질문 탐지

```python
QUESTION_PATTERNS = [
    r'\?$',           # 물음표로 끝나는 메시지
    r'까요\??',       # ~까요
    r'할까요',        # ~할까요
    r'인가요',        # ~인가요
    r'어떻게',        # 어떻게
    r'혹시\s',        # 혹시 ~
    r'어디서',        # 어디서
    r'얼마',          # 얼마
    r'뭐가\s',        # 뭐가
    r'추천',          # 추천
    r'아시는\s분',    # 아시는 분
    r'방법이',        # 방법이
]

# 질문 카테고리 자동 분류
# → 질문 텍스트 + 토픽 사전 매핑으로 분류
# → TOP 질문 추출 = FAQ 자동 생성 원천 데이터
```

**출력 예시 (실측)**

```
Q. "그룹웨어 어떤 거 쓰시나요?" → 카테고리: ERP·그룹웨어 (유사 질문 8회)
Q. "법인차 렌트료 얼마 내세요?" → 카테고리: 법인차량 (유사 질문 6회)
Q. "소방안전관리자 자격 기준이 어떻게 되나요?" → 카테고리: 소방·방재
```

#### 커뮤니티 건강도

```python
community_health = {
    "monthly_joins":    # 월별 신규 입장 (시스템 메시지 파싱)
    "monthly_leaves":   # 월별 퇴장
    "net_growth":       # 월별 순증가
    "peak_month":       # 최고 활성 월
    "declining_since":  # 활동 감소 시작 월 (자동 탐지)
    "avg_active_days":  # 멤버 평균 활동 일수
    "core_member_ratio": # 전체 기간 50% 이상 참여 멤버 비율
}
```

---

### 3-7. Layer 6 — 자동 인사이트 생성

#### 명언 후보 스코어링

```python
def score_quote(text: str, sender: str) -> float:
    score = 0.0
    # 길이 가중치 (60~200자 최적)
    if 60 <= len(text) <= 200: score += 0.3
    # 통찰 키워드
    insight_kws = ['답이다', '중요', '핵심', '절대', '반드시', '기억', '경험상', '진짜로']
    for kw in insight_kws:
        if kw in text: score += 0.15
    # 슬랭 패널티 (ㅋㅋ, ㅠㅠ 과다 → 일반 대화)
    score -= text.count('ㅋ') * 0.05
    score -= text.count('ㅠ') * 0.03
    # URL 패널티 (링크 공유는 인용구 아님)
    if 'http' in text: score -= 0.5
    return max(0, min(1, score))

# 상위 50개를 quotes 테이블 후보로 추출
```

#### FAQ 자동 생성

```python
# 유사 질문 그룹화 (키워드 기반 클러스터링)
# 같은 토픽의 질문을 묶어서 "자주 묻는 질문" 생성
faqs_by_topic = {
    "ERP·그룹웨어": [
        {"q": "그룹웨어 추천 부탁드립니다", "frequency": 8, "best_answer": "..."},
    ],
    ...
}
```

#### 트렌드 진단

```python
def diagnose_trend(topic: str, monthly_data: dict) -> str:
    values = list(monthly_data.values())[-6:]  # 최근 6개월
    avg_first_half = sum(values[:3]) / 3
    avg_second_half = sum(values[3:]) / 3
    ratio = avg_second_half / avg_first_half if avg_first_half else 1
    if ratio > 1.3: return "급상승"    # AI 토픽 2025-04 이후
    if ratio > 1.1: return "상승"
    if ratio < 0.7: return "하락"
    return "보합"
```

---

### 3-8. analytics.json v2 전체 스펙

```json
{
  "version": "2.0",
  "season": 1,

  "meta": {
    "first_date": "2025-03-11",
    "last_date": "2026-05-26",
    "total_messages": 163979,
    "member_count": 121,
    "active_months": 15,
    "last_updated": "2026-06-01 09:00"
  },

  "time_analysis": {
    "hourly_stats": {"0": 12, "1": 8, "9": 18713, "15": 21945, ...},
    "weekday_stats": {"Mon": 30298, "Tue": 32513, "Wed": 35477, ...},
    "monthly_stats": {"2025-03": 6269, "2025-04": 12595, ...},
    "peak_hour": 15,
    "peak_weekday": "Wed",
    "weekend_ratio": 0.008,
    "business_hours_ratio": 0.72
  },

  "member_profiles": [
    {
      "name": "만(나성)피로/총무/바이오",
      "display_name": "만(나성)피로",
      "role": "총무",
      "industry": "바이오",
      "industry_group": "바이오",
      "message_count": 27093,
      "avg_msg_length": 12.4,
      "question_ratio": 0.07,
      "long_msg_count": 234,
      "peak_hour": 10,
      "active_days": 298,
      "first_seen": "2025-03-11",
      "last_seen": "2026-05-26",
      "top_topics": ["이직·연봉", "AI·LLM", "커뮤니티·모임"]
    }
  ],

  "industry_distribution": {
    "바이오": 27173,
    "제조업": 46084,
    "의료기관": 22147,
    "IT·SW": 13644,
    "프랜차이즈·서비스": 16125
  },

  "top_members": [["만(나성)피로/총무/바이오", 27093], ...],

  "topic_counts": {
    "ERP·그룹웨어": 190,
    "ERP 종료·전환": 145,
    "AI·LLM": 567,
    "AI 도구·워크플로": 312,
    "협업·생산성": 234,
    "법인차량·렌트": 298,
    "차량 세무·보험": 89,
    "소방·방재": 145,
    "안전보건": 98,
    "시설관리": 234,
    "등기·법무": 167,
    "계약·라이선스": 140,
    "연봉·급여": 876,
    "이직·채용": 634,
    "4대보험·세무": 123,
    "복리후생": 89,
    "예산절감": 366,
    "구매·MRO": 234,
    "보안업체": 156,
    "오피스이전": 345,
    "임차·부동산": 189,
    "커리어·자격증": 145,
    "총무KPI": 98,
    "커뮤니티·모임": 234
  },

  "topic_trends": {
    "AI·LLM": {
      "2025-03": 11, "2025-04": 54, "2025-05": 72,
      "2025-06": 83, "2025-07": 46, "2025-08": 27,
      "2025-09": 29, "2025-10": 48, "2025-11": 27,
      "2025-12": 49, "2026-01": 29, "2026-02": 11,
      "2026-03": 28, "2026-04": 31, "2026-05": 22
    },
    "ERP·그룹웨어": {"2025-03": 89, "2025-04": 34, ...},
    "이직·채용": {"2025-03": 45, ...}
  },

  "vendor_mentions": {
    "커서":      {"count": 146, "category": "AI"},
    "클로드":    {"count": 104, "category": "AI"},
    "더존":      {"count": 60,  "category": "그룹웨어·ERP"},
    "슬랙":      {"count": 59,  "category": "협업·생산성"},
    "노션":      {"count": 50,  "category": "협업·생산성"},
    "캡스":      {"count": 39,  "category": "보안·CCTV"},
    "아마란스":  {"count": 32,  "category": "그룹웨어·ERP"},
    "에스원":    {"count": 24,  "category": "보안·CCTV"},
    "세스코":    {"count": 23,  "category": "방역·시설"},
    "비즈박스":  {"count": 23,  "category": "그룹웨어·ERP"}
  },

  "law_mentions": {
    "산업안전보건법": 45,
    "상법": 23,
    "개인정보보호법": 18,
    "화재예방법": 12,
    "317조": 15
  },

  "amount_analysis": {
    "total_cases": 2003,
    "by_unit": {"만원": 848, "%": 582, "억": 532, "천만원": 36, "백만원": 5},
    "saving_contexts": 134,
    "top_amounts": [
      {"amount": "4.5억", "unit": "억", "context": "절감", "date": "2025-03-11"},
      {"amount": "2억",   "unit": "억", "context": "절감", "date": "2025-03-11"}
    ]
  },

  "url_analysis": {
    "total_urls": 89,
    "top_domains": [
      {"domain": "forms.gle", "count": 28},
      {"domain": "naver.me",  "count": 18},
      {"domain": "event-us.kr", "count": 12}
    ]
  },

  "questions": {
    "total": 14925,
    "ratio": 0.091,
    "by_topic": {
      "ERP·그룹웨어": 1234,
      "법인차량·렌트": 987,
      "연봉·급여": 876
    },
    "top_faqs": [
      {"question": "그룹웨어 어떤 거 쓰시나요?", "count": 8, "topic": "ERP·그룹웨어"},
      {"question": "법인차 렌트료 얼마 내세요?", "count": 6, "topic": "법인차량·렌트"},
      {"question": "소방안전관리자 선임 기준이 어떻게 되나요?", "count": 5, "topic": "소방·방재"}
    ]
  },

  "community_health": {
    "monthly_joins":  {"2025-03": 45, "2025-04": 23, ...},
    "monthly_leaves": {"2025-03": 2,  "2025-04": 5,  ...},
    "peak_month": "2025-06",
    "declining_since": "2025-07",
    "core_member_ratio": 0.31
  },

  "auto_insights": {
    "top_quotes": [
      {
        "text": "이직이 답이다!!!!",
        "speaker": "끄덕/총무/제조",
        "date": "2025-03-24",
        "score": 0.91,
        "topic": "이직·채용"
      }
    ],
    "topic_trends_summary": [
      {"topic": "AI·LLM", "trend": "상승", "peak": "2025-06"},
      {"topic": "ERP·그룹웨어", "trend": "하락", "peak": "2025-03"}
    ],
    "season_headline": "ERP 종료 위기로 시작해 AI 도구 확산으로 마무리된 15개월",
    "hot_vendor_this_season": "커서 (AI 카테고리, 146회 언급)"
  },

  "recent_batch": {
    "months": ["2026-01","2026-02","2026-03","2026-04","2026-05"],
    "new_messages": 21100,
    "hot_topics": [["이직·채용", 234], ["총무KPI", 89], ["AI·LLM", 170]],
    "new_members": []
  }
}
```

---

## 4. 기술 스택

### 프론트엔드

| 기술 | 버전 | 용도 |
|---|---|---|
| **Next.js** | 15 (App Router) | 메인 프레임워크 |
| **TypeScript** | 5 | 타입 안전성 |
| **Tailwind CSS** | 4 | 스타일링 |
| **shadcn/ui** | latest | UI 컴포넌트 |
| **Recharts** | latest | 차트 (월별·토픽·히트맵) |
| **Lucide React** | latest | 아이콘 |

### 백엔드 & 데이터

| 기술 | 용도 |
|---|---|
| **Supabase** PostgreSQL | 분석 스냅샷 · 위키 콘텐츠 (Free: 500MB ← 충분) |
| **Supabase Auth** | 관리자 1인 이메일 로그인 |
| **Supabase Storage** | messages.jsonl 원본 보관 (Free: 1GB, 실제 약 26MB) |
| **Next.js API Routes** | analytics.json 업로드 · ISR Revalidation |

### 파이프라인

| 기술 | 용도 |
|---|---|
| **Python 3.10+** | process.py v2 (stdlib만, 의존성 없음) |
| **re / json / hashlib / datetime** | 파싱 6개 레이어 전체 |

### 인프라

| 기술 | 용도 |
|---|---|
| **Vercel** | 배포 (icn1, chongmu-wiki.com) |
| **GitHub** | 소스 관리 + Vercel 자동 배포 |

### Supabase Free Tier 용량 예측

```
analytics_snapshots:   ~100KB × 20 snapshots = 2MB
wiki_sections:         9 rows × 0.2KB = 2KB
wiki_content_blocks:   200 rows × 1KB = 200KB
quotes:                100 rows × 0.2KB = 20KB
Storage (messages):    26MB (jsonl 파일)

총 예상: ~30MB / 500MB 한도 → 여유 충분
```

---

## 5. 시스템 아키텍처

### 전체 흐름

```
KakaoTalk 내보내기 (.txt)
         │
         ▼  python process.py new.txt --season N --upload
┌────────────────────────────────────┐
│  process.py v2                     │
│  Layer 1~6 순차 실행               │
│  → messages.jsonl (로컬 누적)      │
│  → analytics.json v2 생성          │
└─────────────────┬──────────────────┘
                  │  SUPABASE_SERVICE_KEY
                  ▼
┌────────────────────────────────────┐
│          Supabase                  │
│  analytics_snapshots (upsert)      │
│  Storage: messages.jsonl 업로드    │
└─────────────────┬──────────────────┘
                  │  Vercel Revalidation API
                  ▼
┌────────────────────────────────────┐
│          Vercel (icn1)             │
│  /dashboard, /activity 캐시 갱신   │
│  → 사용자에게 즉시 반영            │
└────────────────────────────────────┘
```

### 렌더링 전략

| 페이지 | 전략 | revalidate | 근거 |
|---|---|---|---|
| `/dashboard` | ISR | 3,600s (1h) | 시즌 배지·핫토픽 최신성 |
| `/activity` | ISR | 3,600s (1h) | 차트 데이터 |
| `/[slug]` 위키 9개 | ISR | 86,400s (24h) | 콘텐츠 변경 빈도 낮음 |
| `/admin/**` | CSR | — | Auth 필수 |

### 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx                     # RootLayout
│   ├── page.tsx                       # redirect → /dashboard
│   ├── (wiki)/
│   │   ├── dashboard/page.tsx         # 홈 대시보드
│   │   ├── activity/page.tsx          # 활동 데이터 (시즌 탭)
│   │   └── [slug]/page.tsx            # 위키 9개 섹션
│   ├── admin/
│   │   ├── layout.tsx                 # Auth Guard
│   │   ├── page.tsx                   # 관리자 대시보드
│   │   └── upload/page.tsx            # analytics.json 업로드
│   └── api/
│       ├── admin/upload/route.ts      # POST → Supabase upsert
│       └── revalidate/route.ts        # ISR 캐시 갱신
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── SeasonBadge.tsx
│   ├── wiki/
│   │   ├── ContentBlock.tsx           # 블록 타입 라우터
│   │   ├── TableBlock.tsx
│   │   ├── InfoBox.tsx
│   │   ├── QuoteBlock.tsx
│   │   └── ChecklistBlock.tsx
│   └── charts/
│       ├── MonthlyChart.tsx           # Recharts BarChart
│       ├── TopicChart.tsx             # Recharts Horizontal Bar
│       ├── HourlyHeatmap.tsx          # 시간대·요일 히트맵 (신규)
│       ├── TopicTrendChart.tsx        # 월별 토픽 트렌드 (신규)
│       └── VendorRankChart.tsx        # 업체 언급 순위 (신규)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts                   # supabase gen types
│   └── analytics.ts                   # getLatestAnalytics(season?)
└── types/
    └── wiki.ts
```

---

## 6. 데이터 모델

### 테이블 4개 (Supabase Free Tier 최적화)

```
analytics_snapshots   시즌별 분석 스냅샷 (analytics.json v2 전체 저장)
wiki_sections         위키 섹션 메타 (9행)
wiki_content_blocks   콘텐츠 블록 (표·정보박스·인용구·체크리스트)
quotes                커뮤니티 명언 (process.py Layer 6 추출 후보)
```

---

### ① analytics_snapshots

```sql
CREATE TABLE analytics_snapshots (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 시즌 정보
  season           integer     NOT NULL DEFAULT 1,
  season_label     text,                              -- "시즌 1 (2025.03~2026.06)"
  season_start     date,
  season_end       date,                              -- NULL = 진행 중

  -- 배치 정보
  snapshot_date    date        NOT NULL,              -- process.py 실행일
  first_date       date,
  last_date        date,

  -- Layer 1 기본 수치
  total_messages   integer,
  member_count     integer,
  active_months    integer,

  -- Layer 2 시간 분석
  time_analysis    jsonb,                             -- hourly/weekday/peak

  -- Layer 1 월별 (기존 유지)
  monthly_stats    jsonb,                             -- {"2025-03": 6269}

  -- Layer 3 멤버
  top_members      jsonb,                             -- [[이름, count], ...]
  member_profiles  jsonb,                             -- 전체 멤버 프로파일 배열
  industry_dist    jsonb,                             -- 업종 분포

  -- Layer 4 콘텐츠
  topic_counts     jsonb,                             -- 30개 토픽 카운트
  topic_trends     jsonb,                             -- {토픽: {월: count}}
  vendor_mentions  jsonb,                             -- 업체별 언급 수
  law_mentions     jsonb,                             -- 법규 조항 언급
  amount_analysis  jsonb,                             -- 금액 패턴 분석
  url_analysis     jsonb,                             -- URL 도메인 집계

  -- Layer 5 행동 패턴
  questions        jsonb,                             -- 질문 통계 + FAQ
  community_health jsonb,                             -- 가입/탈퇴/건강도

  -- Layer 6 인사이트
  auto_insights    jsonb,                             -- 명언·트렌드·시즌 요약

  -- 최근 배치
  recent_batch     jsonb,

  -- 메타
  is_active        boolean     DEFAULT true,          -- 해당 시즌 최신 스냅샷
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_snapshots_season_active
  ON analytics_snapshots(season, is_active)
  WHERE is_active = true;
```

---

### ② wiki_sections

```sql
CREATE TABLE wiki_sections (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text    UNIQUE NOT NULL,
  title         text    NOT NULL,
  icon          text,
  nav_group     text,               -- 'knowledge' | 'digital' | 'community'
  nav_order     integer,
  description   text,
  is_published  boolean DEFAULT true,
  updated_at    timestamptz DEFAULT now()
);

-- 초기 데이터 9행
INSERT INTO wiki_sections (slug, title, icon, nav_group, nav_order) VALUES
  ('vendors',     '업체 비교',              '🏢', 'knowledge', 1),
  ('negotiation', '협상 · 예산절감',        '🤝', 'knowledge', 2),
  ('fleet',       '법인차량 관리',           '🚗', 'knowledge', 3),
  ('facility',    '시설 · 안전 · 소방',     '🔥', 'knowledge', 4),
  ('legal',       '법무 · 등기 · 라이선스', '⚖️', 'knowledge', 5),
  ('hr',          '급여 · 복리후생',        '💰', 'knowledge', 6),
  ('checklist',   '체크리스트 · 캘린더',    '✅', 'knowledge', 7),
  ('ai',          'AI 도구 활용',           '🤖', 'digital',   1),
  ('community',   '커뮤니티 이야기',        '👥', 'community', 1);
```

---

### ③ wiki_content_blocks

```sql
CREATE TABLE wiki_content_blocks (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid    REFERENCES wiki_sections(id) ON DELETE CASCADE,
  block_type     text    NOT NULL,
  -- 'table' | 'info_box' | 'quote' | 'warning' | 'checklist'
  block_order    integer,
  title          text,
  content        jsonb   NOT NULL,
  accent_color   text,               -- 'blue'|'green'|'amber'|'red'|'purple'
  is_verified    boolean DEFAULT false,
  verified_year  integer,
  season_added   integer DEFAULT 1,  -- 이 블록이 추가된 시즌
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_blocks_section_order
  ON wiki_content_blocks(section_id, block_order);
```

**content JSONB 구조**

| block_type | content 구조 |
|---|---|
| `table` | `{"headers": [...], "rows": [[...], ...]}` |
| `info_box` | `{"items": ["항목1", "항목2"]}` |
| `quote` | `{"text": "...", "speaker": "태현/총무/제조업"}` |
| `warning` | `{"items": ["주의사항1"]}` |
| `checklist` | `{"groups": [{"title": "법적·행정", "items": [...]}]}` |

---

### ④ quotes

```sql
CREATE TABLE quotes (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid    REFERENCES wiki_sections(id),
  content     text    NOT NULL,
  speaker     text,
  season      integer DEFAULT 1,
  score       float,              -- Layer 6 스코어링 결과
  created_at  timestamptz DEFAULT now()
);
```

---

### RLS 정책

```sql
-- 모든 테이블: 공개 읽기 (anon 포함)
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read"  ON analytics_snapshots FOR SELECT USING (true);
CREATE POLICY "admin write"  ON analytics_snapshots
  FOR ALL USING (auth.role() = 'authenticated');

-- (wiki_sections, wiki_content_blocks, quotes 동일 패턴 적용)
```

---

## 7. IA · 페이지 구조

### 라우트 맵

```
/                           redirect → /dashboard
├── (wiki)/
│   ├── /dashboard          홈 + 핵심 요약 + 시즌 개요        ISR 1h
│   ├── /activity           활동 데이터 (시즌 탭, 5종 차트)    ISR 1h
│   ├── /vendors            업체 비교                          ISR 24h
│   ├── /negotiation        협상 · 예산절감                     ISR 24h
│   ├── /fleet              법인차량 관리                       ISR 24h
│   ├── /facility           시설 · 안전 · 소방                  ISR 24h
│   ├── /legal              법무 · 등기 · 라이선스              ISR 24h
│   ├── /hr                 급여 · 복리후생                     ISR 24h
│   ├── /checklist          체크리스트 · 캘린더                 ISR 24h
│   ├── /ai                 AI 도구 활용                        ISR 24h
│   └── /community          커뮤니티 이야기                     ISR 24h
└── /admin/
    ├── /admin              관리자 대시보드                     CSR
    └── /admin/upload       analytics.json 업로드              CSR
```

### 사이드바 그룹

```
[대시보드]
  🏠 홈 · 대시보드
  📊 활동 데이터     ← 시즌 탭 전환

[실무 지식]
  🏢 업체 비교
  🤝 협상 · 예산절감
  🚗 법인차량 관리
  🔥 시설 · 안전 · 소방
  ⚖️ 법무 · 등기 · 라이선스
  💰 급여 · 복리후생
  ✅ 체크리스트 · 캘린더

[디지털]
  🤖 AI 도구 활용

[커뮤니티]
  👥 커뮤니티 이야기
```

---

## 8. 기능 요구사항

### 우선순위

- `P1` MVP 필수
- `P2` Phase 2
- `P3` 미래

---

### `/dashboard` `P1`

- 현재 활성 시즌 배지 + 시즌 요약 문구 (`auto_insights.season_headline`)
- 수치 카드 4개 (총 메시지, 멤버, 활성 기간, 최고 활성월) — 카운트업 애니메이션
- 핫토픽 배지 (`recent_batch.hot_topics`)
- 최고 인용구 1개 (`auto_insights.top_quotes[0]`)
- 바로가기 그리드 9개

---

### `/activity` `P1`

**시즌 탭** — `[시즌 1 아카이브] [시즌 2 진행 중]`  
탭 전환 시 아래 모든 차트 데이터 교체

**차트 5종 (파싱 데이터 최대 활용)**

| # | 차트명 | 데이터 소스 | 컴포넌트 |
|---|---|---|---|
| 1 | 월별 메시지 수 | `monthly_stats` | `MonthlyChart` |
| 2 | 요일·시간대 히트맵 | `time_analysis.hourly/weekday` | `HourlyHeatmap` |
| 3 | 토픽 월별 트렌드 | `topic_trends` | `TopicTrendChart` |
| 4 | 업체 언급 순위 | `vendor_mentions` | `VendorRankChart` |
| 5 | 토픽 빈도 (30개) | `topic_counts` | `TopicChart` |

**추가 섹션**

- 멤버 순위 테이블 (상위 15명, 업종·메시지 수·인라인 바)
- 업종 분포 파이/바 차트 (`industry_distribution`)
- 커뮤니티 건강도 지표 (`community_health`)
- FAQ TOP 10 (`questions.top_faqs`) ← 자동 생성

---

### `/[slug]` 위키 섹션 9개 `P1`

- `wiki_content_blocks` → `ContentBlock` 컴포넌트 렌더링
- 법규 검증 배지 (`is_verified = true` → "YYYY 검증")
- 시즌 2 신규 배지 (`season_added = 2`)
- 업체 언급 횟수 자동 주입 (`vendor_mentions`에서 pull)
- 섹션 하단 인용구 (`quotes` 테이블)

**업체 비교 (`/vendors`) 특수 처리**

```
업체명 옆에 언급 횟수 자동 표시
예: 커서 (AI) ← 146회 언급  [시즌 1 기준]
```

---

### 관리자 `/admin/upload` `P1`

- Supabase Auth 이메일 로그인 (운영자 1인)
- `analytics.json` 드래그앤드롭 업로드
- 업로드 플로우:
  1. JSON 스키마 유효성 검사 (`version`, `season`, `meta` 필드 확인)
  2. 해당 시즌 기존 `is_active = true` → `false`
  3. 신규 row INSERT `is_active = true`
  4. Vercel Revalidation API 호출 → `/dashboard`, `/activity` 캐시 갱신
- 업로드 이력 테이블 (시즌·날짜·메시지 수)

---

### 데이터 파이프라인 — process.py v2 `P1`

```bash
# 시즌 1 (최초 1회)
python process.py KakaoTalkChats.txt --season 1 --upload

# 시즌 2 (6개월마다)
python process.py KakaoTalkChats_S2_2026H2.txt --season 2 --upload

# 옵션
--dry          파싱 결과 확인만 (저장 안 함)
--analyze-only 저장된 데이터로 재분석
--generate     analytics.json만 재생성
--upload       Supabase 자동 업로드 + Vercel 캐시 갱신

# 환경 변수 (.env)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
VERCEL_REVALIDATE_TOKEN=...
VERCEL_PROJECT_URL=https://chongmu-wiki.com
```

---

## 9. 데이터 → UI 매핑

> 파싱한 모든 데이터가 어느 페이지/컴포넌트에서 쓰이는지 명세

| analytics.json 필드 | 활용 위치 | 컴포넌트 |
|---|---|---|
| `meta.total_messages` | 대시보드 수치 카드 | `StatCard` |
| `meta.member_count` | 대시보드 수치 카드 | `StatCard` |
| `auto_insights.season_headline` | 대시보드 히어로 | `HeroSection` |
| `auto_insights.top_quotes[0]` | 대시보드 하단 | `QuoteHighlight` |
| `recent_batch.hot_topics` | 대시보드 배지 | `HotTopicBadge` |
| `monthly_stats` | 활동 데이터 차트 1 | `MonthlyChart` |
| `time_analysis.hourly/weekday` | 활동 데이터 차트 2 | `HourlyHeatmap` |
| `topic_trends` | 활동 데이터 차트 3 | `TopicTrendChart` |
| `vendor_mentions` | 활동 데이터 차트 4 | `VendorRankChart` |
| `topic_counts` | 활동 데이터 차트 5 | `TopicChart` |
| `top_members` | 활동 데이터 멤버 테이블 | `MemberTable` |
| `industry_distribution` | 활동 데이터 업종 차트 | `IndustryChart` |
| `community_health` | 활동 데이터 건강도 | `HealthMetrics` |
| `questions.top_faqs` | 활동 데이터 FAQ | `FaqList` |
| `vendor_mentions[업체명].count` | 업체 비교 테이블 자동 주입 | `VendorTable` |
| `topic_trends[토픽].trend` | 위키 섹션 헤더 트렌드 화살표 | `TrendBadge` |
| `law_mentions` | 법무·시설 섹션 법규 언급 횟수 | `LawMentionBadge` |
| `amount_analysis.top_amounts` | 협상·예산절감 섹션 | `AmountHighlight` |
| `auto_insights.top_quotes` | quotes 테이블 시딩 후보 | (관리자 승인) |

---

## 10. UI/UX 요구사항

### 레이아웃 (레퍼런스 동일 유지)

| 요소 | 스펙 |
|---|---|
| **사이드바** | 260px fixed, bg `#161b27`, border `#2a3347` |
| **탑바** | sticky, 브레드크럼 + 우측 stats pill |
| **콘텐츠** | max-width 980px, padding 40px, bg `#0e1117` |
| **서피스** | surface `#161b27` / surface2 `#1e2535` |
| **액센트** | blue `#3b82f6` / cyan `#06b6d4` / amber `#f59e0b` |
| **폰트** | Noto Sans KR + JetBrains Mono |

### 시즌 UI 컴포넌트

```
탑바 우측:
[시즌 1 아카이브]  [● 시즌 2 진행 중]   ← 현재 시즌 강조

/activity 탭:
┌──────────────┬──────────────┐
│ 시즌 1       │ 시즌 2       │
│ 2025.03~06.01│ 2026.06~     │
└──────────────┴──────────────┘

위키 신규 블록:
┌─────────────────────────────┐
│ [시즌 2 신규] 블록 타이틀    │
└─────────────────────────────┘
```

### 히트맵 차트 설계

```
요일·시간대 히트맵 (실측 데이터 기반)

      월    화    수    목    금    토    일
09시  ███   ████  █████ ████  ███   ░     ░
10시  ████  ████  █████ ████  ████  ░     ░
15시  ████  ████  ██████████  ████  ░     ░   ← 피크
16시  ████  ████  █████ ████  ████  ░     ░

색상: 낮은 값 #1e2535 → 높은 값 #3b82f6
```

### 반응형

| 브레이크포인트 | 대응 |
|---|---|
| ≥1024px | 사이드바 fixed (레퍼런스 동일) |
| 768~1023px | 사이드바 토글 (hamburger) |
| <768px | 사이드바 drawer, 카드 1열, 차트 축소 |

---

## 11. 비기능 요구사항

### 성능

| 지표 | 목표 |
|---|---|
| LCP | < 2.5초 |
| FID | < 100ms |
| CLS | < 0.1 |
| Lighthouse Performance | ≥ 90 |
| Lighthouse SEO | ≥ 95 |

### SEO

- 페이지별 고유 `<title>`, `description`, `og:image`
- `sitemap.xml` 자동 생성 (`app/sitemap.ts`)
- `robots.txt` (`app/robots.ts`)
- JSON-LD `WebPage` 스키마 (위키 섹션)
- Canonical URL

### 보안

- Supabase RLS: anon key 읽기 전용
- **Service Role Key: 서버 사이드 전용** (클라이언트 노출 금지)
- `/admin/**` Auth 미들웨어 보호
- 환경 변수: Vercel Environment Variables로만 관리

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY       ← 서버 전용
REVALIDATE_SECRET
```

---

## 12. 개발 로드맵

### Phase 1 — MVP (2~3주)

**인프라 세팅**
- [ ] `npx create-next-app@latest chongmu-wiki --typescript --tailwind --app`
- [ ] Supabase 프로젝트 생성 + 스키마 마이그레이션 (4개 테이블)
- [ ] RLS 설정
- [ ] 시즌 1 analytics.json v2 생성 (process.py v2 실행)
- [ ] Supabase 시드 (analytics + wiki 콘텐츠)
- [ ] Vercel 배포 + `chongmu-wiki.com` 연결

**레이아웃**
- [ ] `Sidebar.tsx` (nav 그룹, active, 시즌 배지)
- [ ] `TopBar.tsx` (브레드크럼, stats pill, 시즌 상태)

**페이지**
- [ ] `/dashboard` — analytics 연동, 시즌 요약 문구, 카운트업
- [ ] `/activity` — 시즌 탭 + 차트 5종
- [ ] `/[slug]` — ContentBlock 렌더러 (5 블록 타입)
- [ ] `generateStaticParams()` — 9개 슬러그 사전 빌드

**관리자 기초**
- [ ] Supabase Auth 설정 (이메일)
- [ ] `/admin/upload` — analytics.json 업로드 + Revalidation

**파이프라인**
- [ ] `process.py v2` — 6개 레이어 완성
- [ ] `--upload` 플래그 — Supabase 자동 upsert
- [ ] 시즌 1 업로드 및 사이트 반영 검증

---

### Phase 2 — 고도화 (1~2주)

- [ ] 히트맵 차트 (`HourlyHeatmap`) 구현
- [ ] 토픽 트렌드 차트 (`TopicTrendChart`)
- [ ] 업체 언급 순위 차트 (`VendorRankChart`)
- [ ] FAQ 자동 생성 → `/activity` 하단 표시
- [ ] 위키 섹션에 업체 언급 횟수 자동 주입
- [ ] 관리자 콘텐츠 편집 폼
- [ ] 블록 순서 드래그앤드롭 (@dnd-kit)

---

### Phase 3 — 검색·모바일 (미정)

- [ ] Supabase FTS 또는 Algolia 검색
- [ ] ⌘K Command Palette
- [ ] 모바일 Drawer 사이드바
- [ ] OG Image 동적 생성 (`@vercel/og`)
- [ ] Google Analytics 4

---

### 마일스톤

| 마일스톤 | 완료 기준 |
|---|---|
| **M1** 레퍼런스 재현 | 레퍼런스 사이트 모든 콘텐츠 Next.js 동일 렌더링 |
| **M2** 파싱 데이터 연동 | analytics.json v2 → `/dashboard` + `/activity` 5종 차트 |
| **M3** 배포 | `chongmu-wiki.com` 접속 + Lighthouse ≥ 90 |
| **M4** 시즌 2 준비 | `process.py --season 2 --upload` → 5분 내 사이트 반영 |

---

## 13. 확정 사항

| 항목 | 결정 |
|---|---|
| **도메인** | `chongmu-wiki.com` |
| **시즌 1** | 기존 KakaoTalkChats.txt → 아카이브 (불변) |
| **시즌 2** | 신규 채팅방, 6개월마다 업데이트, 무기한 운영 |
| **시즌 경계** | 수동 선언 (사이트 오픈일 2026-06-01) |
| **운영자** | 1인 (Robin) — 관리자 패널 단독 접근 |
| **콘텐츠 방향** | 레퍼런스 사이트 유지 + 이해충돌 경고 유지 |
| **Supabase** | Free Tier (예상 사용량 ~30MB / 500MB 한도) |
| **외부 의존성** | process.py — Python stdlib만 사용 (pip install 불필요) |

---

*총무 실무 위키 PRD v2.0 · Robin (로빈) · 2026-06-01*
