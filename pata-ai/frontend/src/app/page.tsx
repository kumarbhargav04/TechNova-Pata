import Link from "next/link";
import { ArrowRight, MapPin, Shield, Layers, Code, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden flex flex-col min-h-screen">
      {/* Background glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 font-bold text-lg">P</div>
          <span className="font-bold text-lg tracking-wider">PataAI</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/dashboard" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition">
            Launch Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col justify-center items-center text-center">
        <div className="space-y-6">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-500 border border-emerald-500/30">
            DPDP Compliant Geo-Resolution
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
            AI Powered Address Intelligence <br/>for <span className="text-emerald-500">Indian Last-Mile Delivery</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed mx-auto">
            Transform messy, unstructured Indian addresses (containing landmarks, regional scripts, spelling typos, and wrong pincodes) into highly accurate geographic coordinates under 500ms using LangGraph multi-agent systems.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/dashboard" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-8 rounded-lg shadow-lg shadow-emerald-500/25 transition flex items-center space-x-2 justify-center">
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold py-3 px-8 rounded-lg transition flex items-center justify-center">
              <span>Developer API Sandbox</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-24">
          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl text-left space-y-3">
            <Layers className="h-6 w-6 text-emerald-500" />
            <h3 className="text-base font-bold text-white">9-Agent LangGraph Orchestrator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Splits geocoding logic across specialized micro-agents validating spelling, script transliterations, pincode catalogs, and real-world nearby landmarks.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl text-left space-y-3">
            <MapPin className="h-6 w-6 text-emerald-500" />
            <h3 className="text-base font-bold text-white">Live OpenStreetMap POI Auditing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries real-time nearby landmark features (temples, shops, schools) using live Overpass API to verify coordinates instead of guessing matching locations.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl text-left space-y-3">
            <Shield className="h-6 w-6 text-emerald-500" />
            <h3 className="text-base font-bold text-white">DPDP Indian Compliance Guardrails</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains complete data privacy by automatically masking personal identifiers like house and flat numbers before saving request records in permanent databases.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 px-6 text-center text-xs text-slate-500 bg-slate-950/20">
        © 2026 PataAI Inc. Built for AI BUILD Hackathon Track 1. All Rights Reserved.
      </footer>
    </div>
  );
}
