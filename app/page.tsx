import Link from "next/link";
import { ShieldCheck, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          SafeSprint
        </h1>
        <p className="text-slate-500 text-xl leading-relaxed">
          The AI-powered retrospective tool for high-trust engineering teams.
          Turn anonymous feedback into actionable velocity.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* LEADER CARD */}
        <Link
          href="/create"
          className="group relative block p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300"
        >
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
            <ArrowRight />
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Team Leader
          </h2>
          <p className="text-slate-500">
            Create a new sprint session, define the context, and generate secure
            access keys.
          </p>
        </Link>

        {/* MEMBER CARD */}
        <Link
          href="/login"
          className="group relative block p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-green-500 hover:shadow-xl transition-all duration-300"
        >
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-green-500">
            <ArrowRight />
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Team Member
          </h2>
          <p className="text-slate-500">
            Join an active session using your Access Key to share feedback
            anonymously.
          </p>
        </Link>
      </div>
    </div>
  );
}
