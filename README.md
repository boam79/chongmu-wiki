# 총무위키 (chongmu-wiki)

KakaoTalk 오픈채팅 데이터 파싱 → analytics → 위키 파이프라인.

**프로덕션 (Vercel)**: https://chongmu-wiki.vercel.app  
**GitHub**: https://github.com/boam79/chongmu-wiki (`main` push → 자동 배포)  
**UI 레퍼런스 (Netlify)**: https://chongmu-wiki-06011322.netlify.app/

## Vercel

| 항목 | 값 |
|------|-----|
| 프로젝트명 | `chongmu-wiki` (GitHub 리포 이름과 동일) |
| Production URL | https://chongmu-wiki.vercel.app |
| Preview URL | `https://chongmu-wiki-git-<branch>-ckadltmfxhrxhrxhr-5008s-projects.vercel.app` 또는 `https://chongmu-wiki-<deployment-id>-ckadltmfxhrxhrxhr-5008s-projects.vercel.app` |
| Dashboard | https://vercel.com/ckadltmfxhrxhrxhr-5008s-projects/chongmu-wiki |

로컬에서 프로젝트 연결(이미 완료 시 `.vercel/` 생성됨, gitignore):

```bash
vercel link --yes --project chongmu-wiki --scope ckadltmfxhrxhrxhr-5008s-projects
vercel deploy --prod
```

PRD 커스텀 도메인 `chongmu-wiki.com`은 Vercel Dashboard → **Settings → Domains**에서 추가.

## Supabase (생성 완료)

| 항목 | 값 |
|------|-----|
| 프로젝트명 | `chongmu-wiki` |
| Project ref | `ibzxzhepsorsqqdcbfgo` |
| URL | https://ibzxzhepsorsqqdcbfgo.supabase.co |
| Region | ap-northeast-2 (Seoul) |
| Dashboard | https://supabase.com/dashboard/project/ibzxzhepsorsqqdcbfgo |

로컬 환경은 **`.env.local`** (gitignore) — Supabase MCP로 URL·anon 키 반영됨.

```bash
cp .env.example .env.local   # 최초 1회
```

**아직 직접 넣어야 하는 값** (MCP에서 제공되지 않음):

- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_KEY`  
  → [Dashboard → Settings → API](https://supabase.com/dashboard/project/ibzxzhepsorsqqdcbfgo/settings/api) → **service_role**  
  (Storage에 시즌 1 `KakaoTalkChats.txt` 업로드에 **필수**)

### 시즌 1 — Storage 업로드 (PRD)

시즌 1은 **ARCHIVED** · 소스 `KakaoTalkChats.txt` · Storage 경로:

| 파일 | Storage 경로 |
|------|----------------|
| 원본 카카오보내기 | `chat-exports/season-1/KakaoTalkChats.txt` |
| 파싱 결과 | `chat-exports/season-1/messages.jsonl` |

```bash
# service_role 키를 .env.local에 넣은 뒤
python3 scripts/process.py KakaoTalkChats.txt --season 1 --upload
```

시즌 1 원본은 **덮어쓰기 없음** (`x-upsert: false`). 재업로드가 필요하면 대시보드에서 수동 삭제 후 다시 실행하세요.

연결 확인:

```bash
node --env-file=.env.local -e "const {createClient}=require('@supabase/supabase-js');createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).from('wiki_sections').select('slug').then(r=>console.log(r.data?.length,'sections',r.error||''));"

# 위키 본문 블록 시드 (9섹션, Netlify 레퍼런스 기반)
node scripts/seed_wiki_blocks.mjs
# 또는 Supabase migration: supabase/migrations/20260602130000_seed_wiki_blocks.sql
```

## Requirements

- Python 3.10+
- Node.js 20+

## Parse chat export (Layer 1)

```bash
# Run Layer 1 tests
python -m unittest discover -s scripts/tests -p "test_*.py" -v

# Layer 1 parse (Python REPL example)
python -c "
import sys; sys.path.insert(0, 'scripts')
from process import parse_layer1, write_messages_jsonl
msgs = parse_layer1('KakaoTalkChats.txt')
write_messages_jsonl(msgs, 'messages.jsonl')
print(len(msgs), 'messages')
"
```

## Next.js

```bash
npm install
npm run dev    # http://localhost:3000 → /dashboard
npm run build
```

## Environment variables

`.env.example` 참고. Vercel Production에는 `vercel env add` 또는 [Dashboard → Environment Variables](https://vercel.com/ckadltmfxhrxhrxhr-5008s-projects/chongmu-wiki/settings/environment-variables).

| 변수 | Vercel Production | 비고 |
|------|-----------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | |
| `SUPABASE_URL` | ✅ | |
| `REVALIDATE_SECRET` / `VERCEL_REVALIDATE_TOKEN` | ✅ | |
| `VERCEL_PROJECT_URL` | ✅ | `https://chongmu-wiki.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_KEY` | ❌ 수동 | 업로드·Storage 필수 — [Supabase API](https://supabase.com/dashboard/project/ibzxzhepsorsqqdcbfgo/settings/api) service_role |
| `ADMIN_UPLOAD_SECRET` | 선택 | 설정 시 `/admin/upload`에서 비밀번호 필요 (미설정이면 공개 업로드) |

## Project docs

- [총무위키_PRD_v2.0.md](./총무위키_PRD_v2.0.md)
