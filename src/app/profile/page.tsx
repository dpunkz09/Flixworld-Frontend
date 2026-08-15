"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ArrowLeft, Check, Bookmark, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileApi } from "@/lib/auth-api";
import { useAuth } from "@/hooks/useAuth";
import { resolveStorageUrl } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading, updateUser, logout } = useAuth();

  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track object URLs we've created so we can revoke them
  const objectUrlRef = useRef<string | null>(null);
  // Track success timeout so we can cancel it on unmount
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect unauthenticated users once loading is done
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Pre-fill form with current user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarPreview(resolveStorageUrl(user.profile_picture));
    }
  }, [user]);

  // Revoke any blob URL on unmount to free memory
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2 MB.");
      return;
    }
    // Revoke previous blob URL before creating a new one
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setAvatarFile(file);
    setAvatarPreview(url);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const { user: updated } = await updateProfileApi(token, {
        name: name.trim(),
        profile_picture: avatarFile,
      });
      updateUser(updated);
      // After successful save, blob URL is no longer needed
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setAvatarFile(null);
      setAvatarPreview(resolveStorageUrl(updated.profile_picture));
      setSuccess(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setSuccess(false);
        successTimerRef.current = null;
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  // While loading or redirecting, show a blank screen
  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black px-4 py-24">
      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>

          {/* Avatar upload */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button
                type="button"
                aria-label="Change profile picture"
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-red-500 transition-all"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full bg-red-600 flex items-center justify-center text-3xl font-bold text-white">
                    {avatarInitial}
                  </span>
                )}
                {/* Overlay */}
                <span className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Upload profile picture"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Profile updated successfully.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-zinc-300">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-800/60 border-white/10 text-white placeholder:text-zinc-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300">Email</Label>
              <Input
                type="email"
                value={user.email}
                readOnly
                disabled
                className="bg-zinc-800/30 border-white/5 text-zinc-500 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500">Email cannot be changed.</p>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg mt-2"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>

          {/* Quick links */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            <Link
              href="/my-list"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            >
              <Bookmark className="w-4 h-4 text-zinc-400" />
              My List
            </Link>

            {user.is_admin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">A</span>
                Admin Dashboard
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-zinc-800/50 hover:bg-red-500/10 text-zinc-300 hover:text-red-400 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
