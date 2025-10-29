"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Camera, CheckCircle } from "lucide-react";
import { MdPermDeviceInformation } from "react-icons/md";
import HandPoseCameraModal from "@/components/HandPoseCameraDialog";
import { Regions } from "@/lib/region";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface FormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  domicile: string;
  phoneNumber: string;
  email: string;
  linkedinUrl: string;
  photoUrl: string;
}

export default function ResumePage() {
  const router = useRouter();
  const { jobId } = useParams();

  // Semua hooks dideklarasikan di sini (tidak boleh di bawah conditional)
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dateOfBirth: "",
    gender: "She/Her (Female)",
    domicile: "",
    phoneNumber: "",
    email: "",
    linkedinUrl: "",
    photoUrl: "",
  });

  const [profileImage, setProfileImage] = useState<string>("/placeholder-resume.jpg");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(formData.phoneNumber || "");

  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isValidLinkedIn, setIsValidLinkedIn] = useState(false);

  // 🔐 Cek user login
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
      }

      setAuthLoading(false);
    };

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.push("/auth/login");
      else setUser(session.user);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // ✅ Semua hooks selesai didefinisikan di atas

  // Cek validasi email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(formData.email));
  }, [formData.email]);

  // Cek validasi LinkedIn URL
  useEffect(() => {
    const linkedinRegex = /^linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/;
    setIsValidLinkedIn(linkedinRegex.test(formData.linkedinUrl));
  }, [formData.linkedinUrl]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Simpan hasil foto dari kamera
  const handleCameraCapture = async (imageUrl: string) => {
    try {
      // 1️⃣ Ubah base64 jadi blob
      const base64Data = imageUrl.split(",")[1];
      const blob = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `profile_${Date.now()}.jpg`;

      // 2️⃣ Upload ke Supabase Storage
      const { data, error } = await supabase.storage.from("profile-photos").upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

      if (error) throw error;

      // 3️⃣ Ambil URL publik
      const { data: publicUrlData } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

      const photoUrl = publicUrlData.publicUrl;

      // 4️⃣ Simpan ke form + tampilkan langsung
      setFormData((prev) => ({
        ...prev,
        photoUrl,
      }));

      // ✅ Tambahkan ini agar langsung muncul
      setProfileImage(photoUrl);

      console.log("✅ Foto berhasil diupload:", photoUrl);
    } catch (err) {
      console.error("❌ Gagal upload foto:", err);
      alert("Gagal mengunggah foto. Coba lagi.");
    }
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof FormData)[] = ["fullName", "dateOfBirth", "domicile", "phoneNumber", "email", "linkedinUrl"];

    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 1️⃣ Simpan data ke tabel candidates
      const { data: candidateData, error: candidateError } = await supabase
        .from("candidates")
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phoneNumber,
            date_of_birth: formData.dateOfBirth,
            domicile: formData.domicile,
            gender: formData.gender.includes("Female") ? "Female" : "Male", // handle teks
            linkedin: formData.linkedinUrl,
            photo_url: formData.photoUrl,
          },
        ])
        .select()
        .single();

      if (candidateError) throw candidateError;

      console.log("✅ Candidate saved:", candidateData);

      // 2️⃣ Simpan data ke tabel applications
      const { error: appError } = await supabase.from("applications").insert([
        {
          job_id: jobId, // dari parameter URL
          candidate_id: candidateData.id, // dari hasil insert candidate
        },
      ]);

      if (appError) throw appError;

      console.log("✅ Application saved");

      // 3️⃣ Redirect ke halaman sukses
      router.push("/applicant/resume/success");
    } catch (error: any) {
      console.error("❌ Error submitting form:", error);
      alert("Failed to submit resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚡ Return ditempatkan paling bawah
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-sm">Checking authentication...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="min-w-full mx-auto pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => router.push("/applicant/joblist")} className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                  <h1 className="text-base font-medium text-gray-900">Apply Front End at Rakamin</h1>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-red-500 text-xs">*</span>
                    <span className="text-xs text-gray-500">Required</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <MdPermDeviceInformation className="w-4 h-4" />
                <span className="text-xs text-gray-500">This field required to fill</span>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="space-y-6 pt-4">
            {/* Photo Profile */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">Photo Profile</p>
              <div className="flex flex-col items-start gap-3">
                <img src={profileImage || "/placeholder-resume.jpg"} onError={(e) => (e.currentTarget.src = "/placeholder-resume.jpg")} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-teal-100" />

                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="flex items-center gap-2 px-4 py-2  text-teal-700 border border-teal-700 rounded-md text-sm font-medium hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Take a Picture
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of birth<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pronoun (gender)<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex gap-8">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="She/Her (Female)"
                    checked={formData.gender === "She/Her (Female)"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">She/Her (Female)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="He/Him (Male)"
                    checked={formData.gender === "He/Him (Male)"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">He/Him (Male)</span>
                </label>
              </div>
            </div>

            {/* Domicile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domicile<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.domicile}
                  onChange={(e) => handleInputChange("domicile", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="" hidden>
                    Choose your domicile
                  </option>
                  {Regions.map((region, index) => (
                    <option key={index} value={`${region.name} - ${region.province}`}>
                      {region.name} - {region.province}
                    </option>
                  ))}
                </select>

                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number<span className="text-red-500 ml-0.5">*</span>
              </label>

              <PhoneInput
                country={"id"} // default Indonesia 🇮🇩
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  handleInputChange("phoneNumber", value);
                }}
                inputStyle={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  borderColor: "#d1d5db", // gray-300
                  fontSize: "14px",
                }}
                buttonStyle={{
                  border: "none",
                  background: "transparent",
                }}
                dropdownStyle={{
                  width: "300px",
                }}
                placeholder="812345678900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="email"
                placeholder="budiyanto@mail.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link LinkedIn<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="url"
                placeholder="linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />

              {/* ✅ Validasi tampil jika URL benar */}
              {formData.linkedinUrl && isValidLinkedIn && (
                <div className="flex items-center gap-2 mt-2 text-teal-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>URL address found</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-teal-600 text-white py-3 rounded-md font-medium text-sm hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kamera */}
      <HandPoseCameraModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} onCapture={handleCameraCapture} />
    </div>
  );
}
