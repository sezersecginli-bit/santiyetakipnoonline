"use client";
import OrgIcon from "./OrgIcon";

export default function OrgSelectScreen({ orgs, error, onSelect }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-slate-100 text-2xl font-semibold tracking-tight mb-2">Organizasyon Seçin</h1>
      <p className="text-slate-500 text-sm mb-12 text-center">Devam etmek için çalışacağınız organizasyonun ikonuna dokunun.</p>

      {error && (
        <div className="max-w-md text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-4 mb-6">
          Organizasyonlar yüklenemedi: {error}
          <div className="text-xs text-red-400/80 mt-1.5">
            Supabase'de <b>supabase/upgrade.sql</b> (mevcut kurulum) veya <b>schema.sql</b> (yeni kurulum)
            dosyasını çalıştırdığınızdan emin olun.
          </div>
        </div>
      )}

      {!error && orgs.length === 0 && (
        <div className="max-w-md text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-4">
          Henüz hiç organizasyon tanımlı değil. Supabase'de <b>supabase/upgrade.sql</b> (mevcut kurulum)
          veya <b>schema.sql</b> (yeni kurulum) dosyasını çalıştırın.
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-9 sm:gap-x-14 max-w-3xl">
        {orgs.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            className="group flex flex-col items-center gap-3.5 focus:outline-none"
            aria-label={`${o.name} organizasyonuna gir`}
          >
            <span className="block shadow-xl shadow-black/50 transition-all duration-200 group-hover:-translate-y-1.5 group-hover:scale-105 group-active:scale-95 group-focus-visible:ring-4 group-focus-visible:ring-orange-500/70" style={{ borderRadius: 29 }}>
              <OrgIcon org={o} size={132} />
            </span>
            <span className="text-sm font-semibold tracking-[0.22em] text-slate-400 transition-colors group-hover:text-white">{o.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
