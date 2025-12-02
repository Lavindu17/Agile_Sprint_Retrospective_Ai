"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Copy,
  Check,
  Lock,
  RefreshCw,
  BarChart3,
  Clock,
  Unlock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation"; // 👈 Import useParams

export default function Dashboard() {
  const router = useRouter();

  // 🔴 FIX: Use the hook to get the ID safely
  const params = useParams();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return; // Wait for ID to load

    fetchData();

    const channel = supabase
      .channel("dashboard")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const fetchData = async () => {
    if (!sessionId) return;
    const { data: s } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    const { data: p } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("role_label");
    setSession(s);
    setParticipants(p || []);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!session)
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Mission Control...
      </div>
    );

  const finishedCount = participants.filter((p) => p.has_completed).length;
  const allFinished =
    finishedCount > 0 && finishedCount === participants.length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">
                Active Session
              </span>
              <span className="text-slate-400 text-xs font-mono">
                {sessionId.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {session.sprint_name}
            </h1>
            <p className="text-slate-500 mt-1 max-w-xl truncate">
              {session.sprint_context}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fetchData()}
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw size={20} />
            </button>

            <button
              onClick={() => router.push(`/report/${sessionId}`)}
              disabled={!allFinished}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all
                  ${
                    allFinished
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
            >
              <BarChart3 size={20} />
              {allFinished
                ? "Generate Report"
                : `Waiting (${finishedCount}/${participants.length})`}
            </button>
          </div>
        </div>

        {/* KEYS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((p) => (
            <div
              key={p.id}
              className={`relative bg-white p-6 rounded-2xl border-2 transition-all duration-300 ${
                p.has_completed
                  ? "border-green-500 shadow-green-100 ring-1 ring-green-100"
                  : "border-slate-100 shadow-sm hover:border-blue-200"
              }`}
            >
              <div className="absolute top-4 right-4">
                {p.has_completed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    <Check size={12} /> COMPLETE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                    <Clock size={12} /> PENDING
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1">
                {p.role_label}
              </h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-4">
                Access Key
              </p>

              <div
                onClick={() => copyToClipboard(p.access_code, p.id)}
                className="group cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex justify-between items-center transition-colors"
              >
                <code className="text-xl font-mono font-bold text-slate-800 tracking-widest">
                  {p.access_code}
                </code>
                <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                  {copied === p.id ? <Check size={20} /> : <Copy size={20} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
