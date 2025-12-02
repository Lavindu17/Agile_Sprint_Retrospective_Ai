"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateFinalReport } from "@/lib/gemini";
import {
  Loader2,
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Fetching data...");

  useEffect(() => {
    if (sessionId) generateOrLoadReport();
  }, [sessionId]);

  const generateOrLoadReport = async () => {
    try {
      // 1. Check if report already exists
      const { data: s } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      setSession(s);

      if (s.final_report) {
        setReport(s.final_report); // Load existing
        setLoading(false);
        return;
      }

      // 2. If not, generate it
      setStatus("Analyzing team feedback...");

      // Get all summaries
      const { data: participants } = await supabase
        .from("participants")
        .select("individual_summary")
        .eq("session_id", sessionId)
        .eq("has_completed", true);

      if (!participants || participants.length === 0) {
        alert("No feedback found yet!");
        router.back();
        return;
      }

      const summaries = participants
        .map((p) => p.individual_summary)
        .filter(Boolean);

      setStatus("Constructing Action Plan...");
      const aiReport = await generateFinalReport(summaries);

      if (aiReport) {
        // 3. Save to DB
        await supabase
          .from("sessions")
          .update({ final_report: aiReport })
          .eq("id", sessionId);
        setReport(aiReport);
      } else {
        throw new Error("AI failed to generate");
      }
    } catch (e) {
      alert("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{status}</h2>
        <p className="text-slate-500">The AI is connecting the dots...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER (No Print) */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              <Download size={18} /> Export PDF
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
              <Share2 size={18} /> Share Results
            </button>
          </div>
        </div>

        {/* REPORT CARD */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none">
          {/* REPORT HEADER */}
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                Official Retrospective
              </span>
              <span className="text-slate-400 text-sm">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2">
              {session?.sprint_name}
            </h1>
            <p className="text-slate-300 text-lg">AI Analysis & Action Plan</p>
          </div>

          {/* REPORT BODY */}
          <div className="p-10 prose prose-slate max-w-none">
            {/* We use ReactMarkdown to render the bolding/lists nicely */}
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-2xl font-bold text-slate-900 border-b pb-2 mb-4 mt-8"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-xl font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-slate-700 leading-relaxed" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-slate-600 mb-4 leading-relaxed"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <span className="font-bold text-blue-700" {...props} />
                ),
              }}
            >
              {report}
            </ReactMarkdown>
          </div>

          {/* FOOTER */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-1" size={20} />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Action Oriented
                </p>
                <p className="text-slate-500 text-xs">
                  These items are derived from anonymous consensus.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 mt-1" size={20} />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Review Required
                </p>
                <p className="text-slate-500 text-xs">
                  The team should vote on these items in the next standup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
