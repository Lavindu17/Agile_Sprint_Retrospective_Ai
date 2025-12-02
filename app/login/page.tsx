"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowRight, Loader2, Users } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!key.trim()) return;
    setLoading(true);

    try {
      // 1. Check if Key exists in participants table
      // We look for the exact code (case insensitive logic handled by UI upper-casing)
      const { data: participant, error } = await supabase
        .from("participants")
        .select("*")
        .eq("access_code", key.toUpperCase().trim())
        .single();

      if (error || !participant) {
        alert("Invalid Access Key. Please check with your Team Leader.");
        setLoading(false);
        return;
      }

      // 2. Success! Redirect to their personal chat
      // We use the participant's UUID as the identifier
      router.push(`/chat/${participant.id}`);
    } catch (e) {
      alert("System error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center mb-8">
          <div className="bg-green-100 p-4 rounded-2xl">
            <Users size={32} className="text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-slate-900 mb-2">
          Member Access
        </h1>
        <p className="text-center text-slate-500 mb-8">
          Enter the secure key shared by your leader to join the retrospective.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 pl-1">
              Access Key
            </label>
            <div className="relative">
              <KeyRound
                className="absolute left-4 top-4 text-slate-400"
                size={20}
              />
              <input
                className="w-full pl-12 pr-4 py-4 text-lg font-mono tracking-widest border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition uppercase placeholder:text-slate-300 text-slate-800"
                placeholder="XXX-XXX"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                maxLength={15}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Enter Session <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
