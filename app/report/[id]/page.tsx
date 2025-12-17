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
import remarkGfm from "remark-gfm";

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
      const { data: s } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      setSession(s);

      if (s.final_report) {
        setReport(s.final_report);
        setLoading(false);
        return;
      }

      setStatus("Analyzing team feedback...");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{status}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER (Hidden when printing) */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>

        {/* REPORT CARD */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none border border-slate-100">
          {/* TITLE BAR */}
          <div className="bg-slate-900 p-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                Retrospective Report
              </span>
              <span className="text-slate-400 text-sm">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {session?.sprint_name}
            </h1>
            <p className="text-slate-400 text-lg">
              AI-Generated Analysis & Action Plan
            </p>
          </div>

          {/* CONTENT BODY */}
          <div className="p-10">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // FORCE COLORS TO BE VISIBLE (text-slate-900)

                  // H1: Not used often since we have a title, but styled just in case
                  h1: ({ ...props }) => (
                    <h1
                      className="text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-4 mb-6"
                      {...props}
                    />
                  ),

                  // H2: This replaces "## Executive Summary" with a beautiful styled header
                  h2: ({ ...props }) => (
                    <div className="mt-10 mb-4 flex items-center gap-3">
                      <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                      <h2
                        className="text-2xl font-bold text-slate-800"
                        {...props}
                      />
                    </div>
                  ),

                  // H3: Subheaders
                  h3: ({ ...props }) => (
                    <h3
                      className="text-lg font-bold text-slate-800 mt-6 mb-2 uppercase tracking-wide"
                      {...props}
                    />
                  ),

                  // Paragraphs: Ensure dark grey text
                  p: ({ ...props }) => (
                    <p
                      className="text-slate-600 leading-7 mb-4 text-base"
                      {...props}
                    />
                  ),

                  // Lists: Ensure bullets are visible
                  ul: ({ ...props }) => (
                    <ul
                      className="list-disc pl-5 space-y-2 mb-6 text-slate-700 marker:text-blue-500"
                      {...props}
                    />
                  ),
                  li: ({ ...props }) => (
                    <li className="leading-relaxed pl-1" {...props} />
                  ),

                  // Bold text
                  strong: ({ ...props }) => (
                    <span className="font-bold text-slate-900" {...props} />
                  ),

                  // TABLE STYLING (The magic part)
                  table: ({ ...props }) => (
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm my-8">
                      <table className="w-full text-sm text-left" {...props} />
                    </div>
                  ),
                  thead: ({ ...props }) => (
                    <thead
                      className="bg-slate-50 text-slate-700 font-bold uppercase text-xs tracking-wider"
                      {...props}
                    />
                  ),
                  tbody: ({ ...props }) => (
                    <tbody
                      className="bg-white divide-y divide-slate-100"
                      {...props}
                    />
                  ),
                  tr: ({ ...props }) => (
                    <tr
                      className="hover:bg-blue-50/50 transition-colors"
                      {...props}
                    />
                  ),
                  th: ({ ...props }) => (
                    <th
                      className="px-6 py-4 font-bold text-slate-900"
                      {...props}
                    />
                  ),
                  td: ({ ...props }) => (
                    <td
                      className="px-6 py-4 text-slate-600 whitespace-pre-wrap"
                      {...props}
                    />
                  ),
                }}
              >
                {report}
              </ReactMarkdown>
            </div>
          </div>

          {/* FOOTER */}
          <div className="bg-slate-50 p-8 border-t border-slate-100 grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="text-green-600 mt-1 flex-shrink-0"
                size={24}
              />
              <div>
                <p className="font-bold text-slate-900 text-base">
                  Consensus Driven
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  These insights are synthesized from anonymous team interviews.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="text-amber-500 mt-1 flex-shrink-0"
                size={24}
              />
              <div>
                <p className="font-bold text-slate-900 text-base">Next Steps</p>
                <p className="text-slate-500 text-sm mt-1">
                  Review the Action Plan above and assign owners in your next
                  standup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
