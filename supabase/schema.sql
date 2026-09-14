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

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
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
    'profiles','projects','blocks','floors','apartments','companies',
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

-- Diğer tüm tablolar: authenticated kullanıcı tam erişim
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'projects','blocks','floors','apartments','companies',
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

-- =====================================================================
-- 3) STORAGE (dosya/fotoğraf yükleme)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "documents_read" on storage.objects;
create policy "documents_read" on storage.objects for select using (bucket_id = 'documents');
drop policy if exists "documents_upload" on storage.objects;
create policy "documents_upload" on storage.objects for insert to authenticated with check (bucket_id = 'documents');

drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos_upload" on storage.objects;
create policy "photos_upload" on storage.objects for insert to authenticated with check (bucket_id = 'photos');

-- =====================================================================
-- 4) DEMO / BAŞLANGIÇ VERİSİ — "60 Dairelik Konut Projesi"
-- Sabit UUID'ler kullanılıyor ki tablolar birbirine referans verebilsin.
-- =====================================================================

insert into projects (id, name, owner, address, land_area, construction_area, block_count, apartment_count, start_date, planned_end, estimated_end, manager, status)
values (
  '00000000-0000-0000-0000-000000000001', '60 Dairelik Konut Projesi', 'Yılmaz Gayrimenkul A.Ş.', 'Beylikdüzü, İstanbul',
  '8.400 m²', '21.600 m²', 3, 60, '2026-02-01', '2027-06-30', '2027-07-20', 'Ahmet Yılmaz', 'İnşaat Devam Ediyor'
) on conflict (id) do nothing;

insert into blocks (id, project_id, name, sort_order) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Blok A', 1),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Blok B', 2),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Blok C', 3)
on conflict (id) do nothing;

insert into floors (id, block_id, name, sort_order)
select gen_random_uuid(), b.id,
  case when f = 0 then 'Zemin Kat' else f || '. Kat' end,
  f
from blocks b
cross join generate_series(0, 4) as f
where b.project_id = '00000000-0000-0000-0000-000000000001'
and not exists (select 1 from floors fl where fl.block_id = b.id);

with numbered_floors as (
  select f.id as floor_id, f.block_id, f.sort_order,
         row_number() over (partition by f.block_id order by f.sort_order) as floor_rank
  from floors f
  join blocks b on b.id = f.block_id
  where b.project_id = '00000000-0000-0000-0000-000000000001'
)
insert into apartments (id, floor_id, name, progress)
select gen_random_uuid(), nf.floor_id,
  'Daire ' || lpad(((nf.floor_rank - 1) * 4 + a)::text, 2, '0'),
  greatest(15, least(98, (40 + ((nf.floor_rank * 7 + a * 13) % 55))))
from numbered_floors nf
cross join generate_series(1, 4) as a
where not exists (select 1 from apartments ap where ap.floor_id = nf.floor_id);

insert into companies (id, project_id, name, contact, phone, email, category, address, quality, timing, price, comm, note) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'ABC İnşaat', 'Hakan Öz', '0532 111 22 33', 'info@abcinsaat.com', 'Kaba İnşaat', 'İkitelli OSB, İstanbul', 4, 3, 4, 4, 'Betonarme ve duvar imalatlarında ana taşeron.'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', 'XYZ Elektrik', 'Serkan Yıldız', '0533 222 33 44', 'iletisim@xyzelektrik.com', 'Elektrik', 'Hadımköy, İstanbul', 5, 4, 3, 5, 'Zayıf/güçlü akım işlerinde referanslı.'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001', 'Modern Yapı', 'Aylin Er', '0534 333 44 55', 'aylin@modernyapi.com', 'Kaba İnşaat', 'Başakşehir, İstanbul', 4, 4, 4, 3, 'İkinci teklif firması, yedek kapasite.'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000001', 'Delta Alüminyum', 'Onur Kaptan', '0535 444 55 66', 'onur@deltaaluminyum.com', 'Doğrama / Cephe', 'Esenyurt, İstanbul', 5, 3, 3, 4, 'Isı yalıtımlı doğrama sistemleri.'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-000000000001', 'Prestij Seramik', 'Gül Aydın', '0536 555 66 77', 'gul@prestijseramik.com', 'Seramik / Zemin', 'İkitelli, İstanbul', 4, 5, 5, 4, 'Hızlı teslim, uygun fiyat.')
on conflict (id) do nothing;

insert into work_items (id, project_id, name, category, sub, block, floor, apt, room, responsible, company, start_date, end_date, planned_days, actual_days, status, priority, est_cost, act_cost, description, progress) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000001', 'Blok A Temel İmalatı', 'Şantiye', 'Temel', 'Blok A', '-', '-', '-', 'Mehmet Demir', 'ABC İnşaat', '2026-03-10', '2026-04-05', 26, 28, 'Tamamlandı', 'Yüksek', 2100000, 2180000, 'Blok A radye temel imalatı.', null),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000001', 'Blok A Betonarme (1-4 Kat)', 'Şantiye', 'Betonarme', 'Blok A', '1-4', '-', '-', 'Mehmet Demir', 'ABC İnşaat', '2026-04-08', '2026-06-20', 70, 74, 'Tamamlandı', 'Kritik', 6500000, 6700000, 'Kat kat kalıp-demir-beton imalatı.', null),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-000000000001', 'Blok A Duvar İmalatı', 'Şantiye', 'Duvar', 'Blok A', '3. Kat', 'Daire 09-12', '-', 'Mehmet Demir', 'ABC İnşaat', '2026-06-25', '2026-07-30', 35, 33, 'Devam ediyor', 'Yüksek', 850000, 620000, 'Tuğla duvar örümü, 3. kat.', 65),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000001', 'Blok A Elektrik Alt Yapı', 'Şantiye', 'Elektrik', 'Blok A', '1-4', '-', '-', 'Burak Şahin', 'XYZ Elektrik', '2026-05-01', '2026-08-15', 106, null, 'Devam ediyor', 'Normal', 3200000, 1900000, 'Kolon hatları ve buat montajı.', null),
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000001', 'Alüminyum Doğrama Üretimi', 'Şantiye', 'Doğrama', 'Tüm Bloklar', '-', '-', '-', 'Zeynep Arslan', 'Delta Alüminyum', '2026-09-15', '2026-11-01', 47, null, 'Bekliyor', 'Kritik', 2400000, 0, '60 daire için ısı yalıtımlı doğrama.', null),
  ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-000000000001', 'Blok B Sıva İşleri', 'Şantiye', 'Sıva', 'Blok B', 'Zemin-2', '-', '-', 'Mehmet Demir', 'Modern Yapı', '2026-08-01', '2026-09-10', 40, null, 'Eksik var', 'Normal', 780000, 540000, 'İç sıva, zemin ve 2. kat arası.', 55),
  ('00000000-0000-0000-0000-0000000000e7', '00000000-0000-0000-0000-000000000001', 'Seramik Seçimi ve Numune Onayı', 'Şantiye', 'Seramik', 'Tüm Bloklar', '-', '-', '-', 'Elif Kaya', '-', '2026-09-01', '2026-09-15', 14, null, 'Yapılacak', 'Kritik', 0, 0, 'Mimari ekip numune onayı bekliyor.', null),
  ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-000000000001', 'Blok C Su Yalıtımı (Islak Hacimler)', 'Şantiye', 'Su yalıtımı', 'Blok C', 'Zemin-4', '-', 'Banyo / Mutfak', 'Mehmet Demir', 'ABC İnşaat', '2026-09-05', '2026-09-25', 20, null, 'Devam ediyor', 'Yüksek', 410000, 180000, 'Tüm ıslak hacimlerde membran uygulaması.', 40),
  ('00000000-0000-0000-0000-0000000000e9', '00000000-0000-0000-0000-000000000001', 'Asansör Siparişi', 'Şantiye', 'Asansör', 'Tüm Bloklar', '-', '-', '-', 'Zeynep Arslan', '-', '2026-09-01', '2026-09-20', 19, null, 'Bekliyor', 'Kritik', 0, 0, '3 blok için asansör siparişi verilmedi — kritik gecikme riski.', null),
  ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000001', 'Yangın Projesi Onayı', 'Proje', 'Yangın', 'Tüm Bloklar', '-', '-', '-', 'Elif Kaya', '-', '2026-02-01', '2026-03-01', 28, 30, 'Tamamlandı', 'Yüksek', 120000, 120000, 'İtfaiye onayı alındı.', null),
  ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-000000000001', 'Blok B Çatı İmalatı', 'Şantiye', 'Çatı', 'Blok B', '4. Kat üstü', '-', '-', 'Mehmet Demir', '-', '2026-08-20', '2026-09-08', 19, null, 'Kontrolde', 'Normal', 640000, 610000, 'Su yalıtımı sonrası kontrol aşamasında.', 90),
  ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000001', 'Peyzaj Uygulama Projesi', 'Proje', 'Peyzaj', 'Ortak Alan', '-', '-', '-', 'Elif Kaya', '-', '2026-09-20', '2026-10-10', 20, null, 'Hazırlanıyor', 'Düşük', 350000, 0, 'Ortak alan peyzaj tasarımı hazırlanıyor.', null)
on conflict (id) do nothing;

insert into quotes (id, project_id, work_item_id, title, requested_by, deadline, status) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e5', 'Alüminyum Doğrama', 'Zeynep Arslan', '2026-09-14', 'Onay bekliyor'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e9', 'Asansör (3 Blok, 6 Adet)', 'Zeynep Arslan', '2026-09-12', 'Karşılaştırılıyor'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e6', 'Blok C Sıva İşleri', 'Mehmet Demir', '2026-09-18', 'Teklif bekliyor'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000ec', 'Peyzaj Uygulama', 'Elif Kaya', '2026-09-25', 'Teklifler alındı')
on conflict (id) do nothing;

insert into quote_bids (quote_id, company, amount, kdv, delivery, terms, warranty, note) values
  ('00000000-0000-0000-0000-0000000000f1', 'Delta Alüminyum', 2400000, 20, '6 hafta', '%30 peşin, kalan teslimde', '5 yıl', 'Isı yalıtımlı, RAL 7016'),
  ('00000000-0000-0000-0000-0000000000f1', 'Modern Yapı', 2650000, 20, '5 hafta', '%50 peşin, kalan teslimde', '3 yıl', 'Daha hızlı teslim'),
  ('00000000-0000-0000-0000-0000000000f1', 'ABC İnşaat', 2350000, 20, '8 hafta', '%40 peşin', '2 yıl', 'En düşük fiyat, termin uzun'),
  ('00000000-0000-0000-0000-0000000000f2', 'Modern Yapı', 4200000, 20, '12 hafta', '%20 peşin, aylık taksit', '2 yıl bakım dahil', 'Yerli üretim'),
  ('00000000-0000-0000-0000-0000000000f2', 'Delta Alüminyum', 4550000, 20, '10 hafta', '%30 peşin', '3 yıl bakım dahil', 'İthal motor'),
  ('00000000-0000-0000-0000-0000000000f3', 'ABC İnşaat', 810000, 20, '5 hafta', '%30 peşin', '1 yıl', ''),
  ('00000000-0000-0000-0000-0000000000f4', 'Prestij Seramik', 320000, 20, '4 hafta', 'Peşin', '1 yıl', 'Sadece sert zemin kaplama teklifi'),
  ('00000000-0000-0000-0000-0000000000f4', 'Modern Yapı', 365000, 20, '3 hafta', '%50 peşin', '1 yıl', 'Bitkilendirme dahil');

insert into tasks (project_id, title, assignee, creator, start_date, due_date, priority, status, work_item_id) values
  ('00000000-0000-0000-0000-000000000001', 'Seramik numunelerini onaya sun', 'Elif Kaya', 'Ahmet Yılmaz', '2026-09-08', '2026-09-15', 'Kritik', 'Devam ediyor', '00000000-0000-0000-0000-0000000000e7'),
  ('00000000-0000-0000-0000-000000000001', 'Asansör tekliflerini karşılaştır', 'Zeynep Arslan', 'Ahmet Yılmaz', '2026-09-05', '2026-09-12', 'Kritik', 'Devam ediyor', '00000000-0000-0000-0000-0000000000e9'),
  ('00000000-0000-0000-0000-000000000001', 'Blok B sıva eksiklerini kontrol et', 'Mehmet Demir', 'Elif Kaya', '2026-09-09', '2026-09-13', 'Yüksek', 'Yapılacak', '00000000-0000-0000-0000-0000000000e6'),
  ('00000000-0000-0000-0000-000000000001', 'Doğrama teklifini yönetici onayına gönder', 'Zeynep Arslan', 'Elif Kaya', '2026-09-10', '2026-09-11', 'Kritik', 'Bekliyor', '00000000-0000-0000-0000-0000000000e5'),
  ('00000000-0000-0000-0000-000000000001', 'Blok C su yalıtımı fotoğraflarını yükle', 'Mehmet Demir', 'Mehmet Demir', '2026-09-11', '2026-09-11', 'Normal', 'Yapılacak', '00000000-0000-0000-0000-0000000000e8');

insert into activities (project_id, user_name, text) values
  ('00000000-0000-0000-0000-000000000001', 'Zeynep Arslan', 'Alüminyum Doğrama teklifini güncelledi.'),
  ('00000000-0000-0000-0000-000000000001', 'Mehmet Demir', 'Blok A 3. kat duvar kontrolünü tamamladı.'),
  ('00000000-0000-0000-0000-000000000001', 'Elif Kaya', 'Peyzaj uygulama projesini hazırlamaya başladı.'),
  ('00000000-0000-0000-0000-000000000001', 'Ahmet Yılmaz', 'Doğrama teklifi karşılaştırmasını inceledi.');

insert into defects (project_id, block, apt, room, title, assigned_to, due_date, status) values
  ('00000000-0000-0000-0000-000000000001', 'Blok A', 'Daire 09', 'Banyo', 'Seramik derzi eksik.', 'ABC İnşaat', '2026-09-18', 'Açık'),
  ('00000000-0000-0000-0000-000000000001', 'Blok A', 'Daire 03', 'Salon', 'Boya rötuşu gerekiyor.', 'Modern Yapı', '2026-09-14', 'Açık'),
  ('00000000-0000-0000-0000-000000000001', 'Blok B', 'Daire 22', 'Mutfak', 'Priz montajı eksik.', 'XYZ Elektrik', '2026-09-12', 'Kapandı'),
  ('00000000-0000-0000-0000-000000000001', 'Blok C', 'Daire 41', 'Banyo', 'Duş kabini silikon çekimi eksik.', 'ABC İnşaat', '2026-09-20', 'Açık'),
  ('00000000-0000-0000-0000-000000000001', 'Blok A', 'Daire 11', 'Balkon', 'Korkuluk montajı kontrol edilecek.', 'Modern Yapı', '2026-09-16', 'Açık');

insert into site_reports (project_id, report_date, weather, crews, total_workers, done, planned, materials_in, materials_out, issues, accident, notes, reporter) values
  ('00000000-0000-0000-0000-000000000001', '2026-09-10', 'Parçalı bulutlu, 24°C', 'ABC İnşaat (12 kişi), XYZ Elektrik (5 kişi)', 17, 'Blok A 3. kat duvar imalatına devam edildi, Blok C zemin kat su yalıtımı tamamlandı.', 'Blok B çatı kontrolü, Blok A elektrik kolon hattı döşemesi.', '200 m³ tuğla, 15 rulo izolasyon membranı', 'Moloz nakliyesi (3 kamyon)', 'Blok B''de malzeme asansörü yaklaşık 2 saat arızalandı.', 'Yok', 'Hava koşulları uygundu, iş kaybı yaşanmadı.', 'Mehmet Demir'),
  ('00000000-0000-0000-0000-000000000001', '2026-09-09', 'Güneşli, 26°C', 'ABC İnşaat (14 kişi), Modern Yapı (6 kişi)', 20, 'Blok C su yalıtımı başlatıldı, Blok A duvar imalatı %60 seviyesine ulaştı.', 'Seramik numune teslimatı bekleniyor.', 'Membran, çimento', '-', '-', 'Yok', '-', 'Mehmet Demir'),
  ('00000000-0000-0000-0000-000000000001', '2026-09-08', 'Yağmurlu, 18°C', 'XYZ Elektrik (8 kişi)', 14, 'Yağış nedeniyle dış cephe işleri durduruldu, iç mekan elektrik işlerine devam edildi.', 'Hava düzelirse duvar imalatına devam edilecek.', '-', '-', 'Şantiye girişinde su birikintisi oluştu, drenaj açıldı.', 'Yok', '-', 'Mehmet Demir');

insert into purchases (project_id, item, company, quantity, unit, unit_price, kdv, order_date, expected_delivery, actual_delivery, payment_status, responsible, status, work_item_id, notes) values
  ('00000000-0000-0000-0000-000000000001', 'Hazır Beton C30/37', 'ABC İnşaat', 850, 'm³', 2650, 20, '2026-03-05', '2026-03-08', '2026-03-08', 'Ödendi', 'Zeynep Arslan', 'Tamamlandı', '00000000-0000-0000-0000-0000000000e2', 'Blok A betonarme için toplu sipariş.'),
  ('00000000-0000-0000-0000-000000000001', 'Zayıf Akım Kablo Seti', 'XYZ Elektrik', 1, 'lot', 1450000, 20, '2026-06-01', '2026-06-20', '2026-06-18', 'Kısmi Ödendi', 'Zeynep Arslan', 'Şantiyede', '00000000-0000-0000-0000-0000000000e4', ''),
  ('00000000-0000-0000-0000-000000000001', 'Su Yalıtım Membranı', 'ABC İnşaat', 400, 'm²', 850, 20, '2026-08-28', '2026-09-04', '2026-09-03', 'Ödendi', 'Mehmet Demir', 'Şantiyede', '00000000-0000-0000-0000-0000000000e8', ''),
  ('00000000-0000-0000-0000-000000000001', 'Seramik (Islak Hacim)', 'Prestij Seramik', 1800, 'm²', 420, 20, '2026-09-09', '2026-09-30', null, 'Beklemede', 'Elif Kaya', 'Teklif alınıyor', '00000000-0000-0000-0000-0000000000e7', 'Numune onayı bekleniyor.'),
  ('00000000-0000-0000-0000-000000000001', 'Asansör (6 Adet)', '-', 6, 'adet', 0, 20, null, null, null, 'Beklemede', 'Zeynep Arslan', 'Talep oluşturuldu', '00000000-0000-0000-0000-0000000000e9', 'Teklif süreci devam ediyor.');

insert into documents (project_id, name, category, related_to, block, doc_date, uploaded_by, file_url, note) values
  ('00000000-0000-0000-0000-000000000001', 'Mimari Proje - Vaziyet Planı Rev.3.pdf', 'Projeler', 'Proje geneli', 'Tüm Bloklar', '2026-02-10', 'Elif Kaya', null, 'Ruhsat başvurusunda kullanılan güncel vaziyet planı.'),
  ('00000000-0000-0000-0000-000000000001', 'Yangın Projesi Onay Yazısı.pdf', 'Ruhsatlar', 'İtfaiye onayı', 'Tüm Bloklar', '2026-03-01', 'Elif Kaya', null, ''),
  ('00000000-0000-0000-0000-000000000001', 'Alüminyum Doğrama Teknik Şartname.docx', 'Teknik Şartnameler', 'Alüminyum Doğrama', 'Tüm Bloklar', '2026-08-15', 'Zeynep Arslan', null, ''),
  ('00000000-0000-0000-0000-000000000001', 'ABC İnşaat Taşeron Sözleşmesi.pdf', 'Sözleşmeler', 'ABC İnşaat', '-', '2026-02-20', 'Ahmet Yılmaz', null, 'Kaba inşaat ana taşeron sözleşmesi.'),
  ('00000000-0000-0000-0000-000000000001', 'Mart Ayı Hakediş Tutanağı - ABC İnşaat.pdf', 'Hakedişler', 'ABC İnşaat', '-', '2026-04-02', 'Ahmet Yılmaz', null, ''),
  ('00000000-0000-0000-0000-000000000001', 'Hazır Beton Faturası - Mart.pdf', 'Faturalar', 'Hazır Beton C30/37', 'Blok A', '2026-03-10', 'Zeynep Arslan', null, '');

insert into photos (project_id, photo_date, block, floor, apt, room, work_item, phase, description, file_url, uploaded_by) values
  ('00000000-0000-0000-0000-000000000001', '2026-06-24', 'Blok A', '3. Kat', '-', '-', 'Blok A Duvar İmalatı', 'Öncesi', 'Duvar imalatı öncesi 3. kat genel görünüm.', null, 'Mehmet Demir'),
  ('00000000-0000-0000-0000-000000000001', '2026-07-28', 'Blok A', '3. Kat', '-', '-', 'Blok A Duvar İmalatı', 'Sonrası', 'Duvar imalatı tamamlandıktan sonra 3. kat.', null, 'Mehmet Demir'),
  ('00000000-0000-0000-0000-000000000001', '2026-09-05', 'Blok C', 'Zemin Kat', 'Daire 41', 'Banyo', 'Blok C Su Yalıtımı', 'Öncesi', 'Membran uygulaması öncesi ıslak hacim.', null, 'Mehmet Demir'),
  ('00000000-0000-0000-0000-000000000001', '2026-09-10', 'Blok B', '4. Kat üstü', '-', '-', 'Blok B Çatı İmalatı', 'Sonrası', 'Çatı su yalıtımı sonrası kontrol.', null, 'Mehmet Demir');

-- =====================================================================
-- 5) EKİP ÜYELERİ (profiles)
-- Önce Authentication > Users kısmından 5 kullanıcı oluşturun, sonra
-- her biri için aşağıdaki gibi bir satır ekleyin (e-postaları kendi
-- girdiğiniz e-postalarla değiştirin):
--
-- insert into profiles (id, full_name, role)
-- select id, 'Ahmet Yılmaz', 'Yönetici' from auth.users where email = 'ahmet@sirket.com';
--
-- insert into profiles (id, full_name, role)
-- select id, 'Elif Kaya', 'Proje Mimarı' from auth.users where email = 'elif@sirket.com';
--
-- insert into profiles (id, full_name, role)
-- select id, 'Mehmet Demir', 'Şantiye Sorumlusu' from auth.users where email = 'mehmet@sirket.com';
--
-- insert into profiles (id, full_name, role)
-- select id, 'Zeynep Arslan', 'Satın Alma' from auth.users where email = 'zeynep@sirket.com';
--
-- insert into profiles (id, full_name, role)
-- select id, 'Burak Şahin', 'Teknik Ofis' from auth.users where email = 'burak@sirket.com';
-- =====================================================================
