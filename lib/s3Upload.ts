import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadDeliveryDoc(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP image");
  }
  if (file.size < 1 || file.size > MAX_BYTES) {
    throw new Error("Each document must be under 5 MB");
  }

  const { data } = await axios.post(
    API_ENDPOINTS.GENERATE_UPLOAD_URL,
    {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      type: "deliveryDoc",
    },
    { withCredentials: true },
  );

  if (!data?.success || !data.uploadUrl || !data.fileUrl) {
    throw new Error(data?.message || "Failed to generate upload URL");
  }

  await axios.put(data.uploadUrl, file, {
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  return data.fileUrl as string;
}
