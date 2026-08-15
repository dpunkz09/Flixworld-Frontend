import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Mail, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — FlixWorld",
  description: "Get in touch with the FlixWorld team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/">
            <Image
              src="/assets/images/main-logo.png"
              alt="FlixWorld"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Contact Us
        </h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-10">
          Have a question, feedback, or a DMCA / content removal request?
          Reach out to us and we'll get back to you as soon as possible.
        </p>

        <div className="space-y-4 mb-12">
          <a
            href="mailto:flixworld.xyz@gmail.com"
            className="group flex items-center gap-4 p-5 rounded-xl bg-zinc-900/60 border border-white/8 hover:border-white/20 transition-colors"
          >
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Email</p>
              <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                flixworld.xyz@gmail.com
              </p>
            </div>
          </a>

          <div className="flex items-center gap-4 p-5 rounded-xl bg-zinc-900/60 border border-white/8">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Website</p>
              <p className="text-sm font-semibold text-white">flixworld.xyz</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-zinc-500 leading-relaxed border-t border-white/5 pt-8 space-y-2">
          <p>
            For DMCA / copyright takedown requests, please include the title of
            the content and a description of the issue in your email.
          </p>
          <p>
            We aim to respond within 48 hours on business days.
          </p>
        </div>
      </div>
    </div>
  );
}
