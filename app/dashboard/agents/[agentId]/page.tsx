"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { Agent, ProviderModels } from "@/lib/types";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  groq: "Groq",
  gemini: "Google Gemini",
  nvidia: "NVIDIA",
  openrouter: "OpenRouter",
};

const TONES = ["professional", "friendly", "concise", "casual", "formal"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
];

export default function AgentSettingsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const params = useSearchParams();
  const workspaceId = params.get("workspace") ?? "";
  const router = useRouter();

  const [catalogue, setCatalogue] = useState<ProviderModels>({});
  const [form, setForm] = useState<Partial<Agent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiClient.get<Agent>(`/api/v1/workspaces/${workspaceId}/agents/${agentId}`),
      apiClient.get<ProviderModels>("/api/v1/models"),
    ])
      .then(([agent, cat]) => {
        setForm(agent);
        setCatalogue(cat);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId, workspaceId]);

  function set(field: string, value: string | number) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
    setSaved(false);
    setError("");
  }

  function handleProviderChange(provider: string) {
    const firstModel = catalogue[provider]?.[0]?.id ?? "";
    setForm((prev) => prev ? { ...prev, provider, model: firstModel } : prev);
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const updated = await apiClient.patch<Agent>(
        `/api/v1/workspaces/${workspaceId}/agents/${agentId}`,
        {
          name: form.name,
          system_prompt: form.system_prompt,
          fallback_message: form.fallback_message,
          provider: form.provider,
          model: form.model,
          temperature: form.temperature,
          max_tokens: form.max_tokens,
          language: form.language,
          tone: form.tone,
        }
      );
      setForm(updated);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/v1/workspaces/${workspaceId}/agents/${agentId}`);
      router.push(`/dashboard/agents`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-gray-400">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
        Loading…
      </div>
    );
  }

  if (!form) return <div className="p-8 text-sm text-gray-500">{error || "Agent not found"}</div>;

  const models = catalogue[form.provider ?? "openai"] ?? [];

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{form.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5 font-mono text-xs">{agentId}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-8 px-3 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete agent"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Agent name</label>
          <input
            type="text"
            required
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Provider */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Provider</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PROVIDER_LABELS).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`h-8 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.provider === p
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {PROVIDER_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            value={form.model ?? ""}
            onChange={(e) => set("model", e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-gray-400 transition-colors"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.vision ? " 👁" : ""}
                {" — "}
                {m.context >= 1_000_000
                  ? `${(m.context / 1_000_000).toFixed(1)}M ctx`
                  : `${Math.round(m.context / 1000)}K ctx`}
              </option>
            ))}
          </select>
        </div>

        {/* System prompt */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">System prompt</label>
          <textarea
            value={form.system_prompt ?? ""}
            onChange={(e) => set("system_prompt", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Tone + Language */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tone</label>
            <select
              value={form.tone ?? "professional"}
              onChange={(e) => set("tone", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-gray-400 transition-colors"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <select
              value={form.language ?? "en"}
              onChange={(e) => set("language", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-gray-400 transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Temperature + Max tokens */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Temperature <span className="text-gray-400 font-normal">({form.temperature})</span>
            </label>
            <input
              type="range"
              min="0" max="2" step="0.1"
              value={form.temperature ?? 0.7}
              onChange={(e) => set("temperature", parseFloat(e.target.value))}
              className="w-full accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Precise</span><span>Creative</span>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Max tokens</label>
            <input
              type="number"
              min="128" max="8192" step="128"
              value={form.max_tokens ?? 1024}
              onChange={(e) => set("max_tokens", parseInt(e.target.value))}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Fallback message */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fallback message</label>
          <input
            type="text"
            value={form.fallback_message ?? ""}
            onChange={(e) => set("fallback_message", e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Saved ✓</p>}

        <button
          type="submit"
          disabled={saving}
          className="h-9 px-5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
