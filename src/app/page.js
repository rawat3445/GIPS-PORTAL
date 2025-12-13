import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
export default async function Home() {
  // Show loading page or redirect if token exists
  let token;
  try {
    const cookieStore = cookies();
    token = cookieStore.get?.("token")?.value;
  } catch (err) {
    console.error("Cookie read failed:", err);
  }
  // If token exists, redirect based on role
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role === "admin") return redirect("/dashboard/admin");
      if (payload.role === "faculty") return redirect("/dashboard/faculty");
      if (payload.role === "student") return redirect("../../dashboard/student");
    } catch (err) {
      console.error("Token invalid:", err);
      // Let user see login page
    }
  }

  // If no token, render simple login link or info
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 px-8 py-12 text-center">
        {/* Icon or Logo (optional) */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome to College Portal
        </h1>

        <p className="text-gray-600 text-base mb-8">
          Access your personalized dashboard for attendance, results,
          assignments, and campus updates.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/login"
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200"
          >
            Login to Dashboard
          </a>

          <a
            href="#"
            className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
          >
            Need help?
          </a>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            For technical support, contact IT Department
          </p>
        </div>
      </div>
    </div>
  );
}
