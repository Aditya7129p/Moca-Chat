"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { ProviderModels } from "@/lib/types";

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

export default function NewAgentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const workspaceId = params.get("workspace") ?? "";

  const [catalogue, setCatalogue] = useState<ProviderModels>({});
  const [form, setForm] = useState({
    name: "",
    system_prompt: "",
    fallback_message: "I'm sorry, I couldn't find an answer to that.",
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 1024,
    language: "en",
    tone: "professional",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get<ProviderModels>("/api/v1/models").then(setCatalogue).catch(() => {});
  }, []);

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleProviderChange(provider: string) {
    const firstModel = catalogue[provider]?.[0]?.id ?? "";
    setForm((prev) => ({ ...prev, provider, model: firstModel }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) { setError("No workspace selected"); return; }
    setLoading(true);
    try {
      const agent = await apiClient.post<{ id: string }>(
        `/api/v1/workspaces/${workspaceId}/agents`,
        form
      );
      router.push(`/dashboard/agents/${agent.id}?workspace=${workspaceId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create agent");
      setLoading(false);
    }
  }

  const models = catalogue[form.provider] ?? [];

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New agent</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your AI assistant</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Agent name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Support Bot"
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
            value={form.model}
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
            value={form.system_prompt}
            onChange={(e) => set("system_prompt", e.target.value)}
            rows={4}
            placeholder="You are a helpful customer support agent for Acme Corp. Answer questions based on the provided knowledge base only."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Tone + Language */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tone</label>
            <select
              value={form.tone}
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
              value={form.language}
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
              value={form.temperature}
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
              value={form.max_tokens}
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
            value={form.fallback_message}
            onChange={(e) => set("fallback_message", e.target.value)}
            placeholder="I'm sorry, I couldn't find an answer to that."
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
          />
          <p className="text-xs text-gray-400">Shown when the agent can&apos;t find a relevant answer.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create agent"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="h-9 px-4 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
