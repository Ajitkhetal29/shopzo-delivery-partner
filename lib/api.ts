const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in your .env file.");
}

export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/delivery-agent/register`,
  SIGNIN: `${API_BASE_URL}/delivery-agent/login`,
  CURRENT_USER: `${API_BASE_URL}/delivery-agent/me`,
  LOGOUT: `${API_BASE_URL}/delivery-agent/logout`,
  SET_DUTY: `${API_BASE_URL}/delivery-agent/duty`,
  SUBMIT_KYC: `${API_BASE_URL}/delivery-agent/kyc`,
  UPDATE_WORKING_RADIUS: `${API_BASE_URL}/delivery-agent/working-radius`,
  UPDATE_WORK_AREA: `${API_BASE_URL}/delivery-agent/work-area`,
  UPDATE_HOME_ADDRESS: `${API_BASE_URL}/delivery-agent/home-address`,
  UPDATE_PROFILE: `${API_BASE_URL}/delivery-agent/profile`,
  GENERATE_UPLOAD_URL: `${API_BASE_URL}/upload/generate-upload-url`,
};
