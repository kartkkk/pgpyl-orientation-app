-- Increase QR token validity window from 30 seconds to 120 seconds

alter table public.qr_tokens
  alter column valid_until set default (now() + interval '120 seconds');
