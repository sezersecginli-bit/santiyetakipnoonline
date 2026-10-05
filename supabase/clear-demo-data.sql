-- =====================================================================
-- DEMO VERİLERİNİ TEMİZLE
-- Bu dosyayı Supabase SQL Editor'de bir kez çalıştırın. Sadece demo-seed.sql
-- ile gelen "60 Dairelik Konut Projesi" demo projesini ve ona bağlı TÜM
-- veriyi siler (bloklar, daireler, firmalar, iş kalemleri, teklifler,
-- satın almalar, evraklar, fotoğraflar, raporlar, eksikler, görevler).
--
-- Diğer projeleriniz (hangi organizasyonda olursa olsun) etkilenmez.
-- ⚠️ Bu işlem geri alınamaz.
-- =====================================================================

delete from projects where id = '00000000-0000-0000-0000-000000000001';

-- Not: alt tablolar "on delete cascade" ile projects tablosuna bağlı olduğu
-- için yukarıdaki tek satır hepsini otomatik temizler.
-- Storage'a (documents / photos) yüklenmiş dosyalar silinmez; isterseniz
-- Supabase Dashboard > Storage'dan elle temizleyebilirsiniz.
