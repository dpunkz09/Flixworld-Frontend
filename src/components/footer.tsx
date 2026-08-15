import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const links = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="hidden md:block bg-black border-t border-white/5 mt-16 py-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/">
            <Image
              src="/assets/images/main-logo.png"
              alt="FlixWorld"
              width={120}
              height={34}
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Links */}
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} FlixWorld. Movie and TV data provided by{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-400 transition-colors"
          >
            TMDB
          </a>
          . For entertainment purposes only.
        </p>
      </div>
    </footer>
  );
}
