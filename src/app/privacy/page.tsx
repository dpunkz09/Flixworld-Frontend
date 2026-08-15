import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy — FlixWorld",
  description: "FlixWorld privacy policy — how we collect, use, and protect your information.",
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

export default function PrivacyPage() {
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

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 border-t border-white/5 pt-8">
          <Section title="1. Information We Collect">
            <p>
              When you create an account, we collect your name, email address, and a
              hashed password. We do not collect payment information.
            </p>
            <p>
              We automatically collect basic usage data such as pages visited, search
              queries, and watch progress in order to provide features like Continue
              Watching and personalised recommendations.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Provide and maintain your account and personalised features.</li>
              <li>Save your watch progress and wishlist across devices.</li>
              <li>Send notifications about activity on content you follow.</li>
              <li>Improve our service and fix technical issues.</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="3. Cookies and Local Storage">
            <p>
              FlixWorld uses browser local storage to keep you logged in and to save
              your search history locally. No third-party advertising cookies are used.
            </p>
          </Section>

          <Section title="4. Third-Party Services and Stream Hosting">
            <p>
              FlixWorld <strong className="text-white">does not host, store, or distribute any video content.</strong>{" "}
              All streams displayed on the platform are sourced exclusively from
              independent third-party hosting providers. FlixWorld acts solely as an
              index and interface — it does not upload, encode, or control the streamed
              files in any way.
            </p>
            <p>
              Movie and TV metadata is provided by{" "}
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                TMDB
              </a>
              . Subtitle data may be sourced from OpenSubtitles. These services have
              their own privacy policies which we encourage you to review.
            </p>
            <p>
              FlixWorld is not responsible for the content, availability, accuracy, or
              legality of any third-party stream. Any data collected by third-party
              streaming servers when you play content is governed by their own privacy
              policies, not ours.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your account data for as long as your account is active.
              You may request deletion of your account and associated data at any time
              by contacting us at{" "}
              <a
                href="mailto:flixworld.xyz@gmail.com"
                className="text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                flixworld.xyz@gmail.com
              </a>
              .
            </p>
          </Section>

          <Section title="6. Security">
            <p>
              Passwords are stored as bcrypt hashes. All traffic between your browser
              and our servers is encrypted via HTTPS/TLS.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              FlixWorld is not directed at children under 13. We do not knowingly
              collect personal information from children.
            </p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>
              We may update this policy from time to time. Continued use of FlixWorld
              after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions about this policy?{" "}
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
