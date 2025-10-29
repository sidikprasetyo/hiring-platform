/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { LuChevronRight } from "react-icons/lu";
import { MdLogout } from "react-icons/md";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const paths = useMemo(() => pathname.split("/").filter((p) => p && p !== "admin"), [pathname]);

  // === Supabase Auth ===
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // === Ambil job_name kalau halaman managecandidate ===
  const [jobName, setJobName] = useState<string | null>(null);
  const [jobLoading, setJobLoading] = useState(false);

  useEffect(() => {
    const fetchJobName = async () => {
      if (paths[0] === "managecandidate" && paths[1]) {
        setJobLoading(true);
        const { data, error } = await supabase.from("jobs").select("job_name").eq("id", paths[1]).single();

        if (!error && data) setJobName(data.job_name);
        else setJobName(null);

        setJobLoading(false);
      } else {
        setJobName(null);
      }
    };

    fetchJobName();
  }, [paths]);

  // === Breadcrumb ===
  const breadcrumb = (() => {
    if (pathname === "/applicant/joblist") {
      return (
        <Breadcrumb>
          <BreadcrumbItem>
            <span className="text-[#01959f] font-bold text-lg">Job List</span>
          </BreadcrumbItem>
        </Breadcrumb>
      );
    }

    return (
      <Breadcrumb className="flex items-center space-x-1">
        {paths.length === 0 ? (
          <BreadcrumbItem>
            <span className="font-semibold text-[#01959f]">Dashboard</span>
          </BreadcrumbItem>
        ) : (
          paths.map((segment, index) => {
            const isLast = index === paths.length - 1;
            let href = "/" + ["admin", ...paths.slice(0, index + 1)].join("/");
            let displaySegment = segment.replace(/-/g, " ");

            if (paths[0] === "joblist") {
              displaySegment = "Job List";
              href = "/admin/joblist";
            }

            if (paths[0] === "managecandidate") {
              if (index === 0) {
                displaySegment = "Job List";
                href = "/admin/joblist";
              }
              if (index === 1) {
                displaySegment = jobLoading ? "Loading..." : jobName || "Manage Candidate";
              }
            }

            return (
              <BreadcrumbItem key={href} className="flex items-center space-x-1">
                {isLast ? (
                  <span className="font-semibold text-[#01959f] capitalize">{displaySegment}</span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="capitalize text-gray-600 hover:text-[#01959f]">
                      {displaySegment}
                    </Link>
                  </BreadcrumbLink>
                )}
                {!isLast && <LuChevronRight className="w-4 h-4 text-gray-400" />}
              </BreadcrumbItem>
            );
          })
        )}
      </Breadcrumb>
    );
  })();

  // === User Dropdown or Login Button ===
  const userInfo = (() => {
    if (loading) {
      return <div className="animate-pulse w-9 h-9 bg-gray-200 rounded-full" />;
    }

    if (!user) {
      return (
        <Button variant="outline" className="text-[#01959f] border-[#01959f] hover:bg-[#01959f] hover:text-white transition" onClick={() => router.push("/auth/login")}>
          Login
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <img src={user?.user_metadata?.avatar_url || "/admin.png"} alt="User Avatar" className="w-9 h-9 rounded-full border cursor-pointer hover:opacity-90 transition" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56 mt-2" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold text-[#01959f]">{user?.user_metadata?.full_name || "Guest"}</span>
              <span className="text-xs text-gray-500 truncate">{user?.email || "No email"}</span>
              <span className="text-xs text-[#01959f]">{user?.email === "adminhiring@gmail.com" ? "Admin" : "Client"}</span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-600">
            <MdLogout className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  })();

  return (
    <nav className="bg-white text-gray-800 w-full px-6 py-3 flex items-center justify-between border-b border-gray-200">
      {breadcrumb}
      {userInfo}
    </nav>
  );
}
