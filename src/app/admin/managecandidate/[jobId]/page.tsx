/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

export default function ManageCandidatePage() {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // === FETCH DATA DARI SUPABASE ===
  useEffect(() => {
    const fetchJobAndCandidates = async () => {
      try {
        // 🔹 Ambil data job berdasarkan ID
        const { data: jobData, error: jobError } = await supabase.from("jobs").select("job_name").eq("id", jobId).single();

        if (jobError) throw jobError;
        setJob(jobData);

        // 🔹 Ambil data lamaran berdasarkan jobId, join dengan tabel candidates
        const { data, error } = await supabase
          .from("applications")
          .select(
            `
            id,
            applied_at,
            candidates (
              id,
              full_name,
              email,
              phone,
              date_of_birth,
              domicile,
              gender,
              linkedin
            )
          `
          )
          .eq("job_id", jobId)
          .order("applied_at", { ascending: false });

        if (error) throw error;

        // 🔹 Format hasil join
        const formatted = data
          .map((app) =>
            app.candidates.map((cand) => ({
              id: cand.id,
              name: cand.full_name,
              email: cand.email,
              phone: cand.phone,
              date_of_birth: cand.date_of_birth,
              domicile: cand.domicile,
              gender: cand.gender,
              linkedin: cand.linkedin,
            }))
          )
          .flat(); // flat() untuk gabungkan array

        setCandidates(formatted);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchJobAndCandidates();
  }, [jobId]);

  // === COLUMN WIDTH LOGIC ===
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 50,
    name: 150,
    email: 200,
    phone: 150,
    dob: 150,
    domicile: 120,
    gender: 100,
    linkedin: 200,
  });

  const [resizing, setResizing] = useState<any>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (columnKey: keyof typeof columnWidths) => (e: any) => {
    setResizing({ columnKey, startX: e.pageX, startWidth: columnWidths[columnKey] });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.pageX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);

      setColumnWidths((prev) => ({
        ...prev,
        [resizing.columnKey]: newWidth,
      }));
    };

    const handleMouseUp = () => setResizing(null);

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  const columnKeys = ["checkbox", "name", "email", "phone", "dob", "domicile", "gender", "linkedin"] as const;
  type ColumnKey = (typeof columnKeys)[number];

  // === RENDER ===
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">{job ? <span className="text-teal-600"> {job.job_name}</span> : ""}</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-500">Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center min-h-[78vh]">
              <img src="/no-applicant.webp" alt="No candidates" className="w-65 -mb-4" />
              <p className="font-medium text-gray-700 text-lg">No candidates found</p>
              <p className="text-sm text-gray-500">Share your job vacancy so that more candidates will apply.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" ref={tableRef}>
              <table className="w-full border-collapse" style={{ minWidth: "1200px" }}>
                <thead>
                  <tr className="bg-white border-b">
                    {columnKeys.map((key: ColumnKey) => (
                      <th key={key} style={{ width: `${columnWidths[key]}px` }} className="relative p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        {key === "checkbox" ? <input type="checkbox" className="w-4 h-4" /> : key.replace("_", " ")}
                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500" onMouseDown={handleMouseDown(key)} />
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {candidates.map((c, idx) => (
                    <tr key={c.id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="p-3 border-r border-gray-200">
                        <input type="checkbox" className="w-4 h-4" />
                      </td>
                      <td className="p-3 text-sm text-gray-900 border-r border-gray-200">{c.name}</td>
                      <td className="p-3 text-sm text-gray-700 border-r border-gray-200">{c.email}</td>
                      <td className="p-3 text-sm text-gray-700 border-r border-gray-200">{c.phone}</td>
                      <td className="p-3 text-sm text-gray-700 border-r border-gray-200">{c.dob}</td>
                      <td className="p-3 text-sm text-gray-700 border-r border-gray-200">{c.domicile}</td>
                      <td className="p-3 text-sm text-gray-700 border-r border-gray-200">{c.gender}</td>
                      <td className="p-3 text-sm">
                        <a href={c.linkedin} target="_blank" className="text-blue-600 hover:underline">
                          {c.linkedin}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
