/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface JobData {
  id: string;
  title: string;
  companyName: string;
  type: string;
  description: string;
  jobPlace: string;
  candidates: string;
  minSalary: string;
  maxSalary: string;
  status: string;
  profileFields?: Record<string, string>;
}

interface EditJobDialogProps {
  job: JobData;
  triggerText?: string;
  variant?: "primary" | "secondary";
  onUpdate?: (updatedJob: JobData) => void;
  onDelete?: (jobId: string) => void;
}

export default function EditJobDialog({ job, triggerText = "Edit Job", variant = "primary", onUpdate, onDelete }: EditJobDialogProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const defaultProfileFields = {
    fullname: "Mandatory",
    photo: "Mandatory",
    gender: "Mandatory",
    domicile: "Mandatory",
    email: "Mandatory",
    phone: "Mandatory",
    linkedin: "Mandatory",
    dob: "Mandatory",
  };

  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedJob, setEditedJob] = useState<JobData>({
    id: "",
    title: "",
    companyName: "",
    type: "",
    description: "",
    jobPlace: "",
    candidates: "",
    minSalary: "",
    maxSalary: "",
    status: "Draft",
    profileFields: defaultProfileFields,
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Load full job data from database when dialog opens
  useEffect(() => {
    if (open && job.id) {
      const loadJobData = async () => {
        setLoadingData(true);
        try {
          console.log("Job data received:", job);

          // Fetch job data from database
          const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", job.id).single();

          if (jobError) throw jobError;

          console.log("Job data from DB:", jobData);

          // Fetch job requirements
          const { data: requirements, error: reqError } = await supabase.from("job_requirements").select("field_name, requirement_type").eq("job_id", job.id);

          if (reqError) throw reqError;

          // Convert requirements array to profileFields object
          const profileFieldsFromDb: Record<string, string> = { ...defaultProfileFields };
          requirements?.forEach((req) => {
            if (req.field_name && req.requirement_type) {
              profileFieldsFromDb[req.field_name] = req.requirement_type.charAt(0).toUpperCase() + req.requirement_type.slice(1);
            }
          });

          // Set edited job with data from database
          setEditedJob({
            id: jobData.id || "",
            title: jobData.job_name || "",
            companyName: jobData.company_name || "",
            type: jobData.job_type || "",
            description: jobData.job_description || "",
            jobPlace: jobData.job_place || "",
            candidates: jobData.candidate_needed?.toString() || "",
            minSalary: jobData.salary_min ? new Intl.NumberFormat("id-ID").format(jobData.salary_min) : "",
            maxSalary: jobData.salary_max ? new Intl.NumberFormat("id-ID").format(jobData.salary_max) : "",
            status: jobData.status || "Draft",
            profileFields: profileFieldsFromDb,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error("Error loading job data:", err);
          toast.error("Failed to load job data");
        } finally {
          setLoadingData(false);
        }
      };

      loadJobData();
    }
  }, [open, job.id]);

  // Format salary input dengan Rp prefix
  const handleSalaryChange = (field: "minSalary" | "maxSalary", value: string) => {
    // Remove non-numeric characters except for formatting
    const numericValue = value.replace(/[^\d]/g, "");

    // Format dengan thousand separator
    const formatted = numericValue ? new Intl.NumberFormat("id-ID").format(parseInt(numericValue)) : "";

    setEditedJob({ ...editedJob, [field]: formatted });
  };

  const toggleField = (field: keyof typeof defaultProfileFields, value: string) => {
    setEditedJob((prev) => ({
      ...prev,
      profileFields: { ...prev.profileFields, [field]: value },
    }));
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return editedJob?.title?.trim() !== "" && editedJob?.companyName?.trim() !== "" && editedJob?.type !== "" && editedJob?.description?.trim() !== "" && editedJob?.candidates?.trim() !== "" && editedJob?.jobPlace?.trim() !== "";
  };

  // Update ke Supabase
  const handleUpdate = async () => {
    setLoading(true);

    try {
      // Update tabel utama "jobs" dan ambil hasilnya
      const { data: updatedJob, error: jobError } = await supabase
        .from("jobs")
        .update({
          job_name: editedJob.title,
          job_type: editedJob.type,
          company_name: editedJob.companyName,
          job_description: editedJob.description,
          job_place: editedJob.jobPlace,
          candidate_needed: parseInt(editedJob.candidates),
          salary_min: editedJob.minSalary ? parseInt(editedJob.minSalary.replace(/\D/g, "")) : null,
          salary_max: editedJob.maxSalary ? parseInt(editedJob.maxSalary.replace(/\D/g, "")) : null,
          status: editedJob.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedJob.id)
        .select()
        .single(); // ✅ ambil hasil barunya langsung

      if (jobError) throw jobError;

      // Update tabel job_requirements
      await supabase.from("job_requirements").delete().eq("job_id", editedJob.id);

      const requirements = Object.entries(editedJob.profileFields || {}).map(([field, type]) => ({
        job_id: editedJob.id,
        field_name: field,
        requirement_type: type.toLowerCase(),
      }));

      const { error: reqError } = await supabase.from("job_requirements").insert(requirements);
      if (reqError) throw reqError;

      // Kirim hasil job yang sudah diupdate dari Supabase ke parent
      if (updatedJob) {
        onUpdate?.(updatedJob); // ✅ ini sekarang object hasil update yang lengkap
      }

      setOpen(false);
      toast.success("Job has been successfully updated!");
    } catch (err: any) {
      console.error("Error updating job:", err.message);
      toast.error(`Failed to update job: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete job di Supabase
  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", job.id);
      if (error) throw error;

      onDelete?.(job.id);
      setDeleteDialogOpen(false);
      setOpen(false);

      toast.success("Job has been successfully deleted!");
      router.refresh();
    } catch (err: any) {
      console.error("Error deleting job:", err.message);
      toast.error(`Failed to delete job: ${err.message}`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-3 bg-[#01959f] hover:bg-[#017c7f] text-white px-3 py-2 rounded-lg transition text-xs font-semibold cursor-pointer">{triggerText}</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>Update job details or delete this job.</DialogDescription>
          </DialogHeader>

          {/* Scrollable Form */}
          <div className="overflow-y-auto flex-1 pr-2 py-2 space-y-5">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Loading job data...</p>
              </div>
            ) : (
              <>
                {/* Job Title */}
                <div>
                  <label className="text-sm font-medium">
                    Job Name<span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Ex. Front End Engineer" value={editedJob.title} onChange={(e) => setEditedJob({ ...editedJob, title: e.target.value })} />
                </div>

                {/* Company Name */}
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input placeholder="Ex. Google" value={editedJob.companyName} onChange={(e) => setEditedJob({ ...editedJob, companyName: e.target.value })} />
                </div>

                {/* Job Type */}
                <div>
                  <label className="text-sm font-medium">
                    Job Type<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editedJob.type}
                    onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#01959f] text-gray-700 bg-white ${editedJob.type === "" ? "text-gray-400" : ""}`}
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
                    value={editedJob.description}
                    onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                    className="border rounded-md p-2 text-sm min-h-[100px] w-full focus:outline-none focus:ring-1 focus:ring-[#01959f]"
                  />
                </div>

                {/* Job Placement Location */}
                <div>
                  <label className="text-sm font-medium">
                    Job Placement Location<span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Ex. Jakarta" value={editedJob.jobPlace} onChange={(e) => setEditedJob({ ...editedJob, jobPlace: e.target.value })} />
                </div>

                {/* Number of Candidates */}
                <div>
                  <label className="text-sm font-medium">
                    Number of Candidate Needed<span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Ex. 2" type="number" min="1" value={editedJob.candidates} onChange={(e) => setEditedJob({ ...editedJob, candidates: e.target.value })} />
                </div>

                {/* Salary Range */}
                <div>
                  <label className="text-sm font-medium">Job Salary</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Minimum Estimated Salary</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                        <Input placeholder="7.000.000" value={editedJob.minSalary} onChange={(e) => handleSalaryChange("minSalary", e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Maximum Estimated Salary</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                        <Input placeholder="8.000.000" value={editedJob.maxSalary} onChange={(e) => handleSalaryChange("maxSalary", e.target.value)} className="pl-10" />
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
                          checked={editedJob.status === status}
                          onChange={(e) => setEditedJob({ ...editedJob, status: e.target.value })}
                          className="w-4 h-4 text-[#01959f] focus:ring-[#01959f] cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Minimum Profile Information */}
                <div>
                  <h3 className="font-medium text-gray-800 mt-2 mb-2">Minimum Profile Information Required</h3>
                  <div className="space-y-3">
                    {Object.keys(editedJob.profileFields || defaultProfileFields).map((key) => (
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
                              onClick={() => toggleField(key as keyof typeof defaultProfileFields, opt)}
                              className={`px-3 py-1 text-xs rounded-full border transition ${
                                editedJob.profileFields?.[key] === opt
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
              </>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0 border-t pt-3 mt-2 bg-white flex justify-between gap-2">
            <Button onClick={() => setDeleteDialogOpen(true)} className="bg-red-500 hover:bg-red-600 text-white cursor-pointer" disabled={loading || loadingData}>
              Delete Job
            </Button>
            <Button onClick={handleUpdate} disabled={loading || loadingData || !isFormValid()} className="bg-[#01959f] hover:bg-[#017c7f] text-white cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting
              <span className="font-semibold text-gray-900"> &quot;{job.title || (job as any).job_name}&quot;</span> and remove all associated data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
