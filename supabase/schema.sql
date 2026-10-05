-- =====================================================================
-- ŞANTİYE YÖNETİM SİSTEMİ — SUPABASE ŞEMASI
-- Bu dosyanın tamamını Supabase Dashboard > SQL Editor içine yapıştırıp
-- "RUN" ile bir kerede çalıştırın.
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 1) TABLOLAR
-- =====================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('Yönetici','Proje Mimarı','Şantiye Sorumlusu','Satın Alma','Teknik Ofis')),
  created_at timestamptz default now()
);

-- Organizasyonlar (NOON, TETRA, LINE ...): giriş öncesi logo ekranında
-- gösterilir. Her organizasyonun kendi projeleri, ekibi ve menü etiketleri vardır.
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  menu_labels jsonb default '{}'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Ekip üyeleri: isim/rol/e-posta bilgisi. Ayarlar sayfasından yönetilir.
-- "email" alanı, Supabase Authentication'da oluşturulan gerçek giriş
-- hesabıyla (aynı e-posta) eşleştirme yapmak için kullanılır.
-- "org_id": bu kişinin hangi organizasyonun ekibinde olduğu.
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create unique index if not exists team_members_org_email_uniq
  on team_members (org_id, lower(email)) where email is not null and email <> '';

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  owner text,
  address text,
  land_area text,
  construction_area text,
  block_count int,
  apartment_count int,
  start_date date,
  planned_end date,
  estimated_end date,
  manager text,
  status text,
  created_at timestamptz default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  block_id uuid references blocks(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

create table if not exists apartments (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid references floors(id) on delete cascade,
  name text not null,
  progress int default 0
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  contact text,
  phone text,
  email text,
  category text,
  address text,
  quality int default 0,
  timing int default 0,
  price int default 0,
  comm int default 0,
  note text,
  created_at timestamptz default now()
);

create table if not exists work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  category text,
  sub text,
  block text,
  floor text,
  apt text,
  room text,
  responsible text,
  company text,
  start_date date,
  end_date date,
  planned_days int,
  actual_days int,
  status text default 'Yapılacak',
  priority text default 'Normal',
  est_cost numeric default 0,
  act_cost numeric default 0,
  description text,
  progress int,
  linked_quote_id uuid,
  created_at timestamptz default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  work_item_id uuid references work_items(id) on delete set null,
  title text not null,
  requested_by text,
  deadline date,
  status text default 'Teklif bekliyor',
  created_at timestamptz default now()
);

create table if not exists quote_bids (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  company text,
  amount numeric,
  kdv int default 20,
  delivery text,
  terms text,
  warranty text,
  note text
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  assignee text,
  creator text,
  start_date date,
  due_date date,
  priority text default 'Normal',
  status text default 'Yapılacak',
  work_item_id uuid references work_items(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_name text,
  text text,
  created_at timestamptz default now()
);

create table if not exists defects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  block text,
  apt text,
  room text,
  title text,
  assigned_to text,
  due_date date,
  status text default 'Açık',
  created_at timestamptz default now()
);

create table if not exists site_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  report_date date not null,
  weather text,
  crews text,
  total_workers int,
  done text,
  planned text,
  materials_in text,
  materials_out text,
  issues text,
  accident text default 'Yok',
  notes text,
  reporter text,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  item text not null,
  company text,
  quantity numeric default 1,
  unit text,
  unit_price numeric default 0,
  kdv int default 20,
  order_date date,
  expected_delivery date,
  actual_delivery date,
  payment_status text default 'Beklemede',
  responsible text,
  status text default 'Talep oluşturuldu',
  work_item_id uuid references work_items(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  category text,
  related_to text,
  block text,
  doc_date date,
  uploaded_by text,
  file_url text,
  note text,
  created_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  photo_date date,
  block text,
  floor text,
  apt text,
  room text,
  work_item text,
  phase text,
  description text,
  file_url text,
  uploaded_by text,
  created_at timestamptz default now()
);

-- =====================================================================
-- 2) ROW LEVEL SECURITY
-- Basit model: giriş yapmış (authenticated) her ekip üyesi tüm veriyi
-- okuyup yazabilir. 5 kişilik kapalı bir ekip için yeterlidir.
-- =====================================================================

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles','organizations','team_members','projects','blocks','floors','apartments','companies',
    'work_items','quotes','quote_bids','tasks','activities','defects',
    'site_reports','purchases','documents','photos'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- profiles: herkes kendi profilini ve diğerlerini görebilir (isim/rol göstermek için), sadece kendi profilini güncelleyebilir
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select to authenticated using (true);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id);

-- Veri tabloları: sadece giriş yapmış (authenticated) kullanıcılar okuyup yazabilir.
-- (Organizasyonlar arası ayrım uygulama seviyesinde yapılır: her organizasyonun
-- projeleri ve ekibi org_id ile ayrılır.)
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
    execute format('drop policy if exists "%s_all" on %I;', t, t);
    execute format(
      'create policy "%s_all" on %I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

-- organizations: ad ve logo giriş ekranında (henüz giriş yapılmadan) görünür,
-- bu yüzden herkes okuyabilir; sadece giriş yapmış kullanıcılar değiştirebilir.
drop policy if exists "organizations_select" on organizations;
create policy "organizations_select" on organizations for select to anon, authenticated using (true);
drop policy if exists "organizations_write" on organizations;
create policy "organizations_write" on organizations for all to authenticated using (true) with check (true);

-- =====================================================================
-- 3) STORAGE (dosya/fotoğraf yükleme)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_read" on storage.objects;
create policy "logos_read" on storage.objects for select using (bucket_id = 'logos');
drop policy if exists "logos_upload" on storage.objects;
create policy "logos_upload" on storage.objects for insert to authenticated with check (bucket_id = 'logos');

drop policy if exists "documents_read" on storage.objects;
create policy "documents_read" on storage.objects for select using (bucket_id = 'documents');
drop policy if exists "documents_upload" on storage.objects;
create policy "documents_upload" on storage.objects for insert to authenticated with check (bucket_id = 'documents');

drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos_upload" on storage.objects;
create policy "photos_upload" on storage.objects for insert to authenticated with check (bucket_id = 'photos');

-- =====================================================================
-- 4) ORGANİZASYONLAR (başlangıç kaydı)
-- Giriş öncesi ekranda gösterilecek 3 organizasyon. Adlarını ve logolarını
-- uygulamadaki Ayarlar sayfasından değiştirebilirsiniz. Tablo zaten doluysa
-- hiçbir şey eklenmez.
-- =====================================================================

insert into organizations (name, slug, sort_order)
select * from (values
  ('NOON', 'noon', 1),
  ('TETRA', 'tetra', 2),
  ('LINE', 'line', 3)
) as v(name, slug, sort_order)
where not exists (select 1 from organizations);

-- =====================================================================
-- 5) DEMO VERİSİ (İSTEĞE BAĞLI)
-- Bu şema BOŞTUR — hiç örnek proje/veri içermez, kendi verinizi
-- uygulama arayüzünden gireceksiniz (Proje sayfasından "Yeni Proje",
-- Firmalar'dan "Yeni Firma", İş Kalemleri'nden "Yeni İş Kalemi" vb.)
-- Sistemi denemek veya eğitim amaçlı örnek veri görmek isterseniz,
-- supabase/demo-seed.sql dosyasını (opsiyonel) ayrıca çalıştırabilirsiniz.
-- =====================================================================

-- =====================================================================
-- 6) GERÇEK GİRİŞ (E-POSTA + ŞİFRE) NASIL KURULUR
-- (Her organizasyonda ilk girişte "kurulum modu" açıktır: o organizasyonda
-- henüz hiçbir ekip üyesine e-posta eşleştirilmediyse, giriş yapan herkes
-- Ayarlar'a girip kendi e-postasını ekleyebilir. İlk e-posta eşleştirildikten
-- sonra o organizasyona sadece eşleştirilmiş e-postalar girebilir.)
-- 1) Supabase Dashboard > Authentication > Users > "Add user" ile her
--    ekip üyesi için bir e-posta + şifre hesabı oluşturun.
-- 2) Uygulamada Ayarlar sayfasına girin, her ekip üyesinin "E-posta"
--    alanına AYNI e-postayı yazıp kaydedin (isim/rolü de düzenleyebilirsiniz).
-- 3) O kişi artık bu e-posta + belirlediğiniz şifreyle giriş yapabilir;
--    sistem otomatik olarak bu e-postayla eşleşen team_members kaydını
--    (adını/rolünü) kullanır.
-- profiles tablosu şu an kullanılmıyor, ileride farklı bir kimlik
-- doğrulama modeline geçerseniz diye hazır bekliyor.
-- =====================================================================

