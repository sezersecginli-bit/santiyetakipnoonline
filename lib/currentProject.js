// Hangi projenin şu an aktif olduğunu tarayıcıda hatırlar (çoklu proje desteği).
const KEY = "santiye_current_project_id_v1";

export function getStoredProjectId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredProjectId(id) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* yoksay */
  }
}
