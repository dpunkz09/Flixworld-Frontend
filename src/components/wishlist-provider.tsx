"use client";

import { WishlistContext, useWishlistProvider } from "@/hooks/useWishlist";

export default function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useWishlistProvider();
  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
