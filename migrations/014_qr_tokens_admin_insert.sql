-- Fix: Allow admins to insert QR tokens from the client.
-- Previously only a SELECT policy existed, causing client-side
-- generateQRToken() calls to fail silently under RLS.

CREATE POLICY "qr_tokens: admin insert"
  ON public.qr_tokens FOR INSERT
  WITH CHECK (public.is_admin());
