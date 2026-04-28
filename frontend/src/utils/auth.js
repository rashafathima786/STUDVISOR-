const TOKEN_KEY = "erp_token";
const ROLE_KEY = "erp_role";
const USER_KEY = "erp_user";

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveRole(role) {
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || "student";
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function isAdmin() {
  return getRole() === "admin";
}

export function isFaculty() {
  const role = getRole();
  return role === "faculty" || role === "hod";
}

export function isStudent() {
  return getRole() === "student";
}