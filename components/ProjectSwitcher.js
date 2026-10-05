"use client";
import { useState } from "react";
import { ChevronDown, Plus, X, Building2, Check, Trash2 } from "lucide-react";
import { createProject, deleteProject } from "@/lib/api";

const STATUS_OPTIONS = ["Hazırlık", "Projelendirme", "İhale", "Şantiye Başlangıcı", "İnşaat Devam Ediyor", "Son İmalatlar", "Teslim", "Tamamlandı"];

const emptyForm = {
  name: "", owner: "", address: "", landArea: "", constructionArea: "",
  manager: "", startDate: "", plannedEnd: "", status: "Hazırlık",
};

export function ProjectFormFields({ form, set }) {
  return (
    <div className="space-y-3 text-sm">
      <label className="block"><span className="text-xs text-slate-500">Proje Adı *</span>
        <input value={form.name} onChange={set("name")} placeholder="Örn: 40 Dairelik Konut Projesi" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-slate-500">İşveren</span>
          <input value={form.owner} onChange={set("owner")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
        <label className="block"><span className="text-xs text-slate-500">Proje Müdürü</span>
          <input value={form.manager} onChange={set("manager")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
      </div>
      <label className="block"><span className="text-xs text-slate-500">Adres</span>
        <input value={form.address} onChange={set("address")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-slate-500">Toplam Arsa Alanı</span>
          <input value={form.landArea} onChange={set("landArea")} placeholder="Örn: 5.000 m²" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
        <label className="block"><span className="text-xs text-slate-500">Toplam İnşaat Alanı</span>
          <input value={form.constructionArea} onChange={set("constructionArea")} placeholder="Örn: 12.000 m²" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-slate-500">Başlangıç Tarihi</span>
          <input type="date" value={form.startDate} onChange={set("startDate")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
        <label className="block"><span className="text-xs text-slate-500">Planlanan Bitiş</span>
          <input type="date" value={form.plannedEnd} onChange={set("plannedEnd")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
      </div>
      <label className="block"><span className="text-xs text-slate-500">Proje Durumu</span>
        <select value={form.status} onChange={set("status")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select></label>
    </div>
  );
}

export function useProjectForm(initial) {
  const [form, setForm] = useState(initial || emptyForm);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  return [form, set, setForm];
}

export default function ProjectSwitcher({ orgId, projects, currentProjectId, onSwitch, onCreated, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, set, setForm] = useProjectForm(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const current = projects.find((p) => p.id === currentProjectId);

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const newId = await createProject(orgId, form);
      setForm(emptyForm);
      setShowNewForm(false);
      setOpen(false);
      await onCreated(newId);
    } catch (e) {
      alert("Proje oluşturulamadı: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, project) => {
    e.stopPropagation();
    if (!window.confirm(`"${project.name}" projesini ve TÜM verilerini (iş kalemleri, firmalar, teklifler, evraklar, fotoğraflar...) kalıcı olarak silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ.`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      await onDeleted(project.id);
    } catch (err) {
      alert("Silinemedi: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-md px-2 py-1.5 truncate max-w-[220px]">
        <Building2 size={15} className="text-slate-400 shrink-0" />
        <span className="truncate">{current?.name || "Proje seçin"}</span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1.5 max-h-96 overflow-y-auto">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => { onSwitch(p.id); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 text-left cursor-pointer group"
              >
                <span className="truncate text-slate-700 flex-1">{p.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {p.id === currentProjectId && <Check size={14} className="text-orange-600" />}
                  <button
                    onClick={(e) => handleDelete(e, p)}
                    disabled={deletingId === p.id}
                    className="text-slate-300 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Projeyi sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setShowNewForm(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 text-left font-medium"
              >
                <Plus size={14} /> Yeni Proje
              </button>
            </div>
          </div>
        </>
      )}

      {showNewForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Proje Oluştur</h3>
              <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5">
              <ProjectFormFields form={form} set={set} />
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowNewForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.name.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Oluşturuluyor…" : "Projeyi Oluştur"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
