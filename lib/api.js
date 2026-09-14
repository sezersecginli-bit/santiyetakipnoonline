import { supabase } from "./supabaseClient";
import { todayISO } from "./helpers";

/* ============================== AUTH ============================== */

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getMyProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) {
    console.error("Profil bulunamadı. Supabase'de profiles tablosuna bu kullanıcı için bir satır eklediniz mi?", error);
    return { id: user.id, full_name: user.email, role: "Teknik Ofis" };
  }
  return data;
}

/* ============================== YARDIMCI: PROJE ID ============================== */

let cachedProjectId = null;

export async function getActiveProjectId() {
  if (cachedProjectId) return cachedProjectId;
  const { data, error } = await supabase.from("projects").select("id").order("created_at", { ascending: true }).limit(1).single();
  if (error || !data) {
    console.error("Aktif proje bulunamadı. supabase/schema.sql içindeki seed verisini çalıştırdınız mı?", error);
    return null;
  }
  cachedProjectId = data.id;
  return cachedProjectId;
}

/* ============================== MAPPING (DB satırı -> UI objesi) ============================== */

const mapProject = (p) => p && ({
  id: p.id, name: p.name, owner: p.owner, address: p.address,
  landArea: p.land_area, constructionArea: p.construction_area,
  blockCount: p.block_count, apartmentCount: p.apartment_count,
  startDate: p.start_date, plannedEnd: p.planned_end, estimatedEnd: p.estimated_end,
  manager: p.manager, status: p.status,
});

const mapApartment = (a) => ({ id: a.id, name: a.name, progress: a.progress });
const mapFloor = (f) => ({ id: f.id, name: f.name, apartments: (f.apartments || []).sort((x, y) => x.name.localeCompare(y.name, "tr")).map(mapApartment) });
const mapBlock = (b) => ({ id: b.id, name: b.name, floors: (b.floors || []).sort((x, y) => x.sort_order - y.sort_order).map(mapFloor) });

const mapCompany = (c) => ({
  id: c.id, name: c.name, contact: c.contact, phone: c.phone, email: c.email,
  category: c.category, address: c.address, quality: c.quality, timing: c.timing,
  price: c.price, comm: c.comm, note: c.note,
});

const mapWorkItem = (w) => ({
  id: w.id, name: w.name, category: w.category, sub: w.sub, block: w.block, floor: w.floor,
  apt: w.apt, room: w.room, responsible: w.responsible, company: w.company,
  start: w.start_date, end: w.end_date, plannedDays: w.planned_days, actualDays: w.actual_days,
  status: w.status, priority: w.priority, estCost: Number(w.est_cost || 0), actCost: Number(w.act_cost || 0),
  desc: w.description, progress: w.progress, linkedQuoteId: w.linked_quote_id,
});

const mapBid = (b) => ({ company: b.company, amount: Number(b.amount || 0), kdv: b.kdv, delivery: b.delivery, terms: b.terms, warranty: b.warranty, note: b.note });
const mapQuote = (q) => ({
  id: q.id, workItemId: q.work_item_id, title: q.title, requestedBy: q.requested_by,
  deadline: q.deadline, status: q.status, bids: (q.quote_bids || []).map(mapBid),
});

const mapTask = (t) => ({
  id: t.id, title: t.title, assignee: t.assignee, creator: t.creator, start: t.start_date,
  due: t.due_date, priority: t.priority, status: t.status, workItemId: t.work_item_id,
});

const mapActivity = (a) => ({ user: a.user_name, text: a.text, time: a.created_at });

const mapDefect = (d) => ({ id: d.id, block: d.block, apt: d.apt, room: d.room, title: d.title, assignedTo: d.assigned_to, dueDate: d.due_date, status: d.status });

const mapSiteReport = (r) => ({
  id: r.id, date: r.report_date, weather: r.weather, crews: r.crews, totalWorkers: r.total_workers,
  done: r.done, planned: r.planned, materialsIn: r.materials_in, materialsOut: r.materials_out,
  issues: r.issues, accident: r.accident, notes: r.notes, reporter: r.reporter,
});

const mapPurchase = (p) => ({
  id: p.id, item: p.item, company: p.company, quantity: Number(p.quantity || 0), unit: p.unit,
  unitPrice: Number(p.unit_price || 0), kdv: p.kdv, orderDate: p.order_date, expectedDelivery: p.expected_delivery,
  actualDelivery: p.actual_delivery, paymentStatus: p.payment_status, responsible: p.responsible,
  status: p.status, workItemId: p.work_item_id, notes: p.notes,
});

const mapDocument = (d) => ({
  id: d.id, name: d.name, category: d.category, relatedTo: d.related_to, block: d.block,
  date: d.doc_date, uploadedBy: d.uploaded_by, link: d.file_url, note: d.note,
});

const mapPhoto = (p) => ({
  id: p.id, date: p.photo_date, block: p.block, floor: p.floor, apt: p.apt, room: p.room,
  workItem: p.work_item, phase: p.phase, desc: p.description, imageUrl: p.file_url, uploadedBy: p.uploaded_by,
});

/* ============================== TOPLU VERİ ÇEKME ============================== */

export async function fetchAllData(projectId) {
  const [
    projectRes, blocksRes, companiesRes, workItemsRes, quotesRes,
    tasksRes, activitiesRes, defectsRes, reportsRes, purchasesRes, documentsRes, photosRes,
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("blocks").select("*, floors(*, apartments(*))").eq("project_id", projectId),
    supabase.from("companies").select("*").eq("project_id", projectId).order("name"),
    supabase.from("work_items").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("quotes").select("*, quote_bids(*)").eq("project_id", projectId).order("created_at"),
    supabase.from("tasks").select("*").eq("project_id", projectId).order("due_date"),
    supabase.from("activities").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(15),
    supabase.from("defects").select("*").eq("project_id", projectId).order("due_date"),
    supabase.from("site_reports").select("*").eq("project_id", projectId).order("report_date", { ascending: false }),
    supabase.from("purchases").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("photos").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
  ]);

  const errs = [projectRes, blocksRes, companiesRes, workItemsRes, quotesRes, tasksRes, activitiesRes, defectsRes, reportsRes, purchasesRes, documentsRes, photosRes]
    .map((r) => r.error).filter(Boolean);
  if (errs.length) {
    console.error("Veri çekme hataları:", errs);
  }

  return {
    project: mapProject(projectRes.data),
    blocks: (blocksRes.data || []).sort((a, b) => a.name.localeCompare(b.name, "tr")).map(mapBlock),
    companies: (companiesRes.data || []).map(mapCompany),
    workItems: (workItemsRes.data || []).map(mapWorkItem),
    quotes: (quotesRes.data || []).map(mapQuote),
    tasks: (tasksRes.data || []).map(mapTask),
    activities: (activitiesRes.data || []).map(mapActivity),
    defects: (defectsRes.data || []).map(mapDefect),
    siteReports: (reportsRes.data || []).map(mapSiteReport),
    purchases: (purchasesRes.data || []).map(mapPurchase),
    documents: (documentsRes.data || []).map(mapDocument),
    photos: (photosRes.data || []).map(mapPhoto),
  };
}

/* ============================== AKTİVİTE LOGU ============================== */

async function logActivity(projectId, userName, text) {
  await supabase.from("activities").insert({ project_id: projectId, user_name: userName, text });
}

/* ============================== MUTASYONLAR ============================== */

export async function approveQuote(projectId, quote, userName) {
  const lowestBid = quote.bids.reduce((min, b) => (b.amount < min.amount ? b : min), quote.bids[0]);

  await supabase.from("quotes").update({ status: "Onaylandı" }).eq("id", quote.id);

  if (quote.workItemId) {
    await supabase.from("work_items")
      .update({ company: lowestBid.company, est_cost: lowestBid.amount })
      .eq("id", quote.workItemId);
  }

  const { data: existing } = await supabase.from("purchases").select("id").eq("work_item_id", quote.workItemId).limit(1);
  if (!existing || existing.length === 0) {
    await supabase.from("purchases").insert({
      project_id: projectId, item: quote.title, company: lowestBid.company, quantity: 1, unit: "iş",
      unit_price: lowestBid.amount, kdv: lowestBid.kdv || 20, order_date: todayISO(),
      payment_status: "Beklemede", responsible: quote.requestedBy, status: "Sipariş verildi",
      work_item_id: quote.workItemId, notes: "Teklif onayından otomatik oluşturuldu.",
    });
    await logActivity(projectId, userName, `${quote.title} için satın alma otomatik oluşturuldu.`);
  }

  await logActivity(projectId, userName, `${quote.title} teklifini onayladı (${lowestBid.company}).`);
}

export async function addSiteReport(projectId, report, userName) {
  const { error } = await supabase.from("site_reports").insert({
    project_id: projectId, report_date: report.date, weather: report.weather, crews: report.crews,
    total_workers: Number(report.totalWorkers) || 0, done: report.done, planned: report.planned,
    materials_in: report.materialsIn, materials_out: report.materialsOut, issues: report.issues,
    accident: report.accident, notes: report.notes, reporter: userName,
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${report.date} tarihli şantiye günlük raporunu ekledi.`);
}

export async function addPurchase(projectId, purchase, userName) {
  const { error } = await supabase.from("purchases").insert({
    project_id: projectId, item: purchase.item, company: purchase.company, quantity: Number(purchase.quantity) || 1,
    unit: purchase.unit, unit_price: Number(purchase.unitPrice) || 0, kdv: Number(purchase.kdv) || 20,
    order_date: purchase.orderDate || null, expected_delivery: purchase.expectedDelivery || null,
    payment_status: "Beklemede", responsible: purchase.responsible || userName, status: "Talep oluşturuldu",
    work_item_id: purchase.workItemId || null, notes: purchase.notes,
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${purchase.item} için satın alma talebi oluşturdu.`);
}

export async function advancePurchaseStatus(projectId, purchase, userName) {
  const { PURCHASE_STATUS_FLOW } = await import("./helpers");
  const idx = PURCHASE_STATUS_FLOW.indexOf(purchase.status);
  const nextStatus = PURCHASE_STATUS_FLOW[Math.min(idx + 1, PURCHASE_STATUS_FLOW.length - 1)];
  const patch = { status: nextStatus };
  if (nextStatus === "Tamamlandı") patch.actual_delivery = todayISO();
  const { error } = await supabase.from("purchases").update(patch).eq("id", purchase.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${purchase.item} satın almasını ilerletti (${nextStatus}).`);
}

async function uploadFile(bucket, file) {
  if (!file) return null;
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function addDocument(projectId, doc, file, userName) {
  const fileUrl = file ? await uploadFile("documents", file) : (doc.link || null);
  const { error } = await supabase.from("documents").insert({
    project_id: projectId, name: doc.name, category: doc.category, related_to: doc.relatedTo,
    block: doc.block, doc_date: doc.date || todayISO(), uploaded_by: userName, file_url: fileUrl, note: doc.note,
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${doc.name} belgesini sisteme ekledi.`);
}

export async function addPhoto(projectId, photo, file, userName) {
  const fileUrl = file ? await uploadFile("photos", file) : (photo.imageUrl || null);
  const { error } = await supabase.from("photos").insert({
    project_id: projectId, photo_date: photo.date || todayISO(), block: photo.block, floor: photo.floor,
    apt: photo.apt, room: photo.room, work_item: photo.workItem, phase: photo.phase,
    description: photo.desc, file_url: fileUrl, uploaded_by: userName,
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${photo.workItem || "bir iş"} için fotoğraf ekledi (${photo.phase}).`);
}

/* ============================== GERÇEK ZAMANLI SENKRONİZASYON ============================== */

const REALTIME_TABLES = [
  "work_items", "quotes", "quote_bids", "purchases", "documents", "photos",
  "site_reports", "defects", "tasks", "activities", "companies", "blocks", "floors", "apartments",
];

// Ekip içindeki başka bir kullanıcı veri değiştirdiğinde onChange() tetiklenir (siz de anlık görürsünüz).
export function subscribeToProjectChanges(projectId, onChange) {
  const channel = supabase.channel(`project-${projectId}-changes`);
  REALTIME_TABLES.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => onChange());
  });
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
