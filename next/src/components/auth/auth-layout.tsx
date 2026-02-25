import type { ReactNode } from "react";
import Link from "next/link";

const AUTH_PHOTO = "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={AUTH_PHOTO} alt="Professional using TypeMyAudio" className="absolute inset-0 img-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1B2E] via-[#1A1B2E]/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <Link href="/">
            <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-16 w-auto brightness-0 invert opacity-90" />
          </Link>
          <div className="max-w-md">
            <p className="pull-quote text-white border-white/20 mb-6">
              &quot;Every spoken word deserves to be captured with precision.&quot;
            </p>
            <div className="magazine-divider mb-6 opacity-40" />
            <div className="flex flex-wrap gap-6 text-sm text-white/50">
              <div><p className="text-2xl font-bold text-white/90">98+</p><p>Languages</p></div>
              <div><p className="text-2xl font-bold text-white/90">40+</p><p>Translations</p></div>
              <div><p className="text-2xl font-bold text-white/90">4</p><p>Export formats</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/">
              <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-14 w-auto" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
