export class ApiError extends Error {
  constructor(message, { status = 0, code = "API_ERROR", data = null, path = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
    this.path = path;
  }
}

function notifyAuthRequired() {
  if (typeof window === "undefined") return;
  if (window.__glhAuthRequiredPending) return;
  window.__glhAuthRequiredPending = true;
  window.dispatchEvent(new CustomEvent("glh:auth-required"));
}

export function clearAuthRequiredNotice() {
  if (typeof window !== "undefined") window.__glhAuthRequiredPending = false;
}

export async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { credentials: "include", ...options });
  } catch (error) {
    throw new ApiError("NETWORK_ERROR", { code: "NETWORK_ERROR", path });
  }

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}

  if (response.status === 401) {
    notifyAuthRequired();
    throw new ApiError(data?.error || "AUTH_REQUIRED", {
      status: response.status,
      code: data?.error || "AUTH_REQUIRED",
      data,
      path,
    });
  }
  if (!response.ok) {
    throw new ApiError(data?.error || `HTTP_${response.status}`, {
      status: response.status,
      code: data?.error || `HTTP_${response.status}`,
      data,
      path,
    });
  }
  return data;
}

export async function apiFetchResponse(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { credentials: "include", ...options });
  } catch (error) {
    throw new ApiError("NETWORK_ERROR", { code: "NETWORK_ERROR", path });
  }
  if (response.status === 401) notifyAuthRequired();
  return response;
}

export async function apiGet(path, options = {}) {
  return apiFetch(path, { ...options, method: "GET" });
}
