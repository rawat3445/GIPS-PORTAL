import { AdminAttendancePageContent } from "../page";

export default function PendingAttendanceApprovalPage() {
  return (
    <AdminAttendancePageContent
      initialStatus="pending"
      lockStatusFilter={true}
      pageTitle="Pending Attendance Approval"
      pageDescription="Review faculty-submitted attendance and approve or deny it before students can see it."
    />
  );
}
