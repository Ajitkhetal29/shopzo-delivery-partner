import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

export async function uploadDeliveryDoc(file: File) {
  const { data } = await axios.post(
    API_ENDPOINTS.GENERATE_UPLOAD_URL,
    {
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
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
