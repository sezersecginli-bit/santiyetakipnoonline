"use client";
import { useState } from "react";
import { X, Star, Phone, MapPin } from "lucide-react";
import { StatusBadge, StarRow } from "./Shared";

export default function CompaniesPage({ data }) {
  const { companies, workItems, quotes } = data;
  const [selected, setSelected] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {companies.map((c) => {
        const relatedWork = workItems.filter((w) => w.company === c.name);
        const relatedQuotes = quotes.filter((q) => q.bids.some((b) => b.company === c.name));
        return (
          <button key={c.id} onClick={() => setSelected(c)} className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-400">{c.category}</div>
              </div>
              <div className="flex items-center gap-0.5 text-xs text-orange-600 font-medium">
                <Star size={13} className="fill-orange-400 text-orange-400" />
                {((c.quality + c.timing + c.price + c.comm) / 4).toFixed(1)}
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-500 mb-3">
              <div className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</div>
              <div className="flex items-center gap-1.5"><MapPin size={12} /> {c.address}</div>
            </div>
            <div className="flex gap-3 text-xs text-slate-400 pt-2 border-t border-slate-50">
              <span>{relatedWork.length} iş kalemi</span>
              <span>{relatedQuotes.length} teklif</span>
            </div>
          </button>
        );
      })}

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-slate-400">Yetkili</div><div className="font-medium">{selected.contact}</div></div>
                <div><div className="text-xs text-slate-400">Kategori</div><div className="font-medium">{selected.category}</div></div>
                <div><div className="text-xs text-slate-400">Telefon</div><div className="font-medium">{selected.phone}</div></div>
                <div><div className="text-xs text-slate-400">E-posta</div><div className="font-medium">{selected.email}</div></div>
                <div className="col-span-2"><div className="text-xs text-slate-400">Adres</div><div className="font-medium">{selected.address}</div></div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-medium text-slate-500 mb-1">PERFORMANS</div>
                <StarRow label="İş Kalitesi" value={selected.quality} />
                <StarRow label="Termin Performansı" value={selected.timing} />
                <StarRow label="Fiyat" value={selected.price} />
                <StarRow label="İletişim" value={selected.comm} />
              </div>
              {selected.note && <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-2.5">{selected.note}</p>}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-2">İLİŞKİLİ İŞ KALEMLERİ</div>
                {workItems.filter((w) => w.company === selected.name).map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-slate-600">{w.name}</span>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
