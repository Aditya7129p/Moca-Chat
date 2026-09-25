"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { Agent, Workspace } from "@/lib/types";

export default function AgentsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const workspaces = await apiClient.get<Workspace[]>("/api/v1/workspaces");
        if (!workspaces || workspaces.length === 0) {
          setLoading(false);
          return;
        }
        const ws = workspaces[0];
        setWorkspace(ws);
        const agentList = await apiClient.get<Agent[]>(`/api/v1/workspaces/${ws.id}/agents`);
        setAgents(agentList);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-gray-400">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
        Loading…
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 max-w-sm">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">No workspace yet</h1>
        <p className="text-sm text-gray-500 mb-4">Create a workspace first to add agents.</p>
        <Link
          href="/dashboard/workspaces/new"
          className="inline-flex items-center h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Create workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workspace.name}</p>
        </div>
        <Link
          href={`/dashboard/agents/new?workspace=${workspace.id}`}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New agent
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {agents.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500 mb-3">No agents yet.</p>
          <Link
            href={`/dashboard/agents/new?workspace=${workspace.id}`}
            className="inline-flex items-center h-9 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Create your first agent
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/dashboard/agents/${agent.id}?workspace=${workspace.id}`}
              className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{agent.name}</p>
                  <p className="text-xs text-gray-400">{agent.provider} / {agent.model}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">
                {agent.system_prompt ?? "No system prompt set"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
