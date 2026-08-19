"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import ChatButton from "@/components/chat/chat-button";

/**
 * Renders the main site chrome (Navbar, Footer, BottomNav) only when
 * NOT on an admin route. Admin pages have their own full-screen layout.
 */
export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
      {/* Floating live chat — available on all public pages */}
      <ChatButton />
    </>
  );
}
