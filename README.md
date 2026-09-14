# Şantiye Yönetim Sistemi — Bağımsız Web Sitesi (Next.js + Supabase)

60 Dairelik Konut Projesi için gerçek, çok kullanıcılı, Claude'dan bağımsız bir web uygulaması.
5 ekip üyesi kendi hesabıyla giriş yapar, aynı veritabanını (Supabase/PostgreSQL) paylaşır,
değişiklikler anlık olarak (realtime) diğer kullanıcılara yansır.

## İçerik

- **Next.js 14** (App Router) — arayüz
- **Supabase** — veritabanı (PostgreSQL), kimlik doğrulama (Auth), dosya depolama (Storage)
- Modüller: Dashboard, Proje, İş Kalemleri, Firmalar, Teklifler, Şantiye Günlük Rapor,
  Daire Takibi, Satın Alma, Evraklar (gerçek dosya yükleme), Fotoğraflar (gerçek fotoğraf yükleme)

---

## 1. Supabase Projesi Oluşturun

1. [supabase.com](https://supabase.com) adresinde ücretsiz bir hesap açın.
2. **New Project** ile yeni bir proje oluşturun (bölge olarak Frankfurt/EU seçmeniz Türkiye'ye en yakın gecikmeyi verir).
3. Proje oluşunca sol menüden **SQL Editor**'e girin.
4. Bu klasördeki `supabase/schema.sql` dosyasının **tamamını** kopyalayıp SQL Editor'e yapıştırın ve **RUN**'a basın.
   - Bu işlem tüm tabloları, güvenlik kurallarını (RLS), dosya depolarını (Storage bucket) ve
     "60 Dairelik Konut Projesi" demo verisini bir kerede oluşturur.

## 2. Ekip Üyelerini (5 Kullanıcı) Oluşturun

1. Supabase Dashboard'da **Authentication > Users** sekmesine girin.
2. **Add user** ile ekip üyeleriniz için 5 kullanıcı oluşturun (e-posta + şifre). Örnek:
   - ahmet@sirket.com → Yönetici
   - elif@sirket.com → Proje Mimarı
   - mehmet@sirket.com → Şantiye Sorumlusu
   - zeynep@sirket.com → Satın Alma
   - burak@sirket.com → Teknik Ofis
3. Her kullanıcıyı isim/rolüyle eşleştirmek için **SQL Editor**'e dönüp `schema.sql` dosyasının
   en altındaki 5 örnek `insert into profiles ...` satırını, kendi girdiğiniz e-postalarla
   güncelleyerek çalıştırın. (Bu adım olmadan kullanıcılar giriş yapabilir ama isim/rolleri görünmez.)

## 3. Ortam Değişkenlerini Ayarlayın

1. Supabase Dashboard'da **Project Settings > API** sayfasına gidin.
2. `Project URL` ve `anon public` anahtarını kopyalayın.
3. Bu projede `.env.local.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 4. Yerelde Çalıştırın (opsiyonel, test için)

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın, 2. adımda oluşturduğunuz e-posta/şifre ile giriş yapın.

## 5. Vercel'e Deploy Edin (gerçek, herkesin erişebileceği site)

En kolay yol:

1. Bu proje klasörünü bir GitHub reposuna yükleyin (`git init`, `git add .`, `git commit`, GitHub'da yeni repo açıp `git push`).
2. [vercel.com](https://vercel.com) üzerinde ücretsiz hesap açıp **New Project** ile bu repoyu seçin.
3. Vercel "Environment Variables" kısmına `.env.local` dosyanızdaki iki değişkeni ekleyin
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. **Deploy**'a basın. Birkaç dakika içinde `https://sizin-projeniz.vercel.app` gibi gerçek bir
   adres alırsınız — bunu ekibinizle paylaşabilirsiniz.

> Alternatif: Vercel CLI ile `npx vercel` komutunu proje klasöründe çalıştırıp adımları takip
> etmek de yeterlidir; GitHub'a yüklemeden doğrudan deploy edebilirsiniz.

## 6. Kendi Domaininizi Bağlamak (opsiyonel)

Vercel proje ayarlarından **Domains** sekmesine kendi alan adınızı (örn. `santiye.sirketiniz.com`)
ekleyip DNS kayıtlarını Vercel'in gösterdiği şekilde güncellemeniz yeterli.

---

## Notlar

- **Realtime**: Bir kullanıcı bir teklifi onayladığında veya yeni bir günlük rapor girdiğinde,
  diğer açık oturumlar birkaç saniye içinde otomatik güncellenir (Supabase Realtime kullanılıyor).
- **Dosya yükleme**: Evraklar ve Fotoğraflar modüllerinde artık gerçek dosya/fotoğraf yükleme
  çalışır (Supabase Storage, `documents` ve `photos` adında iki public bucket).
- **Güvenlik modeli**: Şu an "giriş yapmış herkes tüm veriyi okur/yazar" basit modeli kullanılıyor
  (5 kişilik kapalı bir ekip için yeterli). İleride roller arası yetki farklılaştırması
  (örn. sadece Yönetici teklif onaylayabilsin) `supabase/schema.sql` içindeki RLS politikaları
  genişletilerek eklenebilir.
- **Çoklu proje**: Veritabanı şeması `project_id` üzerinden çoklu projeye hazır tasarlandı;
  şu an tek proje (60 Dairelik Konut Projesi) için `lib/api.js` içindeki `getActiveProjectId()`
  ilk projeyi otomatik seçiyor. İkinci bir proje eklemek isterseniz `projects` tablosuna yeni
  bir satır eklemeniz ve bir proje seçici ekran eklemeniz yeterli.
- **Genişletme**: Kalan modüller (İş Programı/Gantt, Görevler ekranı, Toplantılar, Hakedişler,
  Ödemeler, Bütçe, Raporlar) aynı desen izlenerek eklenebilir: `supabase/schema.sql`'e tablo,
  `lib/api.js`'e mapping + mutasyon fonksiyonu, `components/`e sayfa, `lib/helpers.js`'deki
  `MENU` dizisine menü girişi.

## Sorun Giderme

- **"Aktif proje bulunamadı" hatası**: `schema.sql` dosyasını tam olarak çalıştırmadınız demektir.
  SQL Editor'de tekrar çalıştırın (idempotent olacak şekilde yazıldı, tekrar çalıştırmak güvenlidir).
- **Giriş yapamıyorum**: Authentication > Users altında kullanıcının var olduğundan ve şifreyi
  doğru girdiğinizden emin olun.
- **İsmim/rolüm görünmüyor**: 2. adımdaki `insert into profiles ...` satırını o kullanıcının
  e-postasıyla çalıştırmayı unutmuş olabilirsiniz.
- **Dosya yükleyemiyorum**: `schema.sql` içindeki Storage bucket ve policy bölümünün
  çalıştığından emin olun (Storage sekmesinde `documents` ve `photos` adında iki bucket görmelisiniz).
