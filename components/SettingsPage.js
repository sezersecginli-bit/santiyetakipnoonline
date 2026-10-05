"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Users, Palette, Upload } from "lucide-react";
import { SectionCard, EmptyRow } from "./Shared";
import { listTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember, updateOrganization, uploadOrgLogo } from "@/lib/api";
import OrgIcon from "./OrgIcon";

export default function SettingsPage({ orgId, org, bootstrap, currentProfileId, onTeamChanged, onSelfDeleted, menu, onOrgChanged }) {
  const [members, setMembers] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [orgName, setOrgName] = useState(org?.name || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [labels, setLabels] = useState(() => {
    const initial = {};
    (menu || []).forEach((m) => { initial[m.id] = org?.menuLabels?.[m.id] || m.label; });
    return initial;
  });
  const [savingLabels, setSavingLabels] = useState(false);
  const [labelsSaved, setLabelsSaved] = useState(false);

  const setLabel = (id) => (e) => { setLabels((l) => ({ ...l, [id]: e.target.value })); setLabelsSaved(false); };

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Lütfen bir resim dosyası seçin (PNG, JPG, SVG…)."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Logo dosyası 5 MB'den küçük olmalı."); return; }
    setUploadingLogo(true);
    try {
      await uploadOrgLogo(orgId, file);
      await onOrgChanged?.();
    } catch (err) {
      alert("Logo yüklenemedi: " + err.message + "\nSupabase'de 'logos' depolama alanının oluşturulduğundan emin olun (upgrade.sql / schema.sql).");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!window.confirm("Yüklediğiniz logo kaldırılsın mı? (Varsayılan logo geri gelir.)")) return;
    try {
      await updateOrganization(orgId, { logoUrl: "" });
      await onOrgChanged?.();
    } catch (err) {
      alert("Kaldırılamadı: " + err.message);
    }
  };

  const saveAppearance = async () => {
    setSavingLabels(true);
    try {
      await updateOrganization(orgId, { name: orgName.trim() || org?.name || "Organizasyon", menuLabels: labels });
      await onOrgChanged?.();
      setLabelsSaved(true);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSavingLabels(false);
    }
  };

  const load = async () => {
    try {
      const list = await listTeamMembers(orgId);
      setMembers(list);
      setError("");
    } catch (e) {
      setError("Ekip üyeleri yüklenemedi: " + e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditName(m.full_name);
    setEditRole(m.role || "");
    setEditEmail(m.email || "");
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateTeamMember(editingId, editName.trim(), editRole.trim(), editEmail.trim());
      await load();
      await onTeamChanged?.();
      setEditingId(null);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (m) => {
    if (!window.confirm(`"${m.full_name}" ekipten kaldırılsın mı? Bu kişi artık sisteme giriş yapamayacak (Supabase Authentication'daki hesabını ayrıca silmek isteyebilirsiniz).`)) return;
    setSaving(true);
    try {
      await deleteTeamMember(m.id);
      await load();
      if (m.id === currentProfileId) {
        onSelfDeleted?.();
      } else {
        await onTeamChanged?.();
      }
    } catch (e) {
      alert("Silinemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitNew = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await addTeamMember(orgId, newName.trim(), newRole.trim(), newEmail.trim());
      await load();
      setNewName("");
      setNewRole("");
      setNewEmail("");
      setShowAdd(false);
    } catch (e) {
      alert("Eklenemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Genel Görünüm"
        action={labelsSaved && <span className="text-xs text-emerald-600 font-medium">Kaydedildi ✓</span>}
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-xs text-slate-500">Organizasyon Adı (giriş ekranında ve sol menüde görünür)</span>
            <input value={orgName} onChange={(e) => { setOrgName(e.target.value); setLabelsSaved(false); }} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
          </label>

          <div>
            <div className="text-xs text-slate-500 mb-2">Logo</div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="shadow-md shadow-slate-300/60" style={{ borderRadius: 19 }}>
                <OrgIcon org={org} size={88} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploadingLogo ? "Yükleniyor…" : "Logo Yükle"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                </label>
                {org?.logoUrl && (
                  <button onClick={removeLogo} className="text-xs text-red-600 hover:underline">Yüklediğim Logoyu Kaldır</button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Kare (1:1) bir görsel en iyi sonucu verir; ikon olarak yuvarlatılmış köşelerle gösterilir. Varsayılan logolar hazır gelir, kendi logonuzu yükleyerek değiştirebilirsiniz.</p>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-2">Sol Menü Etiketleri</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(menu || []).map((m) => (
                <label key={m.id} className="block text-sm">
                  <span className="text-[11px] text-slate-400">{m.id}</span>
                  <input value={labels[m.id] ?? m.label} onChange={setLabel(m.id)} className="mt-0.5 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveAppearance} disabled={savingLabels} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium">
              <Palette size={14} /> {savingLabels ? "Kaydediliyor…" : "Görünümü Kaydet"}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Ekip Üyeleri"
        action={<button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 text-xs text-orange-600 font-medium hover:underline"><Plus size={13} /> Üye Ekle</button>}
      >
        {bootstrap && (
          <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3">
            <b>Kurulum modundasınız.</b> Bu organizasyonda henüz hiçbir ekip üyesine e-posta eşleştirilmemiş.
            Önce kendi kaydınızı (veya yeni bir "Üye Ekle" ile kendinizi) aşağıda kendi e-postanızla kaydedin;
            bundan sonra bu organizasyona sadece listede e-postası olan kişiler girebilecek.
            ÖNEMLİ: kendi e-postanızı eşleştirmeden başkalarınınkini eklerseniz, bir sonraki girişinizde erişiminiz kapanır.
          </div>
        )}
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          Giriş artık e-posta + şifre ile yapılıyor. Bir kişinin giriş yapabilmesi için önce
          Supabase Dashboard &gt; Authentication &gt; Users kısmından o e-posta ile bir hesap
          oluşturmanız, sonra da aşağıda AYNI e-postayı bu kişinin kaydına eklemeniz gerekir.
        </div>
        {members === null && !error && (
          <div className="flex items-center justify-center py-8 text-slate-400 gap-2"><Loader2 size={16} className="animate-spin" /> Yükleniyor…</div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {members && members.length === 0 && <EmptyRow text="Henüz ekip üyesi yok" />}
        {members && members.length > 0 && (
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 border border-slate-100 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
                  {(m.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                {editingId === m.id ? (
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2 py-1" placeholder="Ad Soyad" />
                    <input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2 py-1" placeholder="Rol (örn. Yönetici)" />
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="text-sm border border-slate-200 rounded-md px-2 py-1" placeholder="E-posta" />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{m.full_name} {m.id === currentProfileId && <span className="text-[10px] text-orange-600 font-normal">(siz)</span>}</div>
                    <div className="text-xs text-slate-400 truncate">{m.role || "—"} {m.email && `· ${m.email}`}</div>
                  </div>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === m.id ? (
                    <>
                      <button onClick={saveEdit} disabled={saving} className="text-xs text-emerald-600 font-medium px-2 py-1 hover:bg-emerald-50 rounded">Kaydet</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(m)} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-50 rounded" title="Düzenle"><Pencil size={14} /></button>
                      <button onClick={() => removeMember(m)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded" title="Sil"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> Yeni Ekip Üyesi</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Ad Soyad *</span>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Rol</span>
                <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Örn: Şantiye Şefi" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">E-posta (Supabase'de oluşturduğunuz hesapla aynı olmalı)</span>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="ornek@sirket.com" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAdd(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submitNew} disabled={saving || !newName.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">Ekle</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
