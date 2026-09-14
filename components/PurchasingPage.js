"use client";
import { useState } from "react";
import { Package, AlertTriangle, Truck, Wallet, Plus, X, ArrowRight } from "lucide-react";
import { KpiCard, StatusBadge, EmptyRow } from "./Shared";
import { PURCHASE_STATUS_FLOW, purchaseTotal, purchaseGrandTotal, fmtTL, fmtDate, todayISO } from "@/lib/helpers";
import { addPurchase, advancePurchaseStatus } from "@/lib/api";

const emptyForm = { item: "", company: "-", quantity: 1, unit: "adet", unitPrice: 0, kdv: 20, orderDate: todayISO(), expectedDelivery: "", responsible: "", workItemId: "", notes: "" };

export default function PurchasingPage({ data, projectId, profile, onMutated }) {
  const { purchases, companies, workItems } = data;
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const today = todayISO();
  const openCount = purchases.filter((p) => p.status !== "Tamamlandı").length;
  const lateCount = purchases.filter((p) => p.status !== "Tamamlandı" && p.expectedDelivery && !p.actualDelivery && p.expectedDelivery < today).length;
  const totalContract = purchases.reduce((s, p) => s + purchaseGrandTotal(p), 0);
  const thisMonthOrders = purchases.filter((p) => p.orderDate && p.orderDate.slice(0, 7) === today.slice(0, 7)).reduce((s, p) => s + purchaseGrandTotal(p), 0);

  const filtered = filterStatus === "Tümü" ? purchases : purchases.filter((p) => p.status === filterStatus);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (!form.item.trim()) return;
    setSaving(true);
    try {
      await addPurchase(projectId, form, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const advance = async (p) => {
    try {
      await advancePurchaseStatus(projectId, p, profile?.full_name || "Bilinmiyor");
      await onMutated();
      setSelected(null);
    } catch (e) {
      alert("Güncellenemedi: " + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Açık Satın Almalar" value={openCount} tone="blue" icon={Package} />
        <KpiCard label="Geciken Teslimler" value={lateCount} tone={lateCount ? "red" : "slate"} icon={AlertTriangle} />
        <KpiCard label="Bu Ay Sipariş Tutarı" value={fmtTL(thisMonthOrders)} icon={Truck} />
        <KpiCard label="Toplam Sözleşme Tutarı" value={fmtTL(totalContract)} icon={Wallet} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>
          {PURCHASE_STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} kayıt</span>
        <button onClick={() => setShowForm(true)} className="ml-auto inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
          <Plus size={14} /> Yeni Satın Alma
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left font-medium px-3 py-2.5">Ürün / İş</th>
              <th className="text-left font-medium px-3 py-2.5">Firma</th>
              <th className="text-right font-medium px-3 py-2.5">Genel Toplam</th>
              <th className="text-left font-medium px-3 py-2.5">Beklenen Teslim</th>
              <th className="text-left font-medium px-3 py-2.5">Ödeme</th>
              <th className="text-left font-medium px-3 py-2.5">Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} onClick={() => setSelected(p)} className="border-t border-slate-50 hover:bg-orange-50/40 cursor-pointer">
                <td className="px-3 py-2.5 text-slate-800 font-medium">{p.item}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.company}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtTL(purchaseGrandTotal(p))}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.expectedDelivery ? fmtDate(p.expectedDelivery) : "—"}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.paymentStatus}</td>
                <td className="px-3 py-2.5"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6}><EmptyRow text="Kayıt yok" /></td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{selected.item}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center gap-2"><StatusBadge status={selected.status} /><span className="text-xs text-slate-400">Sorumlu: {selected.responsible}</span></div>
              <div className="flex items-center gap-1">
                {PURCHASE_STATUS_FLOW.map((s, i) => {
                  const currentIdx = PURCHASE_STATUS_FLOW.indexOf(selected.status);
                  return <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? "bg-orange-500" : "bg-slate-100"}`} title={s} />;
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Firma", selected.company], ["Miktar", `${selected.quantity} ${selected.unit}`],
                  ["Birim Fiyat", fmtTL(selected.unitPrice)], ["Toplam", fmtTL(purchaseTotal(selected))],
                  ["KDV", `%${selected.kdv}`], ["Genel Toplam", fmtTL(purchaseGrandTotal(selected))],
                  ["Sipariş Tarihi", selected.orderDate ? fmtDate(selected.orderDate) : "—"],
                  ["Beklenen Teslim", selected.expectedDelivery ? fmtDate(selected.expectedDelivery) : "—"],
                  ["Gerçek Teslim", selected.actualDelivery ? fmtDate(selected.actualDelivery) : "—"],
                  ["Ödeme Durumu", selected.paymentStatus],
                ].map(([l, v]) => (
                  <div key={l}><div className="text-xs text-slate-400">{l}</div><div className="font-medium text-slate-700">{v}</div></div>
                ))}
              </div>
              {selected.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-2.5">{selected.notes}</p>}
              {selected.status !== "Tamamlandı" && (
                <button onClick={() => advance(selected)} className="w-full inline-flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-2 rounded-md transition-colors">
                  <ArrowRight size={13} /> Sonraki Aşamaya İlerlet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">Yeni Satın Alma Talebi</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <label className="block"><span className="text-xs text-slate-500">Ürün / İş *</span>
                <input value={form.item} onChange={set("item")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Firma</span>
                  <select value={form.company} onChange={set("company")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    <option>-</option>{companies.map((c) => <option key={c.id}>{c.name}</option>)}
                  </select></label>
                <label className="block"><span className="text-xs text-slate-500">İlgili İş Kalemi</span>
                  <select value={form.workItemId} onChange={set("workItemId")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm">
                    <option value="">—</option>{workItems.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select></label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Miktar</span>
                  <input type="number" value={form.quantity} onChange={set("quantity")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Birim</span>
                  <input value={form.unit} onChange={set("unit")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Birim Fiyat</span>
                  <input type="number" value={form.unitPrice} onChange={set("unitPrice")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-slate-500">Sipariş Tarihi</span>
                  <input type="date" value={form.orderDate} onChange={set("orderDate")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
                <label className="block"><span className="text-xs text-slate-500">Beklenen Teslim</span>
                  <input type="date" value={form.expectedDelivery} onChange={set("expectedDelivery")} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs text-slate-500">Sorumlu</span>
                <input value={form.responsible} onChange={set("responsible")} placeholder={profile?.full_name} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <label className="block"><span className="text-xs text-slate-500">Not</span>
                <textarea value={form.notes} onChange={set("notes")} rows={2} className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm" /></label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={submit} disabled={saving || !form.item.trim()} className="text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-medium">{saving ? "Kaydediliyor…" : "Talebi Oluştur"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
