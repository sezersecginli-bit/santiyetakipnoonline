export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
export const fmtTL = (n) =>
  Number(n || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

export const MENU = [
  { id: "dashboard", label: "Dashboard" },
  { id: "proje", label: "Proje" },
  { id: "is-kalemleri", label: "İş Kalemleri" },
  { id: "teklifler", label: "Teklifler" },
  { id: "satin-alma", label: "Satın Alma" },
  { id: "firmalar", label: "Firmalar / Taşeronlar" },
  { id: "santiye", label: "Şantiye" },
  { id: "daire-takibi", label: "Daire Takibi" },
  { id: "evraklar", label: "Evraklar" },
  { id: "fotograflar", label: "Fotoğraflar" },
];

export const WORK_STATUS = ["Yapılacak", "Hazırlanıyor", "Bekliyor", "Devam ediyor", "Kontrolde", "Eksik var", "Tamamlandı", "İptal"];

export const STATUS_STYLE = {
  "Yapılacak": "bg-slate-100 text-slate-600 border-slate-200",
  "Hazırlanıyor": "bg-slate-100 text-slate-600 border-slate-200",
  "Bekliyor": "bg-amber-50 text-amber-700 border-amber-200",
  "Devam ediyor": "bg-blue-50 text-blue-700 border-blue-200",
  "Kontrolde": "bg-violet-50 text-violet-700 border-violet-200",
  "Eksik var": "bg-red-50 text-red-700 border-red-200",
  "Tamamlandı": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "İptal": "bg-slate-100 text-slate-400 border-slate-200 line-through",
  "Teklif bekliyor": "bg-slate-100 text-slate-600 border-slate-200",
  "Teklifler alındı": "bg-blue-50 text-blue-700 border-blue-200",
  "Karşılaştırılıyor": "bg-violet-50 text-violet-700 border-violet-200",
  "Onay bekliyor": "bg-amber-50 text-amber-700 border-amber-200",
  "Onaylandı": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Açık": "bg-red-50 text-red-700 border-red-200",
  "Kapandı": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Talep oluşturuldu": "bg-slate-100 text-slate-600 border-slate-200",
  "Teklif alınıyor": "bg-blue-50 text-blue-700 border-blue-200",
  "Sipariş verildi": "bg-violet-50 text-violet-700 border-violet-200",
  "Üretimde": "bg-amber-50 text-amber-700 border-amber-200",
  "Sevkiyatta": "bg-blue-50 text-blue-700 border-blue-200",
  "Şantiyede": "bg-teal-50 text-teal-700 border-teal-200",
};

export const PRIORITY_STYLE = {
  "Kritik": { dot: "bg-red-500", text: "text-red-700" },
  "Yüksek": { dot: "bg-orange-500", text: "text-orange-700" },
  "Normal": { dot: "bg-amber-400", text: "text-amber-700" },
  "Düşük": { dot: "bg-emerald-500", text: "text-emerald-700" },
};

export const CATEGORY_GROUPS = {
  "Proje": ["Mimari proje", "Statik proje", "Elektrik proje", "Mekanik proje", "Peyzaj", "Yangın", "Altyapı", "Ruhsat işlemleri"],
  "Şantiye": ["Hafriyat", "Kazı", "İksa", "Temel", "Betonarme", "Duvar", "Sıva", "Şap", "Su yalıtımı", "Isı yalıtımı", "Çatı", "Cephe", "Doğrama", "Cam", "Elektrik", "Mekanik", "Asansör", "Seramik", "Parke", "Boya", "Mutfak", "Banyo", "Kapılar", "Sabit mobilya", "Peyzaj", "Ortak alanlar"],
};

export const DOCUMENT_CATEGORIES = ["Projeler", "Teknik Şartnameler", "Teklifler", "Sözleşmeler", "Faturalar", "Hakedişler", "Ruhsatlar", "Tutanaklar", "Fotoğraflar", "Diğer"];

export const PURCHASE_STATUS_FLOW = ["Talep oluşturuldu", "Teklif alınıyor", "Sipariş verildi", "Üretimde", "Sevkiyatta", "Şantiyede", "Tamamlandı"];

export const purchaseTotal = (p) => Number(p.quantity || 0) * Number(p.unitPrice || 0);
export const purchaseGrandTotal = (p) => purchaseTotal(p) * (1 + Number(p.kdv || 20) / 100);
