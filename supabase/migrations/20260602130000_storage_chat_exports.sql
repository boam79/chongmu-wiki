-- Season chat archives: raw KakaoTalk .txt + parsed messages.jsonl
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-exports', 'chat-exports', false, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "service role full access chat-exports"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'chat-exports')
WITH CHECK (bucket_id = 'chat-exports');

CREATE POLICY "authenticated read chat-exports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-exports');
