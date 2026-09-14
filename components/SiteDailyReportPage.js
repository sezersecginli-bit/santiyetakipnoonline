"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, X, Plus } from "lucide-react";
import { EmptyRow } from "./Shared";
import { todayISO, fmtDate } from "@/lib/helpers";
import { addSiteReport } from "@/lib/api";

const emptyForm = {
  date: todayISO(), weather: "", crews: "", totalWorkers: "", done: "", planned: "",
  materialsIn: "", materialsOut: "", issues: "", accident: "Yok", notes: "",
};

export default function SiteDailyReportPage({ data, projectId, profile, onMutated }) {
  const { siteReports } = data;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(siteReports[0]?.id || null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!form.date || !form.done.trim()) return;
    setSaving(true);
    try {
      await addSiteReport(projectId, form, profile?.full_name || "Bilinmiyor");
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{siteReports.length} günlük rapor kaydı</p>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Günlük Rapor
        </button>
      </div>

      <div className="space-y-3">
        {siteReports.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(isOpen ? null : r.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3 text-left">
                  {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                  <div>
                    <div className="font-medium text-sm text-slate-800">{fmtDate(r.date)}</div>
                    <div className="text-xs text-slate-400">{r.weather} · {r.totalWorkers} kişi · Raporlayan: {r.reporter}</div>
                  </div>
                </div>
                {r.accident && r.accident !== "Yok" ? (
                  <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5">İş kazası bildirildi</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">Kazasız</span>
                )}
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-3 text-sm">
                  <div><div className="text-xs font-medium text-slate-400 mb-0.5">ÇALIŞAN EKİPLER</div><p className="text-slate-600">{r.crews || "—"}</p></div>
                  <div><div className="text-xs font-medium text-slate-400 mb-0.5">YAPILAN İŞLER</div><p className="text-slate-600">{r.done}</p></div>
                  <div><div className="text-xs font-medium text-slate-400 mb-0.5">YAPILACAK İŞLER</div><p className="text-slate-600">{r.planned || "—"}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs font-medium text-slate-400 mb-0.5">GELEN MALZEMELER</div><p className="text-slate-600">{r.materialsIn || "—"}</p></div>
                    <div><div className="text-xs font-medium text-slate-400 mb-0.5">GİDEN MALZEMELER</div><p className="text-slate-600">{r.materialsOut || "—"}</p></div>
                  </div>
                  <div><div className="text-xs font-medium text-slate-400 mb-0.5">SORUNLAR</div><p className="text-slate-600">{r.issues || "—"}</p></div>
                  {r.notes && <div><div className="text-xs font-medium text-slate-400 mb-0.5">NOTLAR</div><p className="text-slate-600">{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
        {siteReports.length === 0 && <EmptyRow text="Henüz günlük rapor girilmedi" />}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Şantiye Günlük Raporu</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Tarih</span>
                  <input type="date" value={form.date} onChange={set("date")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Hava Durumu</span>
                  <input value={form.weather} onChange={set("weather")} placeholder="Güneşli, 24°C" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">Şantiyedeki Firmalar / Taşeronlar</span>
                <input value={form.crews} onChange={set("crews")} placeholder="ABC İnşaat (10 kişi)" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Toplam Çalışan Sayısı</span>
                <input type="number" value={form.totalWorkers} onChange={set("totalWorkers")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Yapılan İşler *</span>
                <textarea value={form.done} onChange={set("done")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Yapılacak İşler</span>
                <textarea value={form.planned} onChange={set("planned")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Gelen Malzemeler</span>
                  <textarea value={form.materialsIn} onChange={set("materialsIn")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Giden Malzemeler</span>
                  <textarea value={form.materialsOut} onChange={set("materialsOut")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">Sorunlar</span>
                <textarea value={form.issues} onChange={set("issues")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">İş Kazası</span>
                <select value={form.accident} onChange={set("accident")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                  <option>Yok</option><option>Var — hafif</option><option>Var — ciddi</option>
                </select></label>
              <label className="block"><span className="text-xs text-slate-500">Notlar</span>
                <textarea value={form.notes} onChange={set("notes")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.done.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Kaydediliyor…" : "Raporu Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
