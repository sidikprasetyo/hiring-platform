/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { LiaMoneyBillWaveSolid } from "react-icons/lia";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function ApplicantJobListPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch jobs dari Supabase
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .in("status", ["Active", "Inactive"])
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedJobs = data.map((job) => ({
          id: job.id,
          title: job.job_name,
          company: job.company_name || "Unknown Company",
          jobPlace: job.job_place || "Unknown Location",
          salaryMin:
            job.salary_min != null
              ? `${new Intl.NumberFormat("id-ID").format(job.salary_min)}`
              : "-",
          salaryMax:
            job.salary_max != null
              ? `${new Intl.NumberFormat("id-ID").format(job.salary_max)}`
              : "-",
          type: job.job_type,
          status: job.status,
          description: job.job_description
            ? job.job_description.split("\n")
            : ["No description available."],
          logo: "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder",
        }));

        setJobs(formattedJobs);
        setSelectedJob(formattedJobs[0] || null);
      } catch (err: any) {
        console.error("Error fetching jobs:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Loading jobs...</p>
      </div>
    );
  }

  if (!loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Image
            src="/no-job.png"
            alt="No job openings"
            width={180}
            height={180}
            className="mx-auto mb-6"
          />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No job openings available
          </h2>
          <p className="text-gray-500 text-sm">
            Please wait for the next batch of openings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left Side - Job Cards */}
          <div className="md:col-span-1 space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`bg-white rounded-lg p-5 cursor-pointer transition-all border-2 ${
                  selectedJob?.id === job.id
                    ? "border-teal-500 shadow-lg"
                    : "border-transparent hover:border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="w-8 h-8"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {job.company}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          job.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-gray-200 mb-2"></div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span>{job.jobPlace}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <LiaMoneyBillWaveSolid size={16} className="flex-shrink-0" />
                    <span>
                      Rp {job.salaryMin} - Rp {job.salaryMax}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Job Details */}
          {selectedJob && (
            <div className="md:col-span-1 lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={selectedJob.logo}
                        alt={selectedJob.company}
                        className="w-8 sm:w-10 h-8 sm:h-10"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-teal-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          {selectedJob.type}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            selectedJob.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {selectedJob.status}
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {selectedJob.title}
                      </h1>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {selectedJob.company}
                      </p>
                    </div>
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={() => {
                      if (selectedJob.status === "Active") {
                        router.push(`/applicant/resume/${selectedJob.id}`);
                      }
                    }}
                    disabled={selectedJob.status !== "Active"}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                      selectedJob.status === "Active"
                        ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {selectedJob.status === "Active" ? "Apply" : "Inactive"}
                  </button>
                </div>

                <div className="border-b border-gray-200 mb-4"></div>

                {/* Job Description */}
                <div className="space-y-4 sm:space-y-6">
                  <ul className="space-y-2 sm:space-y-3">
                    {selectedJob.description.map(
                      (item: string, index: number) => (
                        <li
                          key={index}
                          className="flex gap-2 sm:gap-3 text-gray-700 text-sm sm:text-base leading-relaxed"
                        >
                          <span className="text-teal-500 flex-shrink-0 font-extrabold text-xl sm:text-2x -mt-1">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
