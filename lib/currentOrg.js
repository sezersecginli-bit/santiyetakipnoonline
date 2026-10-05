// Hangi organizasyonun (NOON / TETRA / LINE ...) seçili olduğunu tarayıcıda hatırlar.
const KEY = "santiye_current_org_id_v1";

export function getStoredOrgId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredOrgId(id) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* yoksay */
  }
}

export function clearStoredOrgId() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* yoksay */
  }
}
