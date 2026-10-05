"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, X, Pencil } from "lucide-react";
import { SectionCard } from "./Shared";
import { fmtDate } from "@/lib/helpers";
import { updateProject, addBlock, addBlockWithStructure, addFloor, addApartment, deleteProject } from "@/lib/api";
import { ProjectFormFields, useProjectForm } from "./ProjectSwitcher";

export default function ProjectPage({ data, projectId, profile, onMutated, onProjectDeleted }) {
  const { project, blocks } = data;
  const [expanded, setExpanded] = useState({ [blocks[0]?.id]: true });
  const [editing, setEditing] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockName, setBlockName] = useState("");
  const [floorCount, setFloorCount] = useState(5);
  const [aptsPerFloor, setAptsPerFloor] = useState(4);
  const [includeGround, setIncludeGround] = useState(true);
  const [addingFloorFor, setAddingFloorFor] = useState(null); // block id
  const [addingAptFor, setAddingAptFor] = useState(null); // floor id
  const [newName, setNewName] = useState("");
  const [newProgress, setNewProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const [editForm, setEdit] = useProjectForm({
    name: project?.name || "", owner: project?.owner || "", address: project?.address || "",
    landArea: project?.landArea || "", constructionArea: project?.constructionArea || "",
    manager: project?.manager || "", startDate: project?.startDate || "", plannedEnd: project?.plannedEnd || "",
    status: project?.status || "Hazırlık",
  });

  if (!project) return <div className="text-sm text-slate-400">Proje bulunamadı.</div>;

  const saveProject = async () => {
    setSaving(true);
    try {
      await updateProject(projectId, editForm);
      await onMutated();
      setEditing(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`"${project.name}" projesini ve TÜM verilerini (iş kalemleri, firmalar, teklifler, evraklar, fotoğraflar...) kalıcı olarak silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ.`)) return;
    setSaving(true);
    try {
      await deleteProject(projectId);
      setEditing(false);
      await onProjectDeleted(projectId);
    } catch (e) {
      alert("Silinemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitBlock = async () => {
    if (!blockName.trim()) return;
    const fc = Number(floorCount) || 0;
    const apf = Number(aptsPerFloor) || 0;
    setSaving(true);
    try {
      if (fc > 0 && apf > 0) {
        await addBlockWithStructure(projectId, blockName, fc, apf, includeGround, blocks.length, profile?.full_name || "Bilinmiyor");
      } else {
        await addBlock(projectId, blockName, blocks.length);
      }
      await onMutated();
      setBlockName("");
      setFloorCount(5);
      setAptsPerFloor(4);
      setIncludeGround(true);
      setAddingBlock(false);
    } catch (e) {
      alert("Eklenemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitFloor = async (blockId, sortOrder) => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await addFloor(blockId, newName, sortOrder);
      await onMutated();
      setNewName("");
      setAddingFloorFor(null);
    } catch (e) {
      alert("Eklenemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitApartment = async (floorId) => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await addApartment(floorId, newName, newProgress);
      await onMutated();
      setNewName("");
      setNewProgress(0);
      setAddingAptFor(null);
    } catch (e) {
      alert("Eklenemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Proje Bilgileri"
        action={<button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline"><Pencil size={12} /> Düzenle</button>}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
          {[
            ["Proje Adı", project.name], ["İşveren", project.owner], ["Proje Adresi", project.address],
            ["Toplam Arsa Alanı", project.landArea], ["Toplam İnşaat Alanı", project.constructionArea],
            ["Blok Sayısı", blocks.length], ["Daire Sayısı", blocks.flatMap((b) => b.floors.flatMap((f) => f.apartments)).length],
            ["Başlangıç Tarihi", fmtDate(project.startDate)], ["Planlanan Bitiş", fmtDate(project.plannedEnd)],
            ["Proje Müdürü", project.manager],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-xs text-slate-400 mb-0.5">{label}</div>
              <div className="font-medium text-slate-800">{val || "—"}</div>
            </div>
          ))}
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Proje Durumu</div>
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">{project.status}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Blok / Kat / Daire Hiyerarşisi"
        action={<button onClick={() => setAddingBlock(true)} className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline"><Plus size={12} /> Blok Ekle</button>}
      >
        <div className="space-y-2">
          {blocks.map((block) => {
            const apts = block.floors.flatMap((f) => f.apartments);
            const avg = apts.length ? Math.round(apts.reduce((s, a) => s + a.progress, 0) / apts.length) : 0;
            return (
              <div key={block.id} className="border border-slate-100 rounded-lg overflow-hidden">
                <button onClick={() => toggle(block.id)} className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    {expanded[block.id] ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                    <span className="font-medium text-sm text-slate-800">{block.name}</span>
                    <span className="text-xs text-slate-400">({apts.length} daire)</span>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${avg}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">%{avg}</span>
                  </div>
                </button>
                {expanded[block.id] && (
                  <div className="px-3 py-2 divide-y divide-slate-50">
                    {block.floors.map((floor) => (
                      <div key={floor.id} className="py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-xs font-medium text-slate-500">{floor.name}</div>
                          <button onClick={() => { setAddingAptFor(floor.id); setNewName(""); setNewProgress(0); }} className="text-[11px] text-orange-600 hover:underline flex items-center gap-0.5">
                            <Plus size={11} /> Daire Ekle
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {floor.apartments.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1.5">
                              <span className="text-slate-600">{apt.name}</span>
                              <span className={`font-medium ${apt.progress >= 100 ? "text-emerald-600" : apt.progress >= 60 ? "text-blue-600" : "text-amber-600"}`}>%{apt.progress}</span>
                            </div>
                          ))}
                          {addingAptFor === floor.id && (
                            <div className="flex items-center gap-1 bg-white border border-orange-200 rounded px-2 py-1.5 col-span-2">
                              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Daire 01" className="w-full text-xs border-0 focus:outline-none" onKeyDown={(e) => e.key === "Enter" && submitApartment(floor.id)} />
                              <input value={newProgress} onChange={(e) => setNewProgress(e.target.value)} type="number" placeholder="%0" className="w-12 text-xs border-0 focus:outline-none" />
                              <button onClick={() => submitApartment(floor.id)} disabled={saving} className="text-emerald-600 text-xs font-medium shrink-0">Ekle</button>
                              <button onClick={() => setAddingAptFor(null)} className="text-slate-400 shrink-0"><X size={12} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      {addingFloorFor === block.id ? (
                        <div className="flex items-center gap-1.5">
                          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Örn: 5. Kat" className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5" onKeyDown={(e) => e.key === "Enter" && submitFloor(block.id, block.floors.length)} />
                          <button onClick={() => submitFloor(block.id, block.floors.length)} disabled={saving} className="text-xs text-emerald-600 font-medium">Ekle</button>
                          <button onClick={() => setAddingFloorFor(null)} className="text-slate-400"><X size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingFloorFor(block.id); setNewName(""); }} className="text-[11px] text-orange-600 hover:underline flex items-center gap-0.5">
                          <Plus size={11} /> Kat Ekle
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {blocks.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Henüz blok eklenmedi.</p>}
        </div>
      </SectionCard>

      {addingBlock && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setAddingBlock(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Yeni Blok Oluştur</h3>
              <button onClick={() => setAddingBlock(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Blok Adı *</span>
                <input autoFocus value={blockName} onChange={(e) => setBlockName(e.target.value)} placeholder="Örn: Blok D" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Kat Sayısı</span>
                  <input type="number" min="0" value={floorCount} onChange={(e) => setFloorCount(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                </label>
                <label className="block"><span className="text-xs text-slate-500">Kat Başına Daire</span>
                  <input type="number" min="0" value={aptsPerFloor} onChange={(e) => setAptsPerFloor(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={includeGround} onChange={(e) => setIncludeGround(e.target.checked)} className="rounded border-slate-300" />
                İlk kat "Zemin Kat" olsun
              </label>
              {Number(floorCount) > 0 && Number(aptsPerFloor) > 0 && (
                <div className="text-xs bg-orange-50 text-orange-700 border border-orange-100 rounded-md px-3 py-2">
                  {floorCount} kat × {aptsPerFloor} daire = <b>{Number(floorCount) * Number(aptsPerFloor)} daire</b> otomatik oluşturulacak.
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setAddingBlock(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submitBlock} disabled={saving || !blockName.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Oluşturuluyor…" : "Bloğu Oluştur"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Proje Bilgilerini Düzenle</h3>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5">
              <ProjectFormFields form={editForm} set={setEdit} />
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                <button onClick={handleDeleteProject} disabled={saving} className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50">
                  Bu Projeyi Sil
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                  <button onClick={saveProject} disabled={saving} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
