export const SUBMISSION_STATUSES = ["queued", "researching", "ready", "reviewed", "sent", "failed"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  queued: "Queued",
  researching: "Researching",
  ready: "Ready for review",
  reviewed: "Reviewed",
  sent: "Sent",
  failed: "Failed",
};

export const STATUS_CLASS: Record<SubmissionStatus, string> = {
  queued: "bg-slate-100 text-slate-800",
  researching: "bg-amber-100 text-amber-900",
  ready: "bg-blue-100 text-blue-900",
  reviewed: "bg-violet-100 text-violet-900",
  sent: "bg-green-100 text-green-900",
  failed: "bg-red-100 text-red-900",
};

export const LEVEL_LABEL: Record<string, string> = { bachelor: "Bachelor's", master: "Master's", phd: "PhD" };
