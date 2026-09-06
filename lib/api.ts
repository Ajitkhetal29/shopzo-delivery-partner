const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export const API_ENDPOINTS = {
  /* AUTH */
  SIGNUP: `${API_BASE_URL}/delivery-agent/register`,
  SIGNIN: `${API_BASE_URL}/delivery-agent/login`,
};
