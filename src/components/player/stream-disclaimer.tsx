import Link from "next/link";
import { Info } from "lucide-react";

export default function StreamDisclaimer() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-900/80 border border-white/8 text-xs text-zinc-500 leading-relaxed">
      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-600" />
      <p>
        FlixWorld does not host, store, or distribute any video content. All streams
        are sourced from and played back via independent third-party hosting providers.
        FlixWorld is not responsible for the content, availability, or legality of any
        linked stream.{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-300 transition-colors">
          Terms of Service
        </Link>
        {" · "}
        <Link href="/contact" className="underline underline-offset-2 hover:text-zinc-300 transition-colors">
          DMCA / Contact
        </Link>
      </p>
    </div>
  );
}
