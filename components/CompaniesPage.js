"use client";
import { useState } from "react";
import { X, Star, Phone, MapPin, Plus } from "lucide-react";
import { StatusBadge, StarRow } from "./Shared";
import { addCompany } from "@/lib/api";

const emptyForm = { name: "", contact: "", phone: "", email: "", category: "", address: "", quality: 3, timing: 3, price: 3, comm: 3, note: "" };

export default function CompaniesPage({ data, projectId, profile, onMutated }) {
  const { companies, workItems, quotes } = data;
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addCompany(projectId, form, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Firma
        </button>
      </div>

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
        {companies.length === 0 && <p className="text-sm text-slate-400 md:col-span-2 xl:col-span-3 text-center py-8">Henüz firma eklenmedi.</p>}
      </div>

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

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Firma</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Firma Adı *</span>
                <input value={form.name} onChange={set("name")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Yetkili</span>
                  <input value={form.contact} onChange={set("contact")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Kategori</span>
                  <input value={form.category} onChange={set("category")} placeholder="Örn: Elektrik" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Telefon</span>
                  <input value={form.phone} onChange={set("phone")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">E-posta</span>
                  <input value={form.email} onChange={set("email")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">Adres</span>
                <input value={form.address} onChange={set("address")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Not</span>
                <textarea value={form.note} onChange={set("note")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.name.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Kaydediliyor…" : "Firmayı Ekle"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
