"use client";
import { useState } from "react";
import { HardHat, Loader2 } from "lucide-react";
import { createProject } from "@/lib/api";
import { ProjectFormFields, useProjectForm } from "./ProjectSwitcher";

export default function NewProjectScreen({ org, orgId, onCreated }) {
  const [form, set] = useProjectForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const newId = await createProject(orgId, form);
      await onCreated(newId);
    } catch (e) {
      setError("Proje oluşturulamadı: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded bg-orange-500 flex items-center justify-center">
            <HardHat size={18} className="text-slate-950" />
          </div>
          <span className="text-slate-100 font-semibold text-lg tracking-tight">{org?.name || "Şantiye Yönetim Sistemi"}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm mb-1">Henüz hiç proje yok</p>
          <h1 className="text-slate-100 text-xl font-semibold mb-6">İlk projenizi oluşturun</h1>
          <div className="[&_label_span]:text-slate-400 [&_input]:bg-slate-800 [&_input]:border-slate-700 [&_input]:text-slate-100 [&_select]:bg-slate-800 [&_select]:border-slate-700 [&_select]:text-slate-100">
            <ProjectFormFields form={form} set={set} />
          </div>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          <button
            onClick={submit}
            disabled={saving || !form.name.trim()}
            className="w-full mt-5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Projeyi Oluştur ve Başla
          </button>
        </div>
        <p className="text-center text-slate-600 text-xs mt-5">
          Daha sonra üstteki proje seçiciden yeni projeler ekleyip aralarında geçiş yapabilirsiniz.
        </p>
      </div>
    </div>
  );
}
