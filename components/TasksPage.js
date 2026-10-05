"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { PriorityDot, EmptyRow } from "./Shared";
import { fmtDate, todayISO } from "@/lib/helpers";
import { addTask, updateTaskStatus, listTeamMembers } from "@/lib/api";

const TASK_STATUS = ["Yapılacak", "Devam ediyor", "Bekliyor", "Tamamlandı"];
const TASK_STATUS_STYLE = {
  "Yapılacak": "bg-slate-100 text-slate-600 border-slate-200",
  "Devam ediyor": "bg-blue-50 text-blue-700 border-blue-200",
  "Bekliyor": "bg-amber-50 text-amber-700 border-amber-200",
  "Tamamlandı": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const emptyForm = { title: "", assignee: "", start: todayISO(), due: "", priority: "Normal", workItemId: "" };

export default function TasksPage({ data, projectId, profile, onMutated }) {
  const { tasks, workItems } = data;
  const [members, setMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [filterAssignee, setFilterAssignee] = useState("Tümü");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { listTeamMembers().then(setMembers).catch(() => {}); }, []);

  const assignees = ["Tümü", ...new Set(tasks.map((t) => t.assignee).filter(Boolean))];
  const filtered = tasks.filter((t) =>
    (filterStatus === "Tümü" || t.status === filterStatus) &&
    (filterAssignee === "Tümü" || t.assignee === filterAssignee)
  );

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await addTask(projectId, form, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const cycleStatus = async (task) => {
    const idx = TASK_STATUS.indexOf(task.status);
    const next = TASK_STATUS[(idx + 1) % TASK_STATUS.length];
    try {
      await updateTaskStatus(projectId, task, next, profile?.full_name || "Bilinmiyor");
      await onMutated();
    } catch (e) {
      alert("Güncellenemedi: " + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>
          {TASK_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          {assignees.map((a) => <option key={a}>{a}</option>)}
        </select>
        <span className="text-xs text-slate-400 self-center">{filtered.length} görev</span>
        <button onClick={() => setShowForm(true)} className="ml-auto inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Görev
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
            <button
              onClick={() => cycleStatus(t)}
              className={`text-xs font-medium px-2 py-1 rounded border shrink-0 hover:opacity-75 transition-opacity ${TASK_STATUS_STYLE[t.status] || TASK_STATUS_STYLE["Yapılacak"]}`}
              title="Durumu değiştirmek için tıklayın"
            >
              {t.status}
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800 truncate">{t.title}</div>
              <div className="text-xs text-slate-400 truncate">{t.assignee || "Atanmamış"} {t.due ? `· Son: ${fmtDate(t.due)}` : ""}</div>
            </div>
            <PriorityDot priority={t.priority} />
          </div>
        ))}
        {filtered.length === 0 && <EmptyRow text="Filtreye uygun görev yok" />}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Görev</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Görev *</span>
                <input value={form.title} onChange={set("title")} placeholder="Örn: Seramik numunelerini onaya sun" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Sorumlu</span>
                  <input list="member-options" value={form.assignee} onChange={set("assignee")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                  <datalist id="member-options">{members.map((m) => <option key={m.id} value={m.full_name} />)}</datalist>
                </label>
                <label className="block"><span className="text-xs text-slate-500">Öncelik</span>
                  <select value={form.priority} onChange={set("priority")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    <option>Kritik</option><option>Yüksek</option><option>Normal</option><option>Düşük</option>
                  </select></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Başlangıç</span>
                  <input type="date" value={form.start} onChange={set("start")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Son Tarih</span>
                  <input type="date" value={form.due} onChange={set("due")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">İlgili İş Kalemi (opsiyonel)</span>
                <select value={form.workItemId} onChange={set("workItemId")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                  <option value="">—</option>
                  {workItems.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.title.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Kaydediliyor…" : "Görevi Ekle"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
