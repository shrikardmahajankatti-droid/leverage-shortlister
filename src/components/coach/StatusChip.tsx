import { STATUS_CLASS, STATUS_LABEL, type SubmissionStatus } from "@/lib/status";

export default function StatusChip({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
