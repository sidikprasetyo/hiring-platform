/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import CreateJobDialog from "@/components/CreateJobDialog";
import EditJobDialog from "@/components/EditJobDialog";
import { supabase } from "@/lib/supabaseClient";

export default function JobListPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // === AUTH CHECK ===
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // jika belum login → arahkan ke login
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // jika login tapi bukan admin → arahkan ke halaman applicant
      if (user.email !== "adminhiring@gmail.com") {
        router.push("/applicant/joblist");
        return;
      }

      setUser(user);
      setAuthLoading(false);
    };

    checkUser();

    // listener supaya real-time bila user logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      if (!currentUser) router.push("/auth/login");
      else if (currentUser.email !== "adminhiring@gmail.com") router.push("/applicant/joblist");
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // === FETCH JOBS ===
  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) =>
    (job.job_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // === LOADING STATE ===
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-sm">Checking access...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
          {/* === LEFT SECTION === */}
          <div>
            {/* Search Bar */}
            <div className="relative w-full mb-8">
              <input
                type="text"
                placeholder="Search by job details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#01959f] rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#01959f]"
              />
              <CiSearch className="absolute right-3 top-2.5 text-[#01959f]" size={20} />
            </div>

            {/* === Job List === */}
            {loading ? (
              <p>Loading jobs...</p>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition"
                  >
                    {/* Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-lg border 
                          ${
                            job.status === "Draft"
                              ? "border-gray-300 text-gray-500"
                              : job.status === "Active"
                              ? "border-green-400 text-green-600"
                              : job.status === "Inactive"
                              ? "border-red-400 text-red-600"
                              : ""
                          }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-500 rounded-lg border px-3 py-1">
                        started on{" "}
                        {new Date(job.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Job Title + Salary */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">
                          {job.job_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {job.salary_min && job.salary_max
                            ? `Rp ${Number(job.salary_min).toLocaleString("id-ID")} - Rp ${Number(
                                job.salary_max
                              ).toLocaleString("id-ID")}`
                            : job.salary_min
                            ? `Rp ${Number(job.salary_min).toLocaleString("id-ID")}`
                            : "Salary not specified"}
                        </p>
                      </div>

                      <div className="flex flex-wrap md:justify-end gap-2">
                        <Link
                          href={`/admin/managecandidate/${job.id}`}
                          className="mt-3 bg-yellow-400 hover:bg-yellow-500 text-[#2a2a2a] text-xs font-semibold px-3 py-2 rounded-lg transition"
                        >
                          View Applicants
                        </Link>
                        <EditJobDialog
                          job={job}
                          triggerText="Manage Job"
                          onUpdate={(updatedJob) =>
                            setJobs((prev) =>
                              prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
                            )
                          }
                          onDelete={(jobId) =>
                            setJobs((prev) => prev.filter((j) => j.id !== jobId))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 text-center">
                <img
                  src="/no-job.png"
                  alt="No job openings"
                  className="w-48 sm:w-56 md:w-60 mb-6"
                />
                <p className="font-medium text-gray-700 mb-2 text-base sm:text-lg">
                  No job openings available
                </p>
                <p className="text-sm text-gray-500 mb-6 max-w-md">
                  Create a job opening now and start the candidate process.
                </p>
                <CreateJobDialog
                  triggerText="Create a new job"
                  variant="secondary"
                  onCreate={(newJob) => setJobs((prev) => [newJob, ...prev])}
                />
              </div>
            )}
          </div>

          {/* === SIDE CARD === */}
          <div className="bg-white rounded-xl shadow-lg p-4 bg-[url('/side-card-bg.jpg')] bg-cover bg-center relative overflow-hidden min-h-[150px] justify-center items-center">
            <div className="absolute inset-0 bg-black/60 rounded-xl" />
            <div className="relative z-10 px-1">
              <p className="text-base font-semibold text-white mt-3 mb-1 leading-snug">
                Recruit the best candidates
              </p>
              <p className="text-sm text-gray-200 mb-4">
                Create jobs, invite, and hire with ease
              </p>
              <CreateJobDialog
                triggerText="Create a new job"
                variant="primary"
                onCreate={(newJob) => setJobs((prev) => [newJob, ...prev])}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
