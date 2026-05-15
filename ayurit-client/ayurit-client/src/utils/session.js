const SESSION_KEY = 'ayurit.session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken() {
  return getSession()?.token || '';
}

export function getSessionRole() {
  return getSession()?.role || '';
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function roleMatches(routeRole) {
  const role = getSessionRole();
  if (!routeRole) return Boolean(role);
  if (Array.isArray(routeRole)) return routeRole.includes(role);
  return role === routeRole;
}
