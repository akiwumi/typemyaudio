import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingNav } from "@/components/layout/floating-nav";
import {
  Upload,
  Languages,
  FileDown,
  Zap,
  Shield,
  Globe,
  Clock,
  ArrowRight,
  Play,
  Sparkles,
  FileText,
} from "lucide-react";

const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80",
  editorial1: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
  editorial2: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
  howItWorks1: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80",
  howItWorks2: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  howItWorks3: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
  testimonial1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  testimonial2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  testimonial3: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
  ctaBg: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=2400&q=80",
};

const features = [
  { icon: Languages, title: "98+ Languages", description: "Automatic language detection powered by OpenAI Whisper. No manual selection needed." },
  { icon: Zap, title: "AI-Powered Cleanup", description: "Smart grammar cleanup, summarization, and key points extraction with GPT-4o." },
  { icon: Globe, title: "40+ Translations", description: "Translate transcriptions to 40+ languages with professional-grade accuracy." },
  { icon: FileDown, title: "Multiple Exports", description: "Export to PDF, DOCX, TXT, or SRT subtitle files for any workflow." },
  { icon: Clock, title: "Sentence Timecodes", description: "Precise start/end timestamps for every sentence in the audio." },
  { icon: Shield, title: "Encrypted & Private", description: "Your files are encrypted end-to-end and stored securely. Delete anytime." },
];

const testimonials = [
  { quote: "TypeMyAudio cut my podcast editing time in half. The transcriptions are incredibly accurate, even with multiple speakers.", name: "Marcus Chen", role: "Podcast Producer", photo: PHOTOS.testimonial1 },
  { quote: "As a journalist working across borders, the auto-translation feature is a game-changer. I transcribe interviews in any language.", name: "Sofia Bergmann", role: "Foreign Correspondent", photo: PHOTOS.testimonial2 },
  { quote: "We use it for every board meeting. Upload the recording, get a clean transcript with timecodes — it's that simple.", name: "David Okafor", role: "Operations Director", photo: PHOTOS.testimonial3 },
];

const steps = [
  { number: "01", title: "Upload", subtitle: "Drop your file", description: "Drag and drop any MP3 or MP4 file up to 500MB. That's it — no configuration needed.", photo: PHOTOS.howItWorks1, icon: Upload },
  { number: "02", title: "Transcribe", subtitle: "AI does the work", description: "OpenAI Whisper auto-detects the language and transcribes with best-in-class accuracy. GPT-4o cleans up grammar and generates summaries.", photo: PHOTOS.howItWorks2, icon: Sparkles },
  { number: "03", title: "Export", subtitle: "Your words, your way", description: "Download as PDF, DOCX, TXT, or SRT subtitles. Edit inline, translate to 40+ languages, share with your team.", photo: PHOTOS.howItWorks3, icon: FileText },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FloatingNav />

      <section className="relative min-h-screen flex items-end pb-20 md:pb-28">
        <div className="absolute inset-0">
          <img src={PHOTOS.hero} alt="Team collaborating" className="img-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1B2E] via-[#1A1B2E]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="editorial-display text-[#FACC15] text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6">
              Every word, <span className="editorial-italic text-primary-light">captured</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
              Upload your audio or video. Get a precise, AI-powered transcription in seconds — in 98+ languages, with translation, export, and editing built in.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base px-8 gap-3">
                  Start Transcribing Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 text-base px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/40 mt-6">3 free transcriptions — no credit card required</p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2">
          <span className="editorial-caption text-white/40">Scroll to explore</span>
          <div className="w-px h-8 bg-white/20 animate-pulse" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <span className="label-tag mb-4 inline-block">The Platform</span>
            <h2 className="editorial-display text-4xl md:text-5xl mb-6">
              Transcription, <span className="editorial-italic">reimagined</span>
            </h2>
            <div className="magazine-divider mb-8" />
            <p className="body-lg mb-6 leading-relaxed">
              TypeMyAudio is built for professionals who value accuracy and speed. Whether you're a journalist on deadline, a podcaster editing episodes, or a team documenting meetings — we turn spoken words into clean, exportable text.
            </p>
            <p className="body-base mb-8 leading-relaxed">
              Powered by OpenAI Whisper for transcription and GPT-4o for intelligent cleanup, our platform auto-detects language, corrects grammar, and generates summaries — all without human intervention.
            </p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-bold text-foreground">98+</p>
                <p className="text-sm text-foreground-muted">Languages detected</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">40+</p>
                <p className="text-sm text-foreground-muted">Translation targets</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">500MB</p>
                <p className="text-sm text-foreground-muted">Max file size</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-12 grid-rows-6 gap-3 h-[32rem]">
            <div className="col-span-7 row-span-6 rounded-2xl overflow-hidden">
              <img src={PHOTOS.editorial1} alt="Professional at work" className="img-cover" />
            </div>
            <div className="col-span-5 row-span-3 rounded-2xl overflow-hidden">
              <img src={PHOTOS.editorial2} alt="Team meeting" className="img-cover" />
            </div>
            <div className="col-span-5 row-span-3 rounded-2xl overflow-hidden bg-primary flex items-center justify-center p-6">
              <div className="text-center text-white">
                <Play className="h-8 w-8 mx-auto mb-3 opacity-80" />
                <p className="text-sm font-semibold opacity-90">MP3 & MP4</p>
                <p className="text-xs opacity-60 mt-1">Upload & transcribe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-foreground text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-20">
            <div className="lg:col-span-1">
              <span className="label-tag text-primary-light/60 mb-4 inline-block">Features</span>
              <h2 className="editorial-display text-white text-4xl md:text-5xl mb-6">
                Built for <span className="editorial-italic text-primary-light">precision</span>
              </h2>
              <div className="magazine-divider mb-6" />
              <p className="text-white/60 leading-relaxed">
                Every feature is designed around a single principle: get you from audio to polished text as fast and accurately as possible.
              </p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
              {features.map((feature) => (
                <div key={feature.title} className="group">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary-light" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-20">
          <span className="label-tag mb-4 inline-block">How It Works</span>
          <h2 className="editorial-display text-4xl md:text-5xl mb-4">
            Three steps to <span className="editorial-italic">clarity</span>
          </h2>
        </div>
        <div className="space-y-28">
          {steps.map((step, i) => (
            <div key={step.number} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? "lg:direction-rtl" : ""}`}>
              <div className={`relative ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={step.photo} alt={step.title} className="img-cover" />
                </div>
                <div className="absolute -top-6 -left-4 section-number select-none">{step.number}</div>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="editorial-caption">{step.subtitle}</span>
                </div>
                <h3 className="editorial-display text-3xl md:text-4xl mb-4">{step.title}</h3>
                <div className="magazine-divider mb-6" />
                <p className="body-lg leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="label-tag mb-4 inline-block">Testimonials</span>
            <h2 className="editorial-display text-4xl md:text-5xl mb-4">
              Voices of <span className="editorial-italic">confidence</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-xs hover:shadow-lg transition-shadow duration-300 flex flex-col">
                <div className="flex-1">
                  <div className="text-primary text-4xl font-serif leading-none mb-4">&quot;</div>
                  <p className="text-foreground leading-relaxed mb-6">{t.quote}</p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-border">
                  <img src={t.photo} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-foreground-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-center gap-10 text-sm text-foreground-muted flex-wrap">
            <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" />MP3 & MP4 supported</span>
            <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" />Auto language detection</span>
            <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" />Up to 500MB files</span>
            <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" />40+ translation languages</span>
            <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" />End-to-end encryption</span>
          </div>
        </div>
      </section>

      <section className="relative min-h-[36rem] flex items-center">
        <div className="absolute inset-0">
          <img src={PHOTOS.ctaBg} alt="Workspace" className="img-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1B2E]/90 via-[#1A1B2E]/70 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-lg">
            <span className="label-tag text-white/50 mb-4 inline-block">Get Started</span>
            <h2 className="editorial-display text-white text-4xl md:text-5xl mb-6">
              Ready to turn sound into <span className="editorial-italic text-primary-light">text</span>?
            </h2>
            <div className="magazine-divider mb-6 opacity-60" />
            <p className="text-white/60 mb-10 leading-relaxed">
              Join thousands of professionals who trust TypeMyAudio for accurate, fast transcriptions. Start free — no credit card required.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-base px-8 gap-3">
                Start Transcribing Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-white/60">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-14 w-auto mb-4 brightness-0 invert opacity-80" />
              <p className="text-sm leading-relaxed max-w-sm">
                AI-powered transcription for audio and video files. Auto-detect language, translate, and export to PDF, DOCX, TXT, or SRT — all in one platform.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: "var(--font-heading)" }}>Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: "var(--font-heading)" }}>Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} TypeMyAudio. All rights reserved.</p>
            <p className="text-white/30">Crafted with precision for the spoken word.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
