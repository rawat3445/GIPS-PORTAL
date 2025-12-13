"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.message);

      // Navigate to dashboard based on role
      router.push(`/dashboard/${data.role}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong, try again.");
    }
  };

 return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 sm:px-6 lg:px-8">
     <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
       {/* Header */}
       <div className="text-center mb-8">
         <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
               d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
             />
           </svg>
         </div>
         <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
         <p className="mt-2 text-sm text-gray-600">
           Sign in to access your dashboard
         </p>
       </div>

       {/* Form */}
       <form onSubmit={handleSubmit} className="space-y-5">
         {/* Error Message */}
         {error && (
           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
               <path
                 fillRule="evenodd"
                 d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                 clipRule="evenodd"
               />
             </svg>
             {error}
           </div>
         )}

         {/* Email Field */}
         <div>
           <label
             htmlFor="email"
             className="block text-sm font-medium text-gray-700 mb-2"
           >
             Email Address
           </label>
           <input
             id="email"
             type="email"
             placeholder="Enter your email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
           />
         </div>

         {/* Password Field */}
         <div>
           <label
             htmlFor="password"
             className="block text-sm font-medium text-gray-700 mb-2"
           >
             Password
           </label>
           <input
             id="password"
             type="password"
             placeholder="Enter your password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
           />
         </div>

         {/* Remember & Forgot */}
         <div className="flex items-center justify-between text-sm">
           <label className="flex items-center">
             <input
               type="checkbox"
               className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
             />
             <span className="ml-2 text-gray-700">Remember me</span>
           </label>
           <a
             href="#"
             className="text-indigo-600 hover:text-indigo-700 font-medium"
           >
             Forgot password?
           </a>
         </div>

         {/* Submit Button */}
         <button
           type="submit"
           className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
         >
           Sign In
         </button>
       </form>

       {/* Footer */}
       <div className="mt-6 text-center text-sm text-gray-600">
         Need help? Contact{" "}
         <a
           href="#"
           className="text-indigo-600 hover:text-indigo-700 font-medium"
         >
           IT Support
         </a>
       </div>
     </div>
   </div>
 );

}
