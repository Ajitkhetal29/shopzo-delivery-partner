export function formatAddressLine(address?: {
  formatted?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
} | null) {
  if (!address) return "No address on file";
  return (
    address.formatted ||
    [address.area, address.city, address.state, address.pincode].filter(Boolean).join(", ") ||
    "No address on file"
  );
}

export function getKycBanner(agent: {
  approvalStatus?: string;
  rejectionReason?: string | null;
}) {
  const status = agent.approvalStatus || "incomplete";

  if (status === "incomplete") {
    return {
      tone: "amber" as const,
      title: "Complete your KYC",
      body: "Finish Aadhaar + vehicle docs on Profile. Ops can only approve after you submit.",
      cta: "Go to Profile",
      href: "/profile",
    };
  }

  if (status === "pending") {
    return {
      tone: "blue" as const,
      title: "KYC under review",
      body: "Documents submitted. You can browse the app, but jobs unlock after ops approval.",
      cta: null,
      href: null,
    };
  }

  if (status === "rejected") {
    return {
      tone: "red" as const,
      title: "KYC rejected",
      body:
        agent.rejectionReason ||
        "Update your documents on Profile and resubmit for ops review.",
      cta: "Fix on Profile",
      href: "/profile",
    };
  }

  return null;
}

export function canTakeJobs(agent: { approvalStatus?: string; isActive?: boolean }) {
  return agent.approvalStatus === "approved" && agent.isActive !== false;
}
