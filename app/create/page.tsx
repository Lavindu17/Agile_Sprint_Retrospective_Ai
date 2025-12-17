"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
  Sparkles,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateSession() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [context, setContext] = useState("");
  const [adminPass, setAdminPass] = useState(""); // New: Custom Password

  const [roles, setRoles] = useState(["Senior Dev", "Frontend Dev"]);

  // UPGRADE 1: Quick Presets
  const applyPreset = (type: "scrum" | "mobile" | "minimal") => {
    if (type === "scrum")
      setRoles([
        "Product Owner",
        "Scrum Master",
        "Frontend Dev",
        "Backend Dev",
        "QA Engineer",
      ]);
    if (type === "mobile")
      setRoles(["iOS Dev", "Android Dev", "Designer", "Product Manager"]);
    if (type === "minimal") setRoles(["Developer", "Developer", "Designer"]);
  };

  // UPGRADE 3: Context Template
  const applyContextTemplate = () => {
    setContext(
      "We missed our sprint goal by 20%. The main feature 'User Login' was delayed. I want to understand if this was due to unclear requirements, technical debt, or external distractions."
    );
  };

  const addRole = () => setRoles([...roles, "Developer"]);

  const updateRole = (index: number, val: string) => {
    const newRoles = [...roles];
    newRoles[index] = val;
    setRoles(newRoles);
  };

  const removeRole = (index: number) => {
    const newRoles = [...roles];
    newRoles.splice(index, 1);
    setRoles(newRoles);
  };

  const handleCreate = async () => {
    // UPGRADE 3: Better Validation
    if (!sprintName.trim()) return alert("Please name your sprint");
    if (!adminPass.trim()) return alert("Please set an admin password");
    if (context.length < 20)
      return alert(
        "Please provide more context (at least 20 chars) so the AI can help effectively."
      );
    if (roles.length === 0) return alert("You need at least one participant.");

    setLoading(true);

    try {
      const { data: session, error } = await supabase
        .from("sessions")
        .insert({
          leader_pass: adminPass, // Using custom password
          sprint_name: sprintName,
          sprint_context: context,
        })
        .select()
        .single();

      if (error) throw error;

      const participants = roles.map((role) => ({
        session_id: session.id,
        role_label: role,
        access_code:
          Math.random().toString(36).substring(2, 5).toUpperCase() +
          "-" +
          Math.random().toString(36).substring(2, 5).toUpperCase(),
      }));

      const { error: partError } = await supabase
        .from("participants")
        .insert(participants);
      if (partError) throw partError;

      router.push(`/dashboard/${session.id}`);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Setup Retrospective
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              Sprint Name
            </label>
            <input
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. Sprint 42 Retro"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <ShieldCheck size={12} /> Admin Password
            </label>
            <input
              type="password"
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Set a PIN for the dashboard"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Explain Problem Context
              </label>
              <button
                onClick={applyContextTemplate}
                className="text-xs text-blue-600 hover:underline"
              >
                Use Template
              </button>
            </div>
            <textarea
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              placeholder="e.g. We missed the deadline. I want to know if it was a tooling issue or a planning issue."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {context.length} chars (min 20)
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Who is on the team?
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => applyPreset("scrum")}
                  className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600"
                >
                  Scrum Team
                </button>
                <button
                  onClick={() => applyPreset("mobile")}
                  className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600"
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {roles.map((role, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex items-center justify-center w-8 h-10 bg-slate-50 rounded text-slate-400">
                    <Users size={16} />
                  </div>
                  <input
                    className="flex-1 p-2 bg-white text-slate-900 border border-slate-200 rounded-md focus:border-blue-500 outline-none"
                    value={role}
                    onChange={(e) => updateRole(i, e.target.value)}
                  />
                  <button
                    onClick={() => removeRole(i)}
                    className="text-red-400 hover:text-red-600 px-2 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addRole}
              className="text-blue-600 text-sm font-semibold flex items-center gap-1 mt-4 hover:text-blue-800 transition-colors"
            >
              <Plus size={16} /> Add another role
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold mt-6 flex justify-center items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Generate Access Keys <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
