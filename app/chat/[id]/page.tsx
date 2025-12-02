"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { generateAIResponse, generateIndividualSummary } from "@/lib/gemini";
import { Send, CheckCircle, Bot, User, Loader2, ArrowLeft } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!participantId) return;
    fetchData();
  }, [participantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchData = async () => {
    // 1. Get Participant Info
    const { data: p } = await supabase
      .from("participants")
      .select("*")
      .eq("id", participantId)
      .single();
    if (!p) return router.push("/login");

    // 2. Get Session Context (The "Problem")
    const { data: s } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", p.session_id)
      .single();

    // 3. Get Chat History
    const { data: m } = await supabase
      .from("messages")
      .select("*")
      .eq("participant_id", participantId)
      .order("created_at");

    setParticipant(p);
    setSession(s);
    setMessages(m || []);
    if (p.has_completed) setIsDone(true);

    // 4. Initial Greeting (If chat is empty)
    if (!m || m.length === 0) {
      const welcomeMsg = `Hi! You are logged in as **${p.role_label}**.\n\nThe goal of this retro is to discuss: *"${s.sprint_context}"*.\n\nHow did this sprint feel for you? Be honest—it's anonymous.`;
      // We don't save the initial greeting to DB to save space, just show it in UI state or save it.
      // Let's save it to keep history consistent.
      addMessage("ai", welcomeMsg, participantId);
    }
  };

  const addMessage = async (role: string, content: string, pid: string) => {
    // Optimistic UI Update
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
    // We pass the role and context so the AI stays in character
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
      // 1. Generate Summary of this specific chat
      const summary = await generateIndividualSummary(messages);

      // 2. Save to Participant Table & Mark Complete
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

  // SUCCESS STATE (After finishing)
  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Feedback Submitted
          </h2>
          <p className="text-slate-500 mb-6">
            Thank you for your input. The Team Leader will generate the final
            anonymous report once everyone has finished.
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

  // CHAT STATE
  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-3xl mx-auto shadow-2xl border-x border-slate-200">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bot size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">SafeSprint AI</h1>
            <p className="text-xs text-slate-500">
              Role: {participant.role_label}
            </p>
          </div>
        </div>
        <button
          onClick={handleFinish}
          disabled={finishing || messages.length < 3} // Force at least some chat
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            messages.length < 3
              ? "bg-slate-100 text-slate-400"
              : "bg-black text-white hover:bg-slate-800"
          }`}
        >
          {finishing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Finish & Submit"
          )}
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-center gap-2">
          <input
            className="flex-1 bg-slate-100 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Type your feedback..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
