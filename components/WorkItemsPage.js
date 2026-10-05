"use client";
import { useState } from "react";
import { X, Plus, Pencil, Trash2, LayoutTemplate } from "lucide-react";
import { StatusBadge, PriorityDot, EmptyRow } from "./Shared";
import { WORK_STATUS, CATEGORY_GROUPS, fmtTL, fmtDate } from "@/lib/helpers";
import { addWorkItem, updateWorkItem, deleteWorkItem, deleteWorkItems, addStandardWorkItemTemplate } from "@/lib/api";

const emptyForm = {
  name: "", category: "Şantiye", sub: "", block: "", floor: "", apt: "", room: "",
  responsible: "", company: "", start: "", end: "", plannedDays: "", status: "Yapılacak",
  priority: "Normal", estCost: "", actCost: "", desc: "",
};

const toForm = (w) => ({
  name: w.name || "", category: w.category || "Şantiye", sub: w.sub || "",
  block: w.block === "-" ? "" : (w.block || ""), floor: w.floor === "-" ? "" : (w.floor || ""),
  apt: w.apt === "-" ? "" : (w.apt || ""), room: w.room === "-" ? "" : (w.room || ""),
  responsible: w.responsible === "-" ? "" : (w.responsible || ""), company: w.company === "-" ? "" : (w.company || ""),
  start: w.start || "", end: w.end || "", plannedDays: w.plannedDays || "", status: w.status || "Yapılacak",
  priority: w.priority || "Normal", estCost: w.estCost || "", actCost: w.actCost || "", desc: w.desc || "",
});

export default function WorkItemsPage({ data, projectId, profile, onMutated }) {
  const { workItems, blocks } = data;
  const [filterBlock, setFilterBlock] = useState("Tümü");
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [filterCat, setFilterCat] = useState("Tümü");
  const [selected, setSelected] = useState(null); // görüntülenen (detay)
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = yeni ekleme, obje = düzenleme
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const blockNames = ["Tümü", ...new Set(workItems.map((w) => w.block))];
  const blockOptionsForForm = ["Tüm Bloklar", ...blocks.map((b) => b.name)];

  const filtered = workItems.filter((w) =>
    (filterBlock === "Tümü" || w.block === filterBlock) &&
    (filterStatus === "Tümü" || w.status === filterStatus) &&
    (filterCat === "Tümü" || w.category === filterCat)
  );

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openCreateForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (e, w) => {
    e.stopPropagation();
    setEditingItem(w);
    setForm(toForm(w));
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await updateWorkItem(projectId, editingItem.id, form, profile?.full_name || "Bilinmiyor");
      } else {
        await addWorkItem(projectId, form, profile?.full_name || "Bilinmiyor");
      }
      await onMutated();
      setForm(emptyForm);
      setEditingItem(null);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, w) => {
    e.stopPropagation();
    if (!window.confirm(`"${w.name}" iş kalemini kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteWorkItem(projectId, w, profile?.full_name || "Bilinmiyor");
      await onMutated();
      if (selected?.id === w.id) setSelected(null);
    } catch (e2) {
      alert("Silinemedi: " + e2.message);
    }
  };

  const applyTemplate = async () => {
    if (!window.confirm("Standart bir inşaat için gerekli tüm iş kalemleri (proje ve şantiye kategorilerinden) listeye eklenecek. Devam edilsin mi?")) return;
    setApplyingTemplate(true);
    try {
      const count = await addStandardWorkItemTemplate(projectId, profile?.full_name || "Bilinmiyor");
      await onMutated();
      if (count === 0) alert("Tüm standart kalemler zaten listenizde mevcut.");
      else alert(`${count} yeni iş kalemi eklendi. Her birini düzenleyerek blok, sorumlu, firma ve tarih atayabilirsiniz.`);
    } catch (e) {
      alert("Eklenemedi: " + e.message);
    } finally {
      setApplyingTemplate(false);
    }
  };

  const toggleCheck = (id) => {
    setCheckedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const toggleCheckAll = () => {
    const visibleIds = filtered.map((w) => w.id);
    const allChecked = visibleIds.length > 0 && visibleIds.every((id) => checkedIds.includes(id));
    setCheckedIds(allChecked ? checkedIds.filter((id) => !visibleIds.includes(id)) : [...new Set([...checkedIds, ...visibleIds])]);
  };

  const bulkDelete = async () => {
    if (checkedIds.length === 0) return;
    if (!window.confirm(`${checkedIds.length} iş kalemini kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    setBulkDeleting(true);
    try {
      const items = workItems.filter((w) => checkedIds.includes(w.id));
      await deleteWorkItems(projectId, items, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setCheckedIds([]);
    } catch (e) {
      alert("Silinemedi: " + e.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          {blockNames.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>
          <option>Proje</option>
          <option>Şantiye</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>
          {WORK_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400 self-center">{filtered.length} iş kalemi</span>
        {checkedIds.length > 0 && (
          <button onClick={bulkDelete} disabled={bulkDeleting} className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
            <Trash2 size={13} /> {bulkDeleting ? "Siliniyor…" : `Seçilenleri Sil (${checkedIds.length})`}
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={applyTemplate} disabled={applyingTemplate} className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50">
            <LayoutTemplate size={14} /> {applyingTemplate ? "Ekleniyor…" : "Standart Şablonu Ekle"}
          </button>
          <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
            <Plus size={14} /> Yeni İş Kalemi
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[880px]">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((w) => checkedIds.includes(w.id))}
                  onChange={toggleCheckAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="text-left font-medium px-3 py-2.5">İş Adı</th>
              <th className="text-left font-medium px-3 py-2.5">Blok</th>
              <th className="text-left font-medium px-3 py-2.5">Firma</th>
              <th className="text-left font-medium px-3 py-2.5">Sorumlu</th>
              <th className="text-left font-medium px-3 py-2.5">Bitiş</th>
              <th className="text-left font-medium px-3 py-2.5">Öncelik</th>
              <th className="text-left font-medium px-3 py-2.5">Durum</th>
              <th className="text-right font-medium px-3 py-2.5">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} onClick={() => setSelected(w)} className="border-t border-slate-50 hover:bg-orange-50/40 cursor-pointer">
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.includes(w.id)} onChange={() => toggleCheck(w.id)} className="rounded border-slate-300" />
                </td>
                <td className="px-3 py-2.5 text-slate-800 font-medium">{w.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{w.block}</td>
                <td className="px-3 py-2.5 text-slate-500">{w.company}</td>
                <td className="px-3 py-2.5 text-slate-500">{w.responsible}</td>
                <td className="px-3 py-2.5 text-slate-500">{fmtDate(w.end)}</td>
                <td className="px-3 py-2.5"><PriorityDot priority={w.priority} /></td>
                <td className="px-3 py-2.5"><StatusBadge status={w.status} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => openEditForm(e, w)} className="text-slate-400 hover:text-orange-600 p-1.5 hover:bg-orange-50 rounded" title="Düzenle">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => handleDelete(e, w)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded" title="Sil">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9}><EmptyRow text="Filtreye uygun iş kalemi yok" /></td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{selected.name}</h3>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { setSelected(null); openEditForm(e, selected); }} className="text-slate-400 hover:text-orange-600 p-1.5 hover:bg-orange-50 rounded" title="Düzenle"><Pencil size={15} /></button>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 p-1.5"><X size={18} /></button>
              </div>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex gap-2">
                <StatusBadge status={selected.status} />
                <PriorityDot priority={selected.priority} />
              </div>
              <p className="text-slate-600">{selected.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Kategori", `${selected.category} / ${selected.sub || "—"}`], ["Blok", selected.block],
                  ["Kat", selected.floor], ["Daire", selected.apt], ["Mahal", selected.room],
                  ["Sorumlu", selected.responsible], ["Firma", selected.company],
                  ["Başlangıç", fmtDate(selected.start)], ["Bitiş", fmtDate(selected.end)],
                  ["Planlanan Süre", selected.plannedDays ? `${selected.plannedDays} gün` : "—"],
                  ["Gerçekleşen Süre", selected.actualDays ? `${selected.actualDays} gün` : "—"],
                ].map(([l, v]) => (
                  <div key={l}><div className="text-xs text-slate-400">{l}</div><div className="font-medium text-slate-700">{v}</div></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div><div className="text-xs text-slate-400">Tahmini Maliyet</div><div className="font-medium text-slate-700">{fmtTL(selected.estCost)}</div></div>
                <div><div className="text-xs text-slate-400">Gerçekleşen Maliyet</div><div className="font-medium text-slate-700">{fmtTL(selected.actCost)}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">{editingItem ? "İş Kalemini Düzenle" : "Yeni İş Kalemi"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">İş Adı *</span>
                <input value={form.name} onChange={set("name")} placeholder="Örn: Blok D Duvar İmalatı" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Kategori</span>
                  <select value={form.category} onChange={set("category")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    <option>Proje</option><option>Şantiye</option>
                  </select></label>
                <label className="block"><span className="text-xs text-slate-500">Alt Kategori</span>
                  <input list="sub-categories" value={form.sub} onChange={set("sub")} placeholder="Örn: Duvar" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                  <datalist id="sub-categories">
                    {(CATEGORY_GROUPS[form.category] || []).map((s) => <option key={s} value={s} />)}
                  </datalist>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Blok</span>
                  <input list="block-options" value={form.block} onChange={set("block")} placeholder="Blok A" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                  <datalist id="block-options">{blockOptionsForForm.map((b) => <option key={b} value={b} />)}</datalist>
                </label>
                <label className="block"><span className="text-xs text-slate-500">Kat</span>
                  <input value={form.floor} onChange={set("floor")} placeholder="3. Kat" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Daire</span>
                  <input value={form.apt} onChange={set("apt")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Mahal</span>
                  <input value={form.room} onChange={set("room")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Sorumlu (kişi)</span>
                  <input value={form.responsible} onChange={set("responsible")} placeholder={profile?.full_name} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Atanan Firma</span>
                  <input value={form.company} onChange={set("company")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Başlangıç</span>
                  <input type="date" value={form.start} onChange={set("start")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Bitiş</span>
                  <input type="date" value={form.end} onChange={set("end")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Durum</span>
                  <select value={form.status} onChange={set("status")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    {WORK_STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select></label>
                <label className="block"><span className="text-xs text-slate-500">Öncelik</span>
                  <select value={form.priority} onChange={set("priority")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    <option>Kritik</option><option>Yüksek</option><option>Normal</option><option>Düşük</option>
                  </select></label>
                <label className="block"><span className="text-xs text-slate-500">Tahmini Maliyet</span>
                  <input type="number" value={form.estCost} onChange={set("estCost")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              {editingItem && (
                <label className="block"><span className="text-xs text-slate-500">Gerçekleşen Maliyet</span>
                  <input type="number" value={form.actCost} onChange={set("actCost")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              )}
              <label className="block"><span className="text-xs text-slate-500">Açıklama</span>
                <textarea value={form.desc} onChange={set("desc")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.name.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">
                  {saving ? "Kaydediliyor…" : editingItem ? "Değişiklikleri Kaydet" : "İş Kalemini Ekle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
