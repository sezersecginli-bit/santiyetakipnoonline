import { supabase } from "./supabaseClient";
import { todayISO, CATEGORY_GROUPS } from "./helpers";

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

// Giriş yapan kullanıcının, SEÇİLİ ORGANİZASYONDAKİ ekip kaydını bulur.
// - E-postası o organizasyonun ekibinde eşleşiyorsa -> o kaydın adı/rolü.
// - Organizasyonda henüz hiçbir üyeye e-posta eşleştirilmemişse -> "kurulum modu"
//   (giriş yapan kişi Ayarlar'a girip kendi e-postasını ekleyebilsin diye).
// - Aksi halde -> null (bu organizasyona erişim yok).
export async function getMyProfile(orgId) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;
  const email = (user.email || "").trim();
  const { data: members, error } = await supabase.from("team_members").select("*").eq("org_id", orgId);
  if (error) throw error;
  const mine = (members || []).find((m) => (m.email || "").trim().toLowerCase() === email.toLowerCase());
  if (mine) return { id: mine.id, full_name: mine.full_name, role: mine.role, email: mine.email };
  const anyMapped = (members || []).some((m) => (m.email || "").trim() !== "");
  if (!anyMapped) return { id: user.id, full_name: email, role: "Kurulum (geçici)", email, bootstrap: true };
  return null;
}

/* ============================== ORGANİZASYONLAR ============================== */

const mapOrg = (o) => ({
  id: o.id, name: o.name, slug: o.slug, logoUrl: o.logo_url || "",
  menuLabels: o.menu_labels || {}, sortOrder: o.sort_order,
});

export async function listOrganizations() {
  const { data, error } = await supabase.from("organizations").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapOrg);
}

export async function updateOrganization(orgId, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.logoUrl !== undefined) payload.logo_url = patch.logoUrl || null;
  if (patch.menuLabels !== undefined) payload.menu_labels = patch.menuLabels;
  const { error } = await supabase.from("organizations").update(payload).eq("id", orgId);
  if (error) throw error;
}

export async function uploadOrgLogo(orgId, file) {
  const url = await uploadFile("logos", file);
  await updateOrganization(orgId, { logoUrl: url });
  return url;
}

/* ============================== EKİP ÜYELERİ ============================== */

const mapTeamMember = (t) => ({ id: t.id, full_name: t.full_name, role: t.role, email: t.email || "", sortOrder: t.sort_order });

export async function listTeamMembers(orgId) {
  const { data, error } = await supabase.from("team_members").select("*").eq("org_id", orgId).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTeamMember);
}

export async function addTeamMember(orgId, fullName, role, email) {
  const { data, error } = await supabase.from("team_members").insert({ org_id: orgId, full_name: fullName, role, email: email || null, sort_order: 999 }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateTeamMember(id, fullName, role, email) {
  const { error } = await supabase.from("team_members").update({ full_name: fullName, role, email: email || null }).eq("id", id);
  if (error) throw error;
}

export async function deleteTeamMember(id) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}

export async function addTask(projectId, t, userName) {
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId, title: t.title, assignee: t.assignee, creator: userName,
    start_date: t.start || null, due_date: t.due || null, priority: t.priority || "Normal",
    status: "Yapılacak", work_item_id: t.workItemId || null,
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${t.title} görevini oluşturdu.`);
}

export async function updateTaskStatus(projectId, task, newStatus, userName) {
  const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${task.title} görevini "${newStatus}" olarak güncelledi.`);
}

export async function addDefect(projectId, d, userName) {
  const { error } = await supabase.from("defects").insert({
    project_id: projectId, block: d.block, apt: d.apt, room: d.room, title: d.title,
    assigned_to: d.assignedTo, due_date: d.dueDate || null, status: "Açık",
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${d.block} ${d.apt || ""} için eksik kaydı oluşturdu: ${d.title}`);
}

export async function updateDefectStatus(projectId, defect, newStatus, userName) {
  const { error } = await supabase.from("defects").update({ status: newStatus }).eq("id", defect.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${defect.title} eksiğini "${newStatus}" olarak işaretledi.`);
}



export async function listProjects(orgId) {
  const { data, error } = await supabase.from("projects").select("*").eq("org_id", orgId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapProject);
}

export async function createProject(orgId, input) {
  const { data, error } = await supabase.from("projects").insert({
    org_id: orgId,
    name: input.name,
    owner: input.owner || null,
    address: input.address || null,
    land_area: input.landArea || null,
    construction_area: input.constructionArea || null,
    block_count: input.blockCount ? Number(input.blockCount) : 0,
    apartment_count: input.apartmentCount ? Number(input.apartmentCount) : 0,
    start_date: input.startDate || null,
    planned_end: input.plannedEnd || null,
    estimated_end: input.estimatedEnd || input.plannedEnd || null,
    manager: input.manager || null,
    status: input.status || "Hazırlık",
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateProject(projectId, input) {
  const { error } = await supabase.from("projects").update({
    name: input.name,
    owner: input.owner || null,
    address: input.address || null,
    land_area: input.landArea || null,
    construction_area: input.constructionArea || null,
    block_count: input.blockCount ? Number(input.blockCount) : 0,
    apartment_count: input.apartmentCount ? Number(input.apartmentCount) : 0,
    start_date: input.startDate || null,
    planned_end: input.plannedEnd || null,
    estimated_end: input.estimatedEnd || null,
    manager: input.manager || null,
    status: input.status,
  }).eq("id", projectId);
  if (error) throw error;
}

export async function deleteProject(projectId) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

/* ============================== BLOK / KAT / DAİRE ============================== */

export async function addBlock(projectId, name, sortOrder = 0) {
  const { error } = await supabase.from("blocks").insert({ project_id: projectId, name, sort_order: sortOrder });
  if (error) throw error;
}

export async function addFloor(blockId, name, sortOrder = 0) {
  const { error } = await supabase.from("floors").insert({ block_id: blockId, name, sort_order: sortOrder });
  if (error) throw error;
}

export async function addApartment(floorId, name, progress = 0) {
  const { error } = await supabase.from("apartments").insert({ floor_id: floorId, name, progress: Number(progress) || 0 });
  if (error) throw error;
}

export async function updateApartmentProgress(apartmentId, progress) {
  const { error } = await supabase.from("apartments").update({ progress: Number(progress) || 0 }).eq("id", apartmentId);
  if (error) throw error;
}

// Bir bloğu, kat ve daire sayısını girerek TEK SEFERDE (kat + daire isimleriyle) oluşturur.
export async function addBlockWithStructure(projectId, name, floorCount, aptsPerFloor, includeGroundFloor, sortOrder, userName) {
  const { data: block, error: bErr } = await supabase.from("blocks").insert({ project_id: projectId, name, sort_order: sortOrder }).select("id").single();
  if (bErr) throw bErr;

  const floorRows = [];
  for (let i = 0; i < floorCount; i++) {
    const label = includeGroundFloor ? (i === 0 ? "Zemin Kat" : `${i}. Kat`) : `${i + 1}. Kat`;
    floorRows.push({ block_id: block.id, name: label, sort_order: i });
  }
  const { data: floors, error: fErr } = await supabase.from("floors").insert(floorRows).select("id, sort_order");
  if (fErr) throw fErr;

  const sortedFloors = [...(floors || [])].sort((a, b) => a.sort_order - b.sort_order);
  const aptRows = [];
  sortedFloors.forEach((floor, floorIdx) => {
    for (let a = 1; a <= aptsPerFloor; a++) {
      const num = floorIdx * aptsPerFloor + a;
      aptRows.push({ floor_id: floor.id, name: `Daire ${String(num).padStart(2, "0")}`, progress: 0 });
    }
  });
  if (aptRows.length > 0) {
    const { error: aErr } = await supabase.from("apartments").insert(aptRows);
    if (aErr) throw aErr;
  }

  await logActivity(projectId, userName, `${name} bloğunu toplu oluşturdu (${floorCount} kat, ${aptRows.length} daire).`);
  return block.id;
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

const mapBid = (b) => ({ id: b.id, company: b.company, amount: Number(b.amount || 0), kdv: b.kdv, delivery: b.delivery, terms: b.terms, warranty: b.warranty, note: b.note });
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

/* ============================== FİRMA / İŞ KALEMİ / TEKLİF OLUŞTURMA ============================== */

export async function addCompany(projectId, company, userName) {
  const { error } = await supabase.from("companies").insert({
    project_id: projectId, name: company.name, contact: company.contact, phone: company.phone,
    email: company.email, category: company.category, address: company.address,
    quality: Number(company.quality) || 3, timing: Number(company.timing) || 3,
    price: Number(company.price) || 3, comm: Number(company.comm) || 3, note: company.note,
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${company.name} firmasını sisteme ekledi.`);
}

export async function addWorkItem(projectId, w, userName) {
  const { data, error } = await supabase.from("work_items").insert({
    project_id: projectId, name: w.name, category: w.category, sub: w.sub, block: w.block,
    floor: w.floor || "-", apt: w.apt || "-", room: w.room || "-", responsible: w.responsible,
    company: w.company || "-", start_date: w.start || null, end_date: w.end || null,
    planned_days: w.plannedDays ? Number(w.plannedDays) : null, status: w.status || "Yapılacak",
    priority: w.priority || "Normal", est_cost: Number(w.estCost) || 0, act_cost: 0,
    description: w.desc,
  }).select("id").single();
  if (error) throw error;
  await logActivity(projectId, userName, `${w.name} iş kalemini oluşturdu.`);

  // Bu iş kalemi için otomatik olarak bir teklif talebi oluştur (Teklifler sekmesine düşer)
  const { error: qErr } = await supabase.from("quotes").insert({
    project_id: projectId, work_item_id: data.id, title: w.name,
    requested_by: userName, status: "Teklif bekliyor",
  });
  if (qErr) throw qErr;
  await logActivity(projectId, userName, `${w.name} için otomatik teklif talebi oluşturuldu.`);

  return data.id;
}

export async function updateWorkItem(projectId, id, w, userName) {
  const { error } = await supabase.from("work_items").update({
    name: w.name, category: w.category, sub: w.sub, block: w.block,
    floor: w.floor || "-", apt: w.apt || "-", room: w.room || "-", responsible: w.responsible,
    company: w.company || "-", start_date: w.start || null, end_date: w.end || null,
    planned_days: w.plannedDays ? Number(w.plannedDays) : null, status: w.status,
    priority: w.priority, est_cost: Number(w.estCost) || 0, act_cost: Number(w.actCost) || 0,
    description: w.desc,
  }).eq("id", id);
  if (error) throw error;

  // Bu iş kalemine bağlı teklif talebi/talepleri varsa başlığını senkronize et
  const { data: linkedQuotes, error: lqErr } = await supabase.from("quotes").select("id, title").eq("work_item_id", id);
  if (!lqErr && linkedQuotes) {
    const stale = linkedQuotes.filter((q) => q.title !== w.name);
    if (stale.length > 0) {
      await Promise.all(stale.map((q) => supabase.from("quotes").update({ title: w.name }).eq("id", q.id)));
    }
  }

  await logActivity(projectId, userName, `${w.name} iş kalemini güncelledi.`);
}

export async function deleteWorkItem(projectId, workItem, userName) {
  const { error } = await supabase.from("work_items").delete().eq("id", workItem.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${workItem.name} iş kalemini sildi.`);
}

export async function deleteWorkItems(projectId, workItems, userName) {
  const ids = workItems.map((w) => w.id);
  const { error } = await supabase.from("work_items").delete().in("id", ids);
  if (error) throw error;
  await logActivity(projectId, userName, `${workItems.length} iş kalemini toplu olarak sildi.`);
}

function buildStandardWorkItems() {
  const rows = [];
  Object.entries(CATEGORY_GROUPS).forEach(([category, subs]) => {
    subs.forEach((sub) => rows.push({ name: sub, category, sub }));
  });
  return rows;
}

export async function addStandardWorkItemTemplate(projectId, userName) {
  const template = buildStandardWorkItems();
  const { data: existing, error: exErr } = await supabase.from("work_items").select("category, sub").eq("project_id", projectId);
  if (exErr) throw exErr;
  const existingKeys = new Set((existing || []).map((w) => `${w.category}::${w.sub}`));
  const toInsert = template.filter((t) => !existingKeys.has(`${t.category}::${t.sub}`));
  if (toInsert.length === 0) return 0;
  const rows = toInsert.map((item) => ({
    project_id: projectId, name: item.name, category: item.category, sub: item.sub,
    block: "Tüm Bloklar", floor: "-", apt: "-", room: "-", responsible: "-", company: "-",
    status: "Yapılacak", priority: "Normal", est_cost: 0, act_cost: 0, description: "",
  }));
  const { data: inserted, error } = await supabase.from("work_items").insert(rows).select("id, name");
  if (error) throw error;

  // Her yeni iş kalemi için otomatik teklif talebi oluştur
  const quoteRows = (inserted || []).map((w) => ({
    project_id: projectId, work_item_id: w.id, title: w.name, requested_by: userName, status: "Teklif bekliyor",
  }));
  if (quoteRows.length > 0) {
    const { error: qErr } = await supabase.from("quotes").insert(quoteRows);
    if (qErr) throw qErr;
  }

  await logActivity(projectId, userName, `Standart iş kalemi şablonunu ekledi (${rows.length} yeni kalem, teklif talepleri otomatik oluşturuldu).`);
  return rows.length;
}

export async function addQuote(projectId, q, userName) {
  const { error } = await supabase.from("quotes").insert({
    project_id: projectId, work_item_id: q.workItemId || null, title: q.title,
    requested_by: q.requestedBy || userName, deadline: q.deadline || null, status: "Teklif bekliyor",
  });
  if (error) throw error;
  await logActivity(projectId, userName, `${q.title} için teklif talebi oluşturdu.`);
}

export async function updateQuote(projectId, quoteId, q, userName) {
  const { error } = await supabase.from("quotes").update({
    title: q.title, requested_by: q.requestedBy, deadline: q.deadline || null,
  }).eq("id", quoteId);
  if (error) throw error;
  await logActivity(projectId, userName, `${q.title} teklif talebini düzenledi.`);
}

export async function deleteQuote(projectId, quote, userName) {
  const { error } = await supabase.from("quotes").delete().eq("id", quote.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${quote.title} teklif talebini sildi.`);
}

export async function addQuoteBid(projectId, quote, bid, userName) {
  const { error } = await supabase.from("quote_bids").insert({
    quote_id: quote.id, company: bid.company, amount: Number(bid.amount) || 0,
    kdv: Number(bid.kdv) || 20, delivery: bid.delivery, terms: bid.terms, warranty: bid.warranty, note: bid.note,
  });
  if (error) throw error;
  if (quote.status === "Teklif bekliyor") {
    await supabase.from("quotes").update({ status: "Teklifler alındı" }).eq("id", quote.id);
  }
  await logActivity(projectId, userName, `${quote.title} için ${bid.company} firmasından teklif eklendi.`);
}

export async function updateQuoteBid(projectId, quote, bid, userName) {
  const { error } = await supabase.from("quote_bids").update({
    company: bid.company, amount: Number(bid.amount) || 0, kdv: Number(bid.kdv) || 20,
    delivery: bid.delivery, terms: bid.terms, warranty: bid.warranty, note: bid.note,
  }).eq("id", bid.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${quote.title} için ${bid.company} teklifini güncelledi.`);
}

export async function deleteQuoteBid(projectId, quote, bid, userName) {
  const { error } = await supabase.from("quote_bids").delete().eq("id", bid.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${quote.title} için ${bid.company} teklifini sildi.`);
}




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

export async function updateDocument(projectId, docId, doc, file, userName) {
  const payload = {
    name: doc.name, category: doc.category, related_to: doc.relatedTo,
    block: doc.block, doc_date: doc.date || todayISO(), note: doc.note,
  };
  if (file) {
    payload.file_url = await uploadFile("documents", file);
  } else if (doc.link !== undefined) {
    payload.file_url = doc.link || null;
  }
  const { error } = await supabase.from("documents").update(payload).eq("id", docId);
  if (error) throw error;
  await logActivity(projectId, userName, `${doc.name} belgesini düzenledi.`);
}

export async function deleteDocument(projectId, doc, userName) {
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
  await logActivity(projectId, userName, `${doc.name} belgesini sildi.`);
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
