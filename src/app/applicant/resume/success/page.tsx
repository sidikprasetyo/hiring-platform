"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResumeSuccessPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Illustration */}
        <div className="mb-8 flex justify-center">
          <img src="/success-apply.png" alt="No job openings" className="w-48 sm:w-56 md:w-60 mb-6" />
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            Your application was sent!
          </h1>
          <div className="text-gray-600 space-y-2">
            <p>Congratulations! You've taken the first step towards a rewarding career at Rakamin.</p>
            <p>We look forward to learning more about you during the application process.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/applicant/joblist")}
            className="px-8 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Browse More Jobs
          </button>
        </div>
      </div>
    </div>
  );
}