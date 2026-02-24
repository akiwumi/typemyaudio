import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Languages,
  FileDown,
  Zap,
  Shield,
  Globe,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Languages,
    title: "98+ Languages",
    description: "Automatic language detection powered by OpenAI Whisper. No manual selection needed.",
  },
  {
    icon: Zap,
    title: "AI-Powered",
    description: "Smart grammar cleanup, summarization, and key points extraction with GPT-4o.",
  },
  {
    icon: Globe,
    title: "Translation",
    description: "Translate transcriptions to 40+ languages with professional-grade accuracy.",
  },
  {
    icon: FileDown,
    title: "Multiple Exports",
    description: "Export to PDF, DOCX, TXT, or SRT subtitle files for any workflow.",
  },
  {
    icon: Clock,
    title: "Sentence Timecodes",
    description: "Precise start/end timestamps for every sentence. Jump to any point in the audio.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your files are encrypted and stored securely. Delete anytime.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-18 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-sm text-muted hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Transcribe audio & video
            <span className="text-primary"> in seconds</span>
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Upload your MP3 or MP4 file and get an AI-powered transcription with automatic language
            detection, translation, and export options.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="text-base px-8">
                <Upload className="h-5 w-5" />
                Start Transcribing Free
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="text-base px-8">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted mt-4">3 free transcriptions — no credit card required</p>
        </div>
      </section>

      <section className="border-t border-border bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-8 text-sm text-muted flex-wrap">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              MP3 & MP4 supported
            </span>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Auto language detection
            </span>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Up to 500MB files
            </span>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              40+ translation languages
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need for transcription</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Powered by OpenAI Whisper and GPT-4o for best-in-class accuracy and features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl border border-border hover:border-primary/30 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start transcribing?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join thousands of users who trust TypeMyAudio for accurate, fast transcriptions.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-base px-8"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} TypeMyAudio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
