# 총무위키 (chongmu-wiki)

KakaoTalk 오픈채팅 데이터 파싱 → analytics → 위키 파이프라인.

**레퍼런스 UI**: https://chongmu-wiki-06011322.netlify.app/

## Supabase (생성 완료)

| 항목 | 값 |
|------|-----|
| 프로젝트명 | `chongmu-wiki` |
| Project ref | `ibzxzhepsorsqqdcbfgo` |
| URL | https://ibzxzhepsorsqqdcbfgo.supabase.co |
| Region | ap-northeast-2 (Seoul) |
| Dashboard | https://supabase.com/dashboard/project/ibzxzhepsorsqqdcbfgo |

API 키는 대시보드 **Settings → API**에서 복사해 로컬 `.env.local`에 설정하세요. (저장소에 커밋하지 마세요.)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ibzxzhepsorsqqdcbfgo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon 또는 publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role — 서버/스크립트 전용>
REVALIDATE_SECRET=<임의 긴 문자열>
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

## Environment variables (`--upload` 예정)

```bash
SUPABASE_URL=https://ibzxzhepsorsqqdcbfgo.supabase.co
SUPABASE_SERVICE_KEY=
VERCEL_REVALIDATE_TOKEN=
VERCEL_PROJECT_URL=https://chongmu-wiki-06011322.netlify.app
```

## Project docs

- [총무위키_PRD_v2.0.md](./총무위키_PRD_v2.0.md)
