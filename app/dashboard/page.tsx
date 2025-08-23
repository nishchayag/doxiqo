"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Import the original dashboard content
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/landing");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null; // Will redirect
  }

  return <DashboardContent />;
}
