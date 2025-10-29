"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateJobDialogProps {
  triggerText?: string;
  variant?: "primary" | "secondary";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreate?: (newJob: any) => void;
}

export default function CreateJobDialog({ triggerText = "Create a new job", variant = "primary", onCreate }: CreateJobDialogProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    companyName: "",
    type: "",
    description: "",
    jobPlace: "",
    candidates: "",
    minSalary: "",
    maxSalary: "",
    status: "Draft",
  });

  const [profileFields, setProfileFields] = useState({
    fullname: "Mandatory",
    photo: "Mandatory",
    gender: "Mandatory",
    domicile: "Mandatory",
    email: "Mandatory",
    phone: "Mandatory",
    linkedin: "Mandatory",
    dob: "Mandatory",
  });

  const toggleField = (field: keyof typeof profileFields, value: string) => {
    setProfileFields((prev) => ({ ...prev, [field]: value }));
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return newJob.title.trim() !== "" && newJob.companyName.trim() !== "" && newJob.type !== "" && newJob.description.trim() !== "" && newJob.candidates.trim() !== "" && newJob.jobPlace.trim() !== "";
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);

    try {
      // === 1️⃣ Insert job into "jobs" table ===
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert([
          {
            job_name: newJob.title,
            company_name: newJob.companyName,
            job_type: newJob.type,
            job_description: newJob.description,
            job_place: newJob.jobPlace,
            candidate_needed: parseInt(newJob.candidates),
            salary_min: newJob.minSalary ? parseInt(newJob.minSalary.replace(/\D/g, "")) : null,
            salary_max: newJob.maxSalary ? parseInt(newJob.maxSalary.replace(/\D/g, "")) : null,
            status: newJob.status,
          },
        ])
        .select()
        .single();

      if (jobError) throw jobError;

      // ✅ Panggil callback parent
      onCreate?.(jobData);

      const jobId = jobData.id;

      // === 2️⃣ Insert profile requirements into "job_requirements" ===
      const requirementsArray = Object.entries(profileFields).map(([field, type]) => ({
        job_id: jobId,
        field_name: field,
        requirement_type: type.toLowerCase(),
      }));

      const { error: reqError } = await supabase.from("job_requirements").insert(requirementsArray);
      if (reqError) throw reqError;

      // ✅ Reset form & close modal
      setNewJob({
        title: "",
        companyName: "",
        type: "",
        description: "",
        jobPlace: "",
        candidates: "",
        minSalary: "",
        maxSalary: "",
        status: "Draft",
      });
      setProfileFields({
        fullname: "Mandatory",
        photo: "Mandatory",
        gender: "Mandatory",
        domicile: "Mandatory",
        email: "Mandatory",
        phone: "Mandatory",
        linkedin: "Mandatory",
        dob: "Mandatory",
      });
      setOpen(false);
      toast.success("Job created successfully!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating job:", err);
      toast.error(`Failed to create job: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button
          className={`${variant === "primary" ? "bg-[#01959f] hover:bg-[#017c7f] text-white w-full py-2" : "bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2.5 sm:text-base"} rounded-lg transition text-sm font-semibold cursor-pointer`}
        >
          {triggerText}
        </Button>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Job Opening</DialogTitle>
          <DialogDescription>Fill in the job details below to publish a new opening.</DialogDescription>
        </DialogHeader>

        {/* Scrollable Area */}
        <div className="overflow-y-auto flex-1 pr-2 py-2 space-y-5">
          {/* Job Name */}
          <div>
            <label className="text-sm font-medium">
              Job Name<span className="text-red-500">*</span>
            </label>
            <Input placeholder="Ex. Front End Engineer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} />
          </div>

          {/* Company Name */}
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input placeholder="Ex. Google" value={newJob.companyName} onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })} />
          </div>

          {/* Job Type */}
          <div>
            <label className="text-sm font-medium">
              Job Type<span className="text-red-500">*</span>
            </label>
            <select
              value={newJob.type}
              onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#01959f] text-gray-700 bg-white ${newJob.type === "" ? "text-gray-400" : ""}`}
            >
              <option value="" hidden>
                Select job type
              </option>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {/* Job Description */}
          <div>
            <label className="text-sm font-medium">
              Job Description<span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Ex. Job responsibilities, required skills, etc."
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="border rounded-md p-2 text-sm min-h-[100px] w-full focus:outline-none focus:ring-1 focus:ring-[#01959f]"
            />
          </div>

          {/* Job Placement Location */}
          <div>
            <label className="text-sm font-medium">
              Job Placement Location<span className="text-red-500">*</span>
            </label>
            <Input placeholder="Ex. Jakarta" value={newJob.jobPlace} onChange={(e) => setNewJob({ ...newJob, jobPlace: e.target.value })} />
          </div>

          {/* Number of Candidates */}
          <div>
            <label className="text-sm font-medium">
              Number of Candidate Needed<span className="text-red-500">*</span>
            </label>
            <Input placeholder="Ex. 2" value={newJob.candidates} onChange={(e) => setNewJob({ ...newJob, candidates: e.target.value })} />
          </div>

          {/* Salary Range */}
          <div>
            <label className="text-sm font-medium">Job Salary</label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Minimum Estimated Salary */}
              <div className="flex-1">
                <label className="text-xs text-gray-500">Minimum Estimated Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm">Rp</span>
                  <Input
                    placeholder="7.000.000"
                    value={newJob.minSalary ? new Intl.NumberFormat("id-ID").format(Number(newJob.minSalary.replace(/\D/g, ""))) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, ""); // hapus semua non-digit
                      setNewJob({ ...newJob, minSalary: raw });
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Maximum Estimated Salary */}
              <div className="flex-1">
                <label className="text-xs text-gray-500">Maximum Estimated Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm">Rp</span>
                  <Input
                    placeholder="8.000.000"
                    value={newJob.maxSalary ? new Intl.NumberFormat("id-ID").format(Number(newJob.maxSalary.replace(/\D/g, ""))) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setNewJob({ ...newJob, maxSalary: raw });
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Job Status */}
          <div>
            <label className="text-sm font-medium">Job Status</label>
            <div className="flex gap-4 mt-2">
              {["Draft", "Active", "Inactive"].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jobStatus"
                    value={status}
                    checked={newJob.status === status}
                    onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                    className="w-4 h-4 text-[#01959f] focus:ring-[#01959f] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Profile Requirements */}
          <div>
            <h3 className="font-medium text-gray-800 mt-2 mb-2">Minimum Profile Information Required</h3>
            <div className="space-y-3">
              {Object.keys(profileFields).map((key) => (
                <div key={key} className="flex items-center justify-between py-2 border-b">
                  <span className="capitalize text-sm text-gray-700">
                    {key === "dob"
                      ? "Date of birth"
                      : key === "linkedin"
                      ? "LinkedIn link"
                      : key === "phone"
                      ? "Phone number"
                      : key === "photo"
                      ? "Photo Profile"
                      : key === "fullname"
                      ? "Full name"
                      : key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <div className="flex gap-2">
                    {["Mandatory", "Optional", "Off"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleField(key as keyof typeof profileFields, opt)}
                        className={`px-3 py-1 text-xs rounded-full border transition ${
                          profileFields[key as keyof typeof profileFields] === opt
                            ? opt === "Mandatory"
                              ? "bg-[#01959f] text-white border-[#01959f]"
                              : opt === "Optional"
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "bg-gray-300 text-gray-700 border-gray-300"
                            : "bg-transparent border-gray-300 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t pt-3 mt-2 bg-white">
          <Button onClick={handleSave} disabled={loading || !isFormValid()} className="bg-[#01959f] hover:bg-[#017c7f] text-white cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
            {loading ? "Publishing..." : "Publish Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
