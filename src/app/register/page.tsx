"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Registration is now handled automatically via Google Sign-In.
 * New users are created on first Google login -- no separate registration needed.
 */
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
