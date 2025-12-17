"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { generateAIResponse, generateIndividualSummary } from "@/lib/gemini";
import {
  Send,
  CheckCircle,
  Bot,
  User,
  Loader2,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function ChatScreen() {
  const router = useRouter();
  const params = useParams();
  const participantId = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // 1. Calculate Progress (User must speak 3 times)
  const MIN_MESSAGES = 3;
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isReady = userMessageCount >= MIN_MESSAGES;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!participantId) return;
    fetchData();
  }, [participantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchData = async () => {
    const { data: p } = await supabase
      .from("participants")
      .select("*")
      .eq("id", participantId)
      .single();
    if (!p) return router.push("/login");

    const { data: s } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", p.session_id)
      .single();
    const { data: m } = await supabase
      .from("messages")
      .select("*")
      .eq("participant_id", participantId)
      .order("created_at");

    setParticipant(p);
    setSession(s);
    setMessages(m || []);
    if (p.has_completed) setIsDone(true);

    // Initial Greeting
    if (!m || m.length === 0) {
      const welcomeMsg = `Hi! You are logged in as **${p.role_label}**.\n\nThe goal of this retro is to discuss: *"${s.sprint_context}"*.\n\nHow did this sprint feel for you? Be honest—it's anonymous.`;
      addMessage("ai", welcomeMsg, participantId);
    }
  };

  const addMessage = async (role: string, content: string, pid: string) => {
    setMessages((prev) => [...prev, { role, content }]);
    await supabase
      .from("messages")
      .insert({ participant_id: pid, role, content });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setLoading(true);

    // 1. Add User Msg
    await addMessage("user", text, participantId);

    // 2. Get AI Response
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const aiReply = await generateAIResponse(
      history,
      text,
      participant.role_label,
      session.sprint_context
    );

    // 3. Add AI Msg
    await addMessage("ai", aiReply, participantId);
    setLoading(false);
  };

  const handleFinish = async () => {
    if (
      !confirm(
        "Are you sure you are done? This will submit your anonymous feedback."
      )
    )
      return;
    setFinishing(true);

    try {
      const summary = await generateIndividualSummary(messages);
      await supabase
        .from("participants")
        .update({
          individual_summary: summary,
          has_completed: true,
        })
        .eq("id", participantId);
      setIsDone(true);
    } catch (e) {
      alert("Error submitting. Please try again.");
    } finally {
      setFinishing(false);
    }
  };

  if (!participant || !session)
    return (
      <div className="p-10 text-center text-slate-500">Loading Session...</div>
    );

  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-green-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Feedback Submitted
          </h2>
          <p className="text-slate-500 mb-6">
            Your input has been anonymized and saved. The Team Leader will
            generate the final report once everyone finishes.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-3xl mx-auto shadow-2xl border-x border-slate-200">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bot size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">SafeSprint AI</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Lock size={10} /> Anonymous • {participant.role_label}
            </p>
          </div>
        </div>

        {/* 2. CONDITIONAL BUTTON Logic */}
        {isReady ? (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md shadow-green-200 animate-in fade-in"
          >
            {finishing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Finish <CheckCircle size={16} />
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(userMessageCount / MIN_MESSAGES) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-400">
              {userMessageCount}/{MIN_MESSAGES} replies
            </span>
          </div>
        )}
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
              }`}
            >
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" /> Agile Coach is
              thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-center gap-2">
          <input
            className="flex-1 bg-slate-100 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition border border-transparent focus:bg-white"
            placeholder="Type your feedback here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
