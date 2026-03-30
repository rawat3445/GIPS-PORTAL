import { Suspense } from "react";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={children}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
