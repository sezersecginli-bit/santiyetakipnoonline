-- =====================================================================
-- YÜKSELTME (mevcut kurulumlar için) — TEK DOSYA
-- Bu dosyayı Supabase SQL Editor'de BİR KEZ çalıştırın. Tekrar çalıştırmak
-- güvenlidir. Yeni bir kurulum yapıyorsanız buna gerek yok: schema.sql
-- zaten hepsini içerir.
--
-- Ne yapar:
-- 1) Organizasyonlar (NOON, TETRA, LINE) tablosunu kurar ve 3 kayıt ekler.
-- 2) projects ve team_members tablolarına org_id (hangi organizasyon) ekler.
--    MEVCUT projeleriniz ve ekip kayıtlarınız ilk organizasyona (NOON)
--    atanır. Başka bir organizasyona taşımak için en alttaki örneğe bakın.
-- 3) team_members'a e-posta alanı ekler (giriş hesabıyla eşleştirmek için).
-- 4) Tüm veri tablolarını "giriş yapmadan erişilemez" hâline getirir
--    (şifreli giriş). Organizasyon adı/logosu giriş ekranında görünebilsin
--    diye sadece organizations tablosu herkese okunabilir.
-- 5) Logo yükleme için "logos" depolama alanını açar.
--
-- ⚠️ Çalıştırdıktan sonra Authentication > Users kısmından e-posta+şifre
-- hesapları oluşturmadan kimse giriş yapamaz. Önce hesapları oluşturun.
-- =====================================================================

create extension if not exists pgcrypto;

-- 1) Organizasyonlar
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  menu_labels jsonb default '{}'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now()
);

insert into organizations (name, slug, sort_order)
select * from (values
  ('NOON', 'noon', 1),
  ('TETRA', 'tetra', 2),
  ('LINE', 'line', 3)
) as v(name, slug, sort_order)
where not exists (select 1 from organizations);

-- 2) org_id + e-posta alanları
alter table team_members add column if not exists email text;
alter table team_members add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table projects add column if not exists org_id uuid references organizations(id) on delete cascade;

update projects set org_id = (select id from organizations order by sort_order limit 1) where org_id is null;
update team_members set org_id = (select id from organizations order by sort_order limit 1) where org_id is null;

create unique index if not exists team_members_org_email_uniq
  on team_members (org_id, lower(email)) where email is not null and email <> '';

-- Eski "app_settings" (uygulama adı/menü etiketleri) varsa menü etiketlerini
-- ilk organizasyona taşı ve tabloyu kilitle (artık kullanılmıyor).
do $$
begin
  if to_regclass('public.app_settings') is not null then
    execute 'update organizations set menu_labels = coalesce((select menu_labels from app_settings where id = 1), ''{}''::jsonb) where id = (select id from organizations order by sort_order limit 1) and (menu_labels is null or menu_labels = ''{}''::jsonb)';
    execute 'drop policy if exists "app_settings_all" on app_settings';
    execute 'create policy "app_settings_all" on app_settings for all to authenticated using (true) with check (true)';
  end if;
end $$;

-- 3) Güvenlik kuralları (RLS)
alter table organizations enable row level security;

drop policy if exists "organizations_select" on organizations;
create policy "organizations_select" on organizations for select to anon, authenticated using (true);
drop policy if exists "organizations_write" on organizations;
create policy "organizations_write" on organizations for all to authenticated using (true) with check (true);

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'team_members','projects','blocks','floors','apartments','companies',
    'work_items','quotes','quote_bids','tasks','activities','defects',
    'site_reports','purchases','documents','photos'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "%s_all" on %I;', t, t);
    execute format(
      'create policy "%s_all" on %I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

-- 4) Depolama (belge, fotoğraf, logo)
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;

drop policy if exists "documents_upload" on storage.objects;
create policy "documents_upload" on storage.objects for insert to authenticated with check (bucket_id = 'documents');
drop policy if exists "photos_upload" on storage.objects;
create policy "photos_upload" on storage.objects for insert to authenticated with check (bucket_id = 'photos');

drop policy if exists "logos_read" on storage.objects;
create policy "logos_read" on storage.objects for select using (bucket_id = 'logos');
drop policy if exists "logos_upload" on storage.objects;
create policy "logos_upload" on storage.objects for insert to authenticated with check (bucket_id = 'logos');

-- =====================================================================
-- İSTEĞE BAĞLI: Mevcut bir projeyi başka organizasyona taşımak
-- (başındaki iki tireyi silip proje adını ve organizasyon adını yazın):
--
-- update projects
--   set org_id = (select id from organizations where name = 'TETRA')
--   where name = 'YAMAÇTEPE 3 BLOK';
-- =====================================================================
