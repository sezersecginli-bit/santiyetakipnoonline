"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Plus, X, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "./Shared";
import { fmtTL, fmtDate } from "@/lib/helpers";
import { approveQuote, addQuote, updateQuote, deleteQuote, addQuoteBid, updateQuoteBid, deleteQuoteBid } from "@/lib/api";

const emptyQuoteForm = { title: "", workItemId: "", requestedBy: "", deadline: "" };
const emptyBidForm = { company: "", amount: "", kdv: 20, delivery: "", terms: "", warranty: "", note: "" };

export default function QuotesPage({ data, projectId, profile, onMutated }) {
  const { quotes, workItems, companies } = data;
  const [openId, setOpenId] = useState(quotes[0]?.id || null);
  const [busyId, setBusyId] = useState(null);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null); // null = yeni, obje = düzenleme
  const [quoteForm, setQuoteForm] = useState(emptyQuoteForm);

  const [addingBidFor, setAddingBidFor] = useState(null); // quote id (yeni teklif ekleme)
  const [editingBid, setEditingBid] = useState(null); // { quoteId, bid } (mevcut teklifi düzenleme)
  const [bidForm, setBidForm] = useState(emptyBidForm);

  const [saving, setSaving] = useState(false);

  const handleApprove = async (quote) => {
    setBusyId(quote.id);
    try {
      await approveQuote(projectId, quote, profile?.full_name || "Bilinmiyor");
      await onMutated();
    } catch (e) {
      alert("Onaylanırken bir hata oluştu: " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const setQ = (field) => (e) => setQuoteForm((f) => ({ ...f, [field]: e.target.value }));
  const setB = (field) => (e) => setBidForm((f) => ({ ...f, [field]: e.target.value }));

  const openCreateQuote = () => {
    setEditingQuote(null);
    setQuoteForm(emptyQuoteForm);
    setShowQuoteForm(true);
  };

  const openEditQuote = (e, q) => {
    e.stopPropagation();
    setEditingQuote(q);
    setQuoteForm({ title: q.title, workItemId: q.workItemId || "", requestedBy: q.requestedBy || "", deadline: q.deadline || "" });
    setShowQuoteForm(true);
  };

  const submitQuote = async () => {
    if (!quoteForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingQuote) {
        await updateQuote(projectId, editingQuote.id, quoteForm, profile?.full_name || "Bilinmiyor");
      } else {
        await addQuote(projectId, quoteForm, profile?.full_name || "Bilinmiyor");
      }
      await onMutated();
      setQuoteForm(emptyQuoteForm);
      setEditingQuote(null);
      setShowQuoteForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuote = async (e, q) => {
    e.stopPropagation();
    if (!window.confirm(`"${q.title}" teklif talebini ve içindeki tüm firma tekliflerini kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteQuote(projectId, q, profile?.full_name || "Bilinmiyor");
      await onMutated();
    } catch (e2) {
      alert("Silinemedi: " + e2.message);
    }
  };

  const startAddBid = (quoteId) => {
    setEditingBid(null);
    setBidForm(emptyBidForm);
    setAddingBidFor(quoteId);
  };

  const startEditBid = (quoteId, bid) => {
    setAddingBidFor(quoteId);
    setEditingBid({ quoteId, bid });
    setBidForm({ company: bid.company, amount: bid.amount, kdv: bid.kdv || 20, delivery: bid.delivery || "", terms: bid.terms || "", warranty: bid.warranty || "", note: bid.note || "" });
  };

  const cancelBidForm = () => {
    setAddingBidFor(null);
    setEditingBid(null);
    setBidForm(emptyBidForm);
  };

  const submitBid = async (quote) => {
    if (!bidForm.company.trim() || !bidForm.amount) return;
    setSaving(true);
    try {
      if (editingBid) {
        await updateQuoteBid(projectId, quote, { ...bidForm, id: editingBid.bid.id }, profile?.full_name || "Bilinmiyor");
      } else {
        await addQuoteBid(projectId, quote, bidForm, profile?.full_name || "Bilinmiyor");
      }
      await onMutated();
      cancelBidForm();
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBid = async (quote, bid) => {
    if (!window.confirm(`"${bid.company}" firmasının teklifini silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteQuoteBid(projectId, quote, bid, profile?.full_name || "Bilinmiyor");
      await onMutated();
    } catch (e) {
      alert("Silinemedi: " + e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={openCreateQuote} className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Teklif Talebi
        </button>
      </div>

      {quotes.map((q) => {
        const lowest = q.bids.length ? Math.min(...q.bids.map((b) => b.amount)) : 0;
        const isOpen = openId === q.id;
        return (
          <div key={q.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <button onClick={() => setOpenId(isOpen ? null : q.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{q.title}</div>
                  <div className="text-xs text-slate-400 truncate">Talep eden: {q.requestedBy} · Son tarih: {fmtDate(q.deadline)}</div>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 hidden sm:inline">{q.bids.length} teklif</span>
                <StatusBadge status={q.status} />
                <button onClick={(e) => openEditQuote(e, q)} className="text-slate-400 hover:text-orange-600 p-1.5 hover:bg-orange-50 rounded" title="Başlığı düzenle"><Pencil size={14} /></button>
                <button onClick={(e) => handleDeleteQuote(e, q)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded" title="Sil"><Trash2 size={14} /></button>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3">
                {q.bids.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                          <th className="py-1.5 pr-3 font-medium">Firma</th>
                          <th className="py-1.5 pr-3 font-medium text-right">Teklif</th>
                          <th className="py-1.5 pr-3 font-medium">Teslim</th>
                          <th className="py-1.5 pr-3 font-medium">Ödeme</th>
                          <th className="py-1.5 pr-3 font-medium">Garanti</th>
                          <th className="py-1.5 pr-3 font-medium">Not</th>
                          <th className="py-1.5 font-medium text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.bids.map((b, i) => (
                          <tr key={b.id || i} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 pr-3 font-medium text-slate-700">{b.company}</td>
                            <td className={`py-2 pr-3 text-right tabular-nums ${b.amount === lowest ? "text-emerald-600 font-semibold" : "text-slate-600"}`}>
                              {fmtTL(b.amount)}{b.amount === lowest && <span className="ml-1 text-[10px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded">en düşük</span>}
                            </td>
                            <td className="py-2 pr-3 text-slate-500">{b.delivery}</td>
                            <td className="py-2 pr-3 text-slate-500">{b.terms}</td>
                            <td className="py-2 pr-3 text-slate-500">{b.warranty}</td>
                            <td className="py-2 pr-3 text-slate-400 text-xs">{b.note}</td>
                            <td className="py-2">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => startEditBid(q.id, b)} className="text-slate-400 hover:text-orange-600 p-1 hover:bg-orange-50 rounded" title="Düzenle"><Pencil size={13} /></button>
                                <button onClick={() => handleDeleteBid(q, b)} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded" title="Sil"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-400 mt-2">En düşük fiyat otomatik işaretlenir; karar fiyat, termin, garanti ve referans birlikte değerlendirilerek verilmelidir.</p>
                  </div>
                )}

                {addingBidFor === q.id ? (
                  <div className="mt-3 border border-orange-200 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input list="company-options" value={bidForm.company} onChange={setB("company")} placeholder="Firma adı" className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5" />
                      <datalist id="company-options">{companies.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                      <input type="number" value={bidForm.amount} onChange={setB("amount")} placeholder="Teklif tutarı (TL)" className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={bidForm.delivery} onChange={setB("delivery")} placeholder="Teslim (örn: 6 hafta)" className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5" />
                      <input value={bidForm.terms} onChange={setB("terms")} placeholder="Ödeme koşulu" className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5" />
                      <input value={bidForm.warranty} onChange={setB("warranty")} placeholder="Garanti" className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5" />
                    </div>
                    <input value={bidForm.note} onChange={setB("note")} placeholder="Not (opsiyonel)" className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5" />
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelBidForm} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                      <button onClick={() => submitBid(q)} disabled={saving || !bidForm.company.trim() || !bidForm.amount} className="text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-medium">
                        {editingBid ? "Değişiklikleri Kaydet" : "Teklifi Ekle"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
                    <button onClick={() => startAddBid(q.id)} className="inline-flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md">
                      <Plus size={13} /> Teklif Ekle
                    </button>
                    {q.status !== "Onaylandı" && q.bids.length > 0 && (
                      <button
                        onClick={() => handleApprove(q)}
                        disabled={busyId === q.id}
                        className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                      >
                        <Check size={13} /> {busyId === q.id ? "İşleniyor…" : "En düşük teklifi onayla ve iş kalemine yansıt"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {quotes.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Henüz teklif talebi yok.</p>}

      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowQuoteForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">{editingQuote ? "Teklif Talebini Düzenle" : "Yeni Teklif Talebi"}</h3>
              <button onClick={() => setShowQuoteForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Başlık *</span>
                <input value={quoteForm.title} onChange={setQ("title")} placeholder="Örn: Mutfak Dolabı İmalatı" className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">İlgili İş Kalemi (opsiyonel)</span>
                <select value={quoteForm.workItemId} onChange={setQ("workItemId")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                  <option value="">—</option>
                  {workItems.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Talep Eden</span>
                  <input value={quoteForm.requestedBy} onChange={setQ("requestedBy")} placeholder={profile?.full_name} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Teklif Son Tarihi</span>
                  <input type="date" value={quoteForm.deadline} onChange={setQ("deadline")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowQuoteForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submitQuote} disabled={saving || !quoteForm.title.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">
                  {saving ? "Kaydediliyor…" : editingQuote ? "Değişiklikleri Kaydet" : "Talebi Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
