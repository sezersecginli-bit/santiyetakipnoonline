"use client";
import { useState } from "react";
import { FolderOpen, Link2, Plus, X, UploadCloud } from "lucide-react";
import { EmptyRow } from "./Shared";
import { DOCUMENT_CATEGORIES, todayISO, fmtDate } from "@/lib/helpers";
import { addDocument } from "@/lib/api";

const emptyForm = { name: "", category: "Diğer", relatedTo: "", block: "Tüm Bloklar", date: todayISO(), link: "", note: "" };

export default function DocumentsPage({ data, projectId, profile, onMutated }) {
  const { documents } = data;
  const [filterCat, setFilterCat] = useState("Tümü");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = documents.filter((d) =>
    (filterCat === "Tümü" || d.category === filterCat) &&
    (q.trim() === "" || d.name.toLowerCase().includes(q.toLowerCase()) || (d.relatedTo || "").toLowerCase().includes(q.toLowerCase()))
  );

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addDocument(projectId, form, file, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setForm(emptyForm);
      setFile(null);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message + "\nSupabase Storage'da 'documents' adında bir bucket oluşturduğunuzdan emin olun.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>{DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Belge ara…" className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white w-48" />
        <span className="text-xs text-slate-400">{filtered.length} belge</span>
        <button onClick={() => setShowForm(true)} className="ml-auto inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Belge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0"><FolderOpen size={16} className="text-slate-400" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800 truncate">{d.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{d.category} · {d.relatedTo} · {d.block}</div>
              <div className="text-xs text-slate-400">{fmtDate(d.date)} · {d.uploadedBy}</div>
              {d.note && <p className="text-xs text-slate-500 mt-1">{d.note}</p>}
              {d.link && <a href={d.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline mt-1"><Link2 size={12} /> Belgeyi Aç</a>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="md:col-span-2"><EmptyRow text="Belge bulunamadı" /></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Belge Kaydı</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Belge Adı *</span>
                <input value={form.name} onChange={set("name")} placeholder="Örn: Elektrik Projesi Rev.2.pdf" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Kategori</span>
                  <select value={form.category} onChange={set("category")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select></label>
                <label className="block"><span className="text-xs text-slate-500">Blok</span>
                  <input value={form.block} onChange={set("block")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">İlgili (İş / Firma / Proje)</span>
                <input value={form.relatedTo} onChange={set("relatedTo")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>

              <div className="border border-dashed border-slate-300 rounded-md p-3 text-center">
                <label className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-500">
                  <UploadCloud size={20} />
                  <span className="text-xs">{file ? file.name : "Dosya seç (PDF, Word, Excel, resim…)"}</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">veya Belge Linki (opsiyonel)</span>
                <input value={form.link} onChange={set("link")} placeholder="https://drive.google.com/…" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" disabled={!!file} /></label>

              <label className="block"><span className="text-xs text-slate-500">Not</span>
                <textarea value={form.note} onChange={set("note")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.name.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Yükleniyor…" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
