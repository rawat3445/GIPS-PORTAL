import StudentForm from "../../../../components/StudentForm";

export default function FacultyAddStudentPage() {
  return (
    <StudentForm
      apiEndpoint="/api/faculty/students"
      redirectPath="/dashboard/faculty/students"
      hideCourseField={true}
    />
  );
}
