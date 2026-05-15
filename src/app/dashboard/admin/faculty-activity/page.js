import AdminActivityLogsPage from "../activity-logs/page";

export default function AdminFacultyActivityPage() {
  return (
    <AdminActivityLogsPage
      lockedRole="faculty"
      badgeLabel="Faculty Activity"
      pageTitle="Faculty Activity Timeline"
      pageDescription="Review all faculty actions including sign-ins, page visits, attendance submissions, and other tracked work."
      showStudentReport={false}
    />
  );
}
