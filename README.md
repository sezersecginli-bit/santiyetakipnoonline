# Şantiye Yönetim Sistemi — Kurulum (Sıfırdan, Tek Akış)

Bu rehberi baştan sona, atlamadan, sırayla takip edin. Toplam 5 aşama var:
**(A) Supabase** → **(B) Ekip Hesapları** → **(C) GitHub Desktop** → **(D) Vercel** → **(E) Test**.

**Nasıl çalışır:** Siteyi açınca önce **organizasyon (logo) seçim sayfası** gelir — NOON, TETRA,
LINE — logoları uygulama ikonu şeklinde hazır gelir (adlarını ve logolarını Ayarlar'dan
değiştirebilirsiniz). Birinin ikonuna tıklayınca o organizasyonun
**e-posta + şifre giriş ekranı** açılır. Her organizasyonun kendi projeleri, ekibi, firmaları ve
menü etiketleri vardır; birbirine karışmaz. Aynı kişi birden fazla organizasyonda çalışıyorsa,
soldaki menüden **"Organizasyon Değiştir"** ile tekrar şifre girmeden geçiş yapabilir.

Her ekip üyesi için Supabase'de bir hesap oluşturmanız ve uygulamadaki Ayarlar sayfasından o
kişinin e-postasını **çalışacağı organizasyonun** ekip listesine eklemeniz gerekir.

---

## A) SUPABASE (veritabanı) — 5 dakika

1. [supabase.com](https://supabase.com) → hesap açın → **New Project**.
   - Bir isim verin, bir veritabanı şifresi belirleyin (bu şifreyi bir yere not edin,
     ileride lazım olmayabilir ama kaybetmeyin), bölge olarak Frankfurt/EU seçin.
   - Proje oluşana kadar (1-2 dakika) bekleyin.
2. Sol menüden **SQL Editor**'e girin.
3. Bu klasördeki `supabase/schema.sql` dosyasını bir metin editörüyle açın, **içeriğin tamamını**
   seçip kopyalayın (Ctrl+A, Ctrl+C). Bu şema tamamen boştur — hiç örnek/demo veri içermez,
   sadece tablo yapısı ve güvenlik kurallarını kurar. Kendi projelerinizi ve verilerinizi
   uygulama arayüzünden gireceksiniz.
4. Supabase'deki SQL Editor kutusuna yapıştırın, sağ alttaki **RUN** butonuna basın.
   - "Potential issues detected" diye bir pencere çıkarsa **"Run and enable RLS"** deyin.
   - Sonunda yeşil bir "Success" mesajı görmelisiniz.
5. Sol menüden **Settings > Data API**'ye girin. Sayfadaki **Project URL**'i
   (`https://xxxxxxxxxxxx.supabase.co` formatında, sonunda hiçbir ek olmadan) bir kenara not edin.
6. Sol menüden **Settings > API Keys > "Legacy anon, service_role API keys"** sekmesine girin.
   `anon` `public` etiketli satırdaki uzun anahtarı (eyJhbGci... ile başlar) **Copy** ile kopyalayıp
   bir kenara not edin. **`service_role` anahtarına dokunmayın.**

Bu aşamanın sonunda elinizde 2 bilgi olmalı: **Project URL** ve **anon key**. Bir not defterine
geçici olarak yapıştırın, birazdan lazım olacak.

> Şema, **NOON, TETRA, LINE** adında 3 organizasyonu hazır kurar. Üçünün logosu projenin içinde
> hazır gelir (`public/logos/` klasörü); isterseniz siteyi açtıktan sonra Ayarlar'dan adlarını
> değiştirebilir veya kendi logonuzu yükleyebilirsiniz.

> İsterseniz `supabase/demo-seed.sql` dosyasını da (opsiyonel) çalıştırıp örnek bir proje ile
> arayüzü gezebilirsiniz — gerçek kullanım için gerekli değildir, istediğiniz zaman
> `supabase/clear-demo-data.sql` ile temizleyebilirsiniz.

---

## B) EKİP HESAPLARI (e-posta + şifre) — 5 dakika

1. Supabase panelinde sol menüden **Authentication > Users**'a girin.
2. **Add user** ile ekip üyeleriniz için birer e-posta + şifre hesabı oluşturun (örn.
   ahmet@sirket.com). "Auto Confirm User" seçeneği işaretliyse öyle bırakın — e-posta
   doğrulama beklemeden hemen giriş yapılabilir olur.
3. En az kendiniz için bir hesap oluşturduktan sonra bir sonraki aşamaya geçin — kalan ekip
   üyelerini istediğiniz zaman aynı şekilde ekleyebilirsiniz.

> Bu hesapların hangi organizasyonda çalışacağı, siteyi açtıktan sonra Ayarlar sayfasında e-posta
> eşleştirmesiyle belirlenir (E aşaması). Aynı hesap birden fazla organizasyona eklenebilir.

---

## C) GITHUB DESKTOP (kodu GitHub'a yükleme) — 10 dakika

Tarayıcıdan sürükle-bırak yükleme klasör yapısını bozduğu için bunu kullanmıyoruz.

1. [desktop.github.com](https://desktop.github.com) adresinden GitHub Desktop'ı indirip kurun.
2. Açılışta GitHub hesabınızla giriş yapın (hesabınız yoksa github.com'da ücretsiz açın).
3. Bu klasördeki (indirip zip'ten çıkardığınız `santiye-webapp` klasörü) **`.next` ve `node_modules`
   adında klasörler varsa onları tamamen silin** (yoksa sorun değil, sadece varsa silin).
4. GitHub Desktop'ta üst menüden **File > Add Local Repository**.
5. **Choose...** ile `santiye-webapp` klasörünü seçin (içinde `app`, `components`, `package.json`
   olan klasör).
6. "This directory does not appear to be a Git repository" uyarısı çıkacak, altındaki
   **"create a repository"** yazısına tıklayın, açılan ekranda **Create Repository** butonuna basın.
7. Sol üstte beliren **"Publish repository"** butonuna tıklayın. İsim verin (örn. `santiye-webapp`),
   **Publish Repository** deyin.
8. Bittiğinde github.com'a gidip deponuzu açın — `app`, `components`, `lib`, `supabase` klasörlerinin
   **mavi klasör ikonuyla** göründüğünü doğrulayın (dosya olarak dağınık görünmemeli).

---

## D) VERCEL (siteyi yayınlama) — 5 dakika

1. [vercel.com](https://vercel.com) → **Sign Up** → "Continue with GitHub" ile giriş yapın.
2. **Add New... > Project**.
3. Az önce yayınladığınız `santiye-webapp` deposunu bulup **Import** deyin.
4. Açılan ekranda **"Environment Variables"** bölümünü açın, iki değişken ekleyin:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` → Value: (A) aşamasında not ettiğiniz Project URL
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: (A) aşamasında not ettiğiniz anon key
   - Her ikisi de eklendikten sonra listede görünmeli (2 satır).
5. **Deploy** butonuna basın, 1-3 dakika bekleyin.
6. Derleme bitince "Congratulations" ekranı ve `https://santiye-webapp-xxxx.vercel.app` gibi
   gerçek bir adres göreceksiniz.

---

## E) TEST

1. Vercel'in verdiği adresi tarayıcıda açın — **organizasyon (logo) seçim sayfası** gelmeli.
2. Bir organizasyona tıklayın (örn. NOON), B aşamasında oluşturduğunuz e-posta/şifre ile giriş yapın.
3. İlk girişte o organizasyon **"kurulum modu"**ndadır (henüz kimsenin e-postası eşleştirilmemiş).
   Sol menüden **Ayarlar**'a girin:
   - **Ekip Üyeleri**'nde kendi kaydınızı (veya "Üye Ekle" ile yeni bir kayıt) kalem ikonuyla açıp
     **E-posta** alanına Supabase'de oluşturduğunuz hesabın e-postasını yazın, kaydedin.
     ⚠️ Önce KENDİ e-postanızı eşleştirin; aksi halde bir sonraki girişte erişiminiz kapanır.
   - **Genel Görünüm**'den organizasyonun adını/menü etiketlerini düzenleyin (logo hazır gelir;
     değiştirmek isterseniz "Logo Yükle").
4. Diğer ekip üyeleri için de aynısını yapın (Supabase'de hesap aç → ilgili organizasyonun
   Ayarlar'ında e-postayı eşleştir). Eşleştirilmemiş biri girmeye çalışırsa "Bu organizasyona
   erişiminiz yok" ekranını görür.
5. Hiç proje yoksa "İlk projenizi oluşturun" ekranı gelir — proje adını girip oluşturun.
6. Proje sayfasından **"Blok Ekle"** ile blok/kat/daire sihirbazını kullanın; Firmalar'dan
   **"Yeni Firma"**, İş Kalemleri'nden **"Yeni İş Kalemi"** veya **"Standart Şablonu Ekle"** ile
   kendi verinizi girmeye başlayın.
7. Menüden **"Organizasyon Değiştir"** ile TETRA'ya geçin: proje listesi boş olmalı (ayrı veri).
   Üstteki proje seçiciden her organizasyonda istediğiniz kadar proje açabilirsiniz.
8. Bu adresi ekibinize paylaşın.

---

## MEVCUT KURULUMUNUZ VARSA (Yükseltme)

Daha önce bu sistemi kurduysanız (şifresiz sürüm dahil), organizasyonlar + şifreli girişe
geçmek için **tek bir dosya** yeterli:

1. Önce **Authentication > Users** kısmından ekip üyeleriniz için e-posta+şifre hesapları oluşturun
   (B aşamasındaki gibi). ⚠️ Bunu YAPMADAN aşağıdakine geçmeyin: şifreli girişe geçince hesabı
   olmayan kimse giriş yapamaz.
2. Supabase SQL Editor'de **`supabase/upgrade.sql`** dosyasının tamamını çalıştırın (tekrar
   çalıştırmak güvenlidir). Bu dosya: NOON/TETRA/LINE organizasyonlarını ekler, **mevcut
   projelerinizi ve ekip kayıtlarınızı NOON'a atar** (başka organizasyona taşımak için dosyanın
   en altındaki örneğe bakın), tüm verileri "giriş yapmadan erişilemez" yapar ve logo
   depolama alanını açar.
3. Bu klasördeki güncel dosyaları (`app/`, `components/`, `lib/`, `supabase/` klasörleri)
   GitHub Desktop'a bağlı yerel klasörünüzün üzerine kopyalayıp yapıştırın. (Eski
   `lib/identity.js` ve eski SQL dosyaları — `add-team-members.sql`, `add-app-settings.sql`,
   `enable-password-login.sql` — artık yok; eski kopyanızda varsa silebilirsiniz.)
4. GitHub Desktop'ta **Commit** → **Push origin**. Vercel otomatik yeniden deploy eder.
5. Siteyi açın: organizasyon seçim sayfası → NOON → giriş yapın → Ayarlar'dan kendi
   e-postanızı ekip kaydınıza eşleştirin (E aşaması, 3. madde).

---

## Notlar

- **Giriş (e-posta + şifre)**: Gerçek Supabase Authentication kullanılır. Yeni bir ekip üyesi
  eklemek için: (1) Supabase Authentication panelinden o kişi için hesap açın, (2) çalışacağı
  organizasyonu seçip Ayarlar sayfasından aynı e-postayla bir ekip kaydı oluşturun/eşleştirin.
- **Ekip Üyeleri (Ayarlar sayfası)**: İsim, rol ve e-posta eşleştirmesini buradan yönetirsiniz.
  Değişiklikler Supabase'de saklanır, tüm ekip için anında geçerli olur.
- **Organizasyonlar (NOON / TETRA / LINE)**: Giriş öncesi sayfada logolarıyla (ikon şeklinde) görünürler; logo dosyaları `public/logos/`
  klasöründe (`noon.png`, `tetra.jpg`, `line.png`). Her
  organizasyonun projeleri, firmaları, ekibi ve menü etiketleri ayrıdır. Veri ayrımı uygulama
  seviyesindedir: hesabı olan herkes veritabanı düzeyinde tüm organizasyonları teknik olarak
  okuyabilir; uygulama ise kişiyi yalnızca e-postası ekip listesinde tanımlı olduğu
  organizasyonlara alır. Hesapları sadece güvendiğiniz kişiler için açın.
- **Genel Görünüm (Ayarlar sayfası)**: Seçili organizasyonun **adı**, **logosu** (hazır logo yerine kendi görselinizi yükleyebilirsiniz) ve sol
  menüdeki her sekmenin **etiketi** (örn. "Firmalar" yerine "Tedarikçiler") buradan değiştirilir.
- **Bildirimler**: Sağ üstteki zil ikonu artık gerçek bir liste açıyor — geciken işler, yaklaşan
  teklif son tarihleri, geciken satın alma teslimatları ve süresi geçmiş açık eksikler. Bir
  bildirime tıklamak ilgili sayfaya götürür.
- **Görevler**: Sol menüdeki Görevler sayfasından görev oluşturabilir, sorumlu atayabilir,
  durumuna tıklayarak (Yapılacak → Devam ediyor → Bekliyor → Tamamlandı) ilerletebilirsiniz.
- **Kontrol / Eksikler**: Blok/daire/mahal bazlı eksik kayıtları artık bağımsız bir sayfada;
  filtreleyebilir, yeni eksik girebilir, durumuna tıklayarak Açık/Kapandı olarak
  işaretleyebilirsiniz.
- **İş Kalemleri — Standart Şablon**: "Standart Şablonu Ekle" butonu, bir inşaat için gerekli
  tüm iş kalemlerini (Mimari Proje, Statik Proje'den Hafriyat, Betonarme, Seramik, Boya'ya kadar
  ~34 kalem) tek seferde listeye ekler. Her birini düzenleyerek (kalem satırındaki kalem ikonu)
  blok, sorumlu, firma, tarih ve maliyet atayabilirsiniz. Aynı satırdaki çöp kutusu ikonuyla
  gereksiz kalemleri silebilirsiniz.
- **İş Kalemi ↔ Teklif Senkronizasyonu**: Yeni bir iş kalemi eklediğinizde (tek tek veya Standart
  Şablon ile toplu), her biri için Teklifler sekmesinde otomatik olarak "Teklif bekliyor"
  durumunda bir teklif talebi oluşur — ayrıca "Yeni Teklif Talebi" açmanıza gerek kalmaz. Bir iş
  kaleminin adını sonradan değiştirirseniz, bağlı teklif talebinin başlığı da otomatik güncellenir.
- **İş Kalemleri — Toplu Seçip Silme**: Tablodaki kutucuklarla birden fazla iş kalemi seçip
  "Seçilenleri Sil" ile tek seferde silebilirsiniz; tek tek silmeye gerek kalmaz.
- **Teklifler — Düzenleme**: Her teklif talebinin başlığını/son tarihini kalem ikonuyla
  düzenleyebilir, çöp kutusuyla tamamen silebilirsiniz. Alınan her bir firma teklifini de
  (fiyat, teslim, ödeme koşulu vb.) ayrı ayrı düzenleyip silebilirsiniz.
- **Blok/Kat/Daire — Toplu Oluşturma**: Proje sayfasında "Blok Ekle" artık bir sihirbaz: blok
  adını, kat sayısını ve kat başına daire sayısını girip tek tıkla tüm katları ve daireleri
  otomatik oluşturabilirsiniz (Zemin Kat dahil/hariç seçilebilir). Tek tek "Kat Ekle"/"Daire
  Ekle" özellikleri de sonradan ince ayar için hâlâ duruyor.
- **Evraklar — Düzenleme**: Her belgenin adını, kategorisini, ilişkili olduğu iş/firmayı, notunu
  ve dosyasını/linkini kalem ikonuyla düzenleyebilir, çöp kutusuyla silebilirsiniz.
- **Proje Silme**: Üstteki proje seçicide her projenin yanında (üzerine gelince görünen) bir çöp
  kutusu ikonu var; Proje sayfası > Düzenle > "Bu Projeyi Sil" ile de silebilirsiniz. Bu işlem o
  projeye ait TÜM veriyi (iş kalemleri, firmalar, teklifler, evraklar, fotoğraflar dahil) kalıcı
  olarak siler, geri alınamaz.
- **Geri Tuşu**: Sayfa başlığının solundaki ok butonu, bir önceki görüntülediğiniz sayfaya döner.
- **Realtime**: Bir kullanıcı bir teklifi onayladığında veya yeni bir günlük rapor girdiğinde,
  diğer açık oturumlar birkaç saniye içinde otomatik güncellenir.

---

## Bir Adım Hata Verirse

Her aşamayı bitirmeden bir sonrakine geçmeyin. Hata alırsanız hangi aşamada (A/B/C/D) ve hangi
numaralı adımda olduğunuzu belirtip ekran görüntüsünü paylaşın — sıfırdan değil, o adımdan devam
ederiz.

**En sık karşılaşılan hatalar ve sebebi:**
- `supabaseUrl is required` → Vercel'de Environment Variables eklenmemiş ya da eklendikten sonra
  yeniden deploy edilmemiş (D.4-D.5 adımlarını kontrol edin).
- `Couldn't find any pages or app directory` → GitHub'a yükleme klasör yapısını bozmuş
  (C aşamasını GitHub Desktop ile, tarayıcı sürükle-bırak KULLANMADAN tekrar yapın).
- Organizasyon sayfasında "Organizasyonlar yüklenemedi" → Supabase'de `schema.sql` (yeni kurulum)
  veya `upgrade.sql` (mevcut kurulum) çalıştırılmamış.
- "Bu organizasyona erişiminiz yok" → Hesabınız var ama e-postanız o organizasyonun ekip
  listesinde (Ayarlar) tanımlı değil. Yöneticiniz eklemeli.
- Giriş "E-posta veya şifre hatalı" diyor → Supabase > Authentication > Users'ta o e-posta ile
  bir hesap yok ya da şifre yanlış.
