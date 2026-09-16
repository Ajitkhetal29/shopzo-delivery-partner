const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/delivery-agent/register`,
  SIGNIN: `${API_BASE_URL}/delivery-agent/login`,
  LOGOUT: `${API_BASE_URL}/delivery-agent/logout`,
  CURRENT_USER: `${API_BASE_URL}/delivery-agent/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/delivery-agent/profile`,
};
