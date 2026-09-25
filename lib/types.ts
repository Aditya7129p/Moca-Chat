export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  avatar_url: string | null;
  system_prompt: string | null;
  fallback_message: string | null;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  language: string;
  tone: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  context: number;
  vision: boolean;
}

export type ProviderModels = Record<string, ModelInfo[]>;

export type AgentTone = "professional" | "friendly" | "concise" | "casual" | "formal";
