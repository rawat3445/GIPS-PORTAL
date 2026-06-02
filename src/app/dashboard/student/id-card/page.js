import { redirect } from "next/navigation";
import { requireStudent } from "../../../lib/auth";

export default async function StudentIdCardPage() {
  const auth = await requireStudent();

  if (!auth.ok) {
    redirect("/login");
  }

  redirect("/dashboard/student");
}
