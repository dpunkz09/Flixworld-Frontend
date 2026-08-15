import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Terms of Service — FlixWorld",
  description: "FlixWorld terms of service — the rules governing use of our platform.",
};

const LAST_UPDATED = "July 4, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
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

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-xs text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 border-t border-white/5 pt-8">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using FlixWorld ("the Service") at flixworld.xyz, you
              agree to be bound by these Terms of Service. If you do not agree, do not
              use the Service.
            </p>
          </Section>

          <Section title="2. Use of the Service">
            <p>You agree to use FlixWorld only for lawful personal, non-commercial purposes. You must not:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Reproduce, redistribute, or re-upload any streaming content.</li>
              <li>Attempt to reverse-engineer or scrape the platform.</li>
              <li>Use the Service to harass, abuse, or harm other users.</li>
              <li>Share your account credentials with others.</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>
              You are responsible for maintaining the security of your account and
              password. FlixWorld is not liable for any loss resulting from unauthorised
              access to your account.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate these
              terms at our sole discretion.
            </p>
          </Section>

          <Section title="4. Content, Intellectual Property and Stream Hosting Disclaimer">
            <p>
              <strong className="text-white">
                FlixWorld does not host, store, upload, or distribute any video content.
              </strong>{" "}
              All streams are linked from and served by independent third-party hosting
              providers entirely outside of FlixWorld's control. FlixWorld operates
              solely as an index and playback interface.
            </p>
            <p>
              All audiovisual content remains the property of its respective copyright
              holders. FlixWorld does not claim ownership over any streamed media.
              Movie and TV metadata is provided by TMDB.
            </p>
            <p>
              FlixWorld is not responsible for the legality, availability, or accuracy
              of any third-party stream. If you are a rights holder and believe a
              linked stream infringes your copyright, please send a DMCA notice to{" "}
              <a
                href="mailto:flixworld.xyz@gmail.com"
                className="text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                flixworld.xyz@gmail.com
              </a>{" "}
              including the title, a description of the infringing material, and proof
              of ownership. We will act promptly upon valid notices.
            </p>
          </Section>

          <Section title="5. User-Generated Content">
            <p>
              By posting comments or other content on FlixWorld, you grant us a
              non-exclusive, royalty-free licence to display that content. You are
              solely responsible for what you post. We reserve the right to remove
              content that violates these terms or applicable law.
            </p>
          </Section>

          <Section title="6. Disclaimer of Warranties">
            <p>
              The Service is provided "as is" without warranties of any kind. We do not
              guarantee uninterrupted or error-free access to the Service.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, FlixWorld and its operators shall
              not be liable for any indirect, incidental, special, or consequential
              damages arising from your use of the Service.
            </p>
          </Section>

          <Section title="8. Changes to Terms">
            <p>
              We may revise these Terms at any time. Continued use of the Service after
              changes are posted constitutes your acceptance.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions about these Terms?{" "}
              <Link href="/contact" className="text-red-400 hover:text-red-300 underline underline-offset-2">
                Contact us
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
