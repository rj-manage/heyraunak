-- ============================================================
-- RJ Studio - Enquiries (Phase C)
-- ------------------------------------------------------------
-- Private storage bucket for service-enquiry attachments.
-- The enquiries / enquiry_attachments tables already exist (0001)
-- with RLS (0002); submissions are written by server code using the
-- service role, so no storage policies are granted to anon.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('enquiries', 'enquiries', false)
on conflict (id) do nothing;
