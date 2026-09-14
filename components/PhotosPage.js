"use client";
import { useState, useMemo } from "react";
import { Camera, Plus, X, UploadCloud } from "lucide-react";
import { SectionCard, EmptyRow } from "./Shared";
import { todayISO, fmtDate } from "@/lib/helpers";
import { addPhoto } from "@/lib/api";

const emptyForm = { date: todayISO(), block: "Tüm Bloklar", floor: "-", apt: "-", room: "-", workItem: "", phase: "Öncesi", desc: "" };

function PhotoThumb({ photo }) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
      {photo.imageUrl ? (
        <img src={photo.imageUrl} alt={photo.desc} className="w-full h-32 object-cover" />
      ) : (
        <div className={`w-full h-32 flex items-center justify-center ${photo.phase === "Öncesi" ? "bg-slate-100" : "bg-emerald-50"}`}>
          <Camera size={22} className={photo.phase === "Öncesi" ? "text-slate-300" : "text-emerald-300"} />
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${photo.phase === "Öncesi" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{photo.phase}</span>
          <span className="text-[10px] text-slate-400">{fmtDate(photo.date)}</span>
        </div>
        <div className="text-xs font-medium text-slate-700 truncate">{photo.workItem || "—"}</div>
        <div className="text-[11px] text-slate-400 truncate">{photo.block} {photo.apt !== "-" ? `· ${photo.apt}` : ""} {photo.room !== "-" ? `· ${photo.room}` : ""}</div>
        {photo.desc && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{photo.desc}</p>}
      </div>
    </div>
  );
}

export default function PhotosPage({ data, projectId, profile, onMutated }) {
  const { photos, blocks } = data;
  const [filterBlock, setFilterBlock] = useState("Tümü");
  const [compareMode, setCompareMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const blockOptions = ["Tümü", ...new Set(photos.map((p) => p.block))];
  const filtered = filterBlock === "Tümü" ? photos : photos.filter((p) => p.block === filterBlock);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      const key = p.workItem || "Diğer";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtered]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!file && !form.desc.trim()) return;
    setSaving(true);
    try {
      await addPhoto(projectId, form, file, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setForm(emptyForm);
      setFile(null);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message + "\nSupabase Storage'da 'photos' adında bir bucket oluşturduğunuzdan emin olun.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          {blockOptions.map((b) => <option key={b}>{b}</option>)}
        </select>
        <button onClick={() => setCompareMode((c) => !c)} className={`text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors ${compareMode ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          Öncesi / Sonrası Karşılaştırma
        </button>
        <span className="text-xs text-slate-400">{filtered.length} fotoğraf</span>
        <button onClick={() => setShowForm(true)} className="ml-auto inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Fotoğraf Ekle
        </button>
      </div>

      {compareMode ? (
        <div className="space-y-5">
          {Object.entries(grouped).map(([workItem, pics]) => {
            const before = pics.find((p) => p.phase === "Öncesi");
            const after = pics.find((p) => p.phase === "Sonrası");
            if (!before && !after) return null;
            return (
              <SectionCard key={workItem} title={workItem}>
                <div className="grid grid-cols-2 gap-3">
                  <div>{before ? <PhotoThumb photo={before} /> : <div className="h-32 flex items-center justify-center text-xs text-slate-300 border border-dashed border-slate-200 rounded-lg">Öncesi fotoğrafı yok</div>}</div>
                  <div>{after ? <PhotoThumb photo={after} /> : <div className="h-32 flex items-center justify-center text-xs text-slate-300 border border-dashed border-slate-200 rounded-lg">Sonrası fotoğrafı yok</div>}</div>
                </div>
              </SectionCard>
            );
          })}
          {Object.keys(grouped).length === 0 && <EmptyRow text="Fotoğraf yok" />}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => <PhotoThumb key={p.id} photo={p} />)}
          {filtered.length === 0 && <div className="col-span-full"><EmptyRow text="Fotoğraf yok" /></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Fotoğraf Kaydı</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="border border-dashed border-slate-300 rounded-md p-3 text-center">
                <label className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-500">
                  <UploadCloud size={20} />
                  <span className="text-xs">{file ? file.name : "Telefondan / bilgisayardan fotoğraf seç"}</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Tarih</span>
                  <input type="date" value={form.date} onChange={set("date")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Aşama</span>
                  <select value={form.phase} onChange={set("phase")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    <option>Öncesi</option><option>Sonrası</option>
                  </select></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">Blok</span>
                <select value={form.block} onChange={set("block")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                  <option>Tüm Bloklar</option>{blocks.map((b) => <option key={b.id}>{b.name}</option>)}
                </select></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Kat / Daire</span>
                  <input value={form.apt} onChange={set("apt")} placeholder="Daire 12" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Mahal</span>
                  <input value={form.room} onChange={set("room")} placeholder="Banyo" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">İlgili İş</span>
                <input value={form.workItem} onChange={set("workItem")} placeholder="Örn: Blok A Duvar İmalatı" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Açıklama</span>
                <textarea value={form.desc} onChange={set("desc")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Yükleniyor…" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
