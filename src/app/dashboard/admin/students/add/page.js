import StudentForm from "../../../../components/StudentForm";

export default function AdminAddStudentPage() {
  return (
    <StudentForm
      apiEndpoint="/api/admin/users"
      redirectPath="/dashboard/admin/students"
      hideCourseField={false}
    />
  );
}
