"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateSession() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [context, setContext] = useState("");

  const [roles, setRoles] = useState([
    "Senior Dev",
    "Frontend Dev",
    "Backend Dev",
  ]);

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
    if (!sprintName.trim()) return alert("Please name your sprint");
    setLoading(true);

    try {
      const { data: session, error } = await supabase
        .from("sessions")
        .insert({
          leader_pass: "admin",
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
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Setup Retrospective
          </h1>
        </div>

        <div className="space-y-5">
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              Explain Problem Context
            </label>
            <textarea
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              placeholder="e.g. We missed the deadline. I want to know if it was a tooling issue or a planning issue."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Who is on the team?
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {roles.map((role, i) => (
                <div key={i} className="flex gap-2">
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
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold mt-6 flex justify-center items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
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
