"use client";

// Projeyle birlikte gelen hazır logolar (organizasyonun "slug" değerine göre).
// Ayarlar sayfasından bir logo yüklenirse, yüklenen logo bunların yerine kullanılır.
const BUNDLED_LOGOS = {
  noon: "/logos/noon.png",
  tetra: "/logos/tetra.jpg",
  line: "/logos/line.png",
};

export function getOrgLogoSrc(org) {
  return org?.logoUrl || BUNDLED_LOGOS[org?.slug] || "";
}

// Organizasyon logosunu uygulama ikonu gibi (yuvarlatılmış kare) gösterir.
export default function OrgIcon({ org, size = 96, className = "" }) {
  const src = getOrgLogoSrc(org);
  return (
    <div
      className={`bg-white overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
    >
      {src ? (
        <img src={src} alt={org?.name || ""} className="w-full h-full object-contain" draggable={false} />
      ) : (
        <span className="font-black text-slate-800" style={{ fontSize: Math.round(size * 0.42) }}>
          {(org?.name || "?").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
