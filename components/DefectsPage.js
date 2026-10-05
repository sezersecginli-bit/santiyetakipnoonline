"use client";
import { useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { EmptyRow } from "./Shared";
import { fmtDate, todayISO } from "@/lib/helpers";
import { addDefect, updateDefectStatus } from "@/lib/api";

const emptyForm = { block: "", apt: "", room: "", title: "", assignedTo: "", dueDate: "" };

export default function DefectsPage({ data, projectId, profile, onMutated }) {
  const { defects, blocks, companies } = data;
  const [filterBlock, setFilterBlock] = useState("Tümü");
  const [filterStatus, setFilterStatus] = useState("Açık");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const blockNames = ["Tümü", ...new Set(defects.map((d) => d.block).filter(Boolean))];
  const filtered = defects.filter((d) =>
    (filterBlock === "Tümü" || d.block === filterBlock) &&
    (filterStatus === "Tümü" || d.status === filterStatus)
  );

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!form.block.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      await addDefect(projectId, form, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (d) => {
    const next = d.status === "Açık" ? "Kapandı" : "Açık";
    try {
      await updateDefectStatus(projectId, d, next, profile?.full_name || "Bilinmiyor");
      await onMutated();
    } catch (e) {
      alert("Güncellenemedi: " + e.message);
    }
  };

  const openCount = defects.filter((d) => d.status === "Açık").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          {blockNames.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option><option>Açık</option><option>Kapandı</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} kayıt · {openCount} açık</span>
        <button onClick={() => setShowForm(true)} className="ml-auto inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Eksik
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((d) => (
          <div key={d.id} className={`bg-white border rounded-lg p-3.5 flex items-center gap-3 ${d.status === "Açık" ? "border-red-100" : "border-slate-200"}`}>
            {d.status === "Açık" && <AlertTriangle size={16} className="text-red-500 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800 truncate">{d.block} {d.apt && `· ${d.apt}`} {d.room && `· ${d.room}`}</div>
              <div className="text-xs text-slate-500 truncate">{d.title}</div>
              <div className="text-xs text-slate-400 truncate">{d.assignedTo || "Atanmamış"} {d.dueDate ? `· Son: ${fmtDate(d.dueDate)}` : ""}</div>
            </div>
            <button
              onClick={() => toggleStatus(d)}
              className={`text-xs font-medium px-2.5 py-1 rounded border shrink-0 hover:opacity-75 transition-opacity ${d.status === "Açık" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
            >
              {d.status}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <EmptyRow text="Filtreye uygun eksik kaydı yok" />}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Eksik Kaydı</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Blok *</span>
                  <input list="block-list" value={form.block} onChange={set("block")} placeholder="Blok A" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                  <datalist id="block-list">{blocks.map((b) => <option key={b.id} value={b.name} />)}</datalist>
                </label>
                <label className="block"><span className="text-xs text-slate-500">Daire</span>
                  <input value={form.apt} onChange={set("apt")} placeholder="Daire 24" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Mahal</span>
                  <input value={form.room} onChange={set("room")} placeholder="Banyo" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">Eksik Açıklaması *</span>
                <textarea value={form.title} onChange={set("title")} rows={2} placeholder="Örn: Seramik derzi eksik." className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Atanan Firma</span>
                  <input list="company-list" value={form.assignedTo} onChange={set("assignedTo")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                  <datalist id="company-list">{companies.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                </label>
                <label className="block"><span className="text-xs text-slate-500">Son Tarih</span>
                  <input type="date" value={form.dueDate} onChange={set("dueDate")} min={todayISO()} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.block.trim() || !form.title.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Kaydediliyor…" : "Eksiği Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
