"use client";

import {
  Check,
  Copy,
  Github,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { ApiKey, GithubConfig } from "../types";

const initialApiKeys: ApiKey[] = [
  {
    id: "key_demo_1",
    name: "Local development",
    keyPrefix: "cos_live_••••••••••••4f9a",
    createdAt: "2026-09-18T10:00:00.000Z",
    lastUsedAt: "2026-10-05T08:30:00.000Z",
  },
];

const initialGithubConfig: GithubConfig = {
  id: "github_demo",
  githubUsername: "your-username",
  githubRepo: "interview-solutions",
  githubBranch: "main",
  githubToken: "your-github-token",
  isConfigured: false,
};

export function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [githubConfig, setGithubConfig] = useState<GithubConfig>(initialGithubConfig);
  const [githubSaved, setGithubSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateApiKey = () => {
    const name = keyName.trim() || "Untitled key";
    const generatedKey = `cos_live_${Math.random().toString(36).slice(2, 18)}`;

    setApiKeys((currentKeys) => [
      {
        id: `key_${Date.now()}`,
        name,
        keyPrefix: `${generatedKey.slice(0, 12)}••••••••`,
        createdAt: new Date().toISOString(),
      },
      ...currentKeys,
    ]);
    setNewKey(generatedKey);
    setKeyName("");
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys((currentKeys) => currentKeys.filter((apiKey) => apiKey.id !== id));
  };

  const handleCopyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleSaveGithubConfig = () => {
    setGithubConfig((currentConfig) => ({ ...currentConfig, isConfigured: true }));
    setGithubSaved(true);
    window.setTimeout(() => setGithubSaved(false), 2400);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10 animate-in fade-in duration-300">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-indigo-light dark:text-brand-cyan">
          Workspace settings
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
          Settings
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#666d7c] dark:text-[#8c96aa]">
          Manage the credentials and integrations that connect Career OS to your workflow.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="api-keys-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand-indigo-light dark:text-brand-cyan" />
              <h2 id="api-keys-heading" className="text-lg font-semibold">
                API keys
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#666d7c] dark:text-[#8c96aa]">
              Use an API key to connect external tools to your Career OS workspace.
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] text-[#666d7c] dark:text-[#8c96aa] sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Keys are encrypted
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-dark-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="api-key-name" className="text-xs font-semibold">
                Key name
              </label>
              <input
                id="api-key-name"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                placeholder="e.g. Browser extension"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateApiKey}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-indigo-light px-4 text-xs font-semibold text-white transition hover:bg-[#4b55dc] dark:bg-brand-indigo dark:hover:bg-[#6c72e8]"
            >
              <Plus className="h-3.5 w-3.5" />
              Generate API key
            </button>
          </div>

          {newKey && (
            <div className="mt-5 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Copy this key now
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-200/70">
                    For security, the full key will not be shown again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/70 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-300/20 dark:text-amber-100 dark:hover:bg-amber-400/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy key"}
                </button>
              </div>
              <code className="mt-3 block overflow-x-auto rounded-lg bg-white/80 px-3 py-2 text-xs text-amber-950 dark:bg-black/20 dark:text-amber-100">
                {newKey}
              </code>
            </div>
          )}

          <div className="mt-6 divide-y divide-zinc-100 dark:divide-white/5">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{apiKey.name}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-[#666d7c] dark:text-[#8c96aa]">
                    {apiKey.keyPrefix}
                  </p>
                  <p className="mt-1 text-[11px] text-[#8c96aa]">
                    Created {new Date(apiKey.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {apiKey.lastUsedAt && ` · Last used ${new Date(apiKey.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  aria-label={`Delete ${apiKey.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <p className="py-4 text-sm text-[#666d7c] dark:text-[#8c96aa]">
                No API keys yet. Generate one to connect a tool.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="github-heading">
        <div>
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-[#0e121c] dark:text-[#edf0f9]" />
            <h2 id="github-heading" className="text-lg font-semibold">
              GitHub configuration
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#666d7c] dark:text-[#8c96aa]">
            Choose where your solved problems and learning artifacts should be synced.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-dark-card sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-xs font-semibold">
              GitHub username
              <input
                value={githubConfig.githubUsername}
                onChange={(event) => setGithubConfig({ ...githubConfig, githubUsername: event.target.value, isConfigured: false })}
                placeholder="your-username"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
            <label className="space-y-2 text-xs font-semibold">
              Repository
              <input
                value={githubConfig.githubRepo}
                onChange={(event) => setGithubConfig({ ...githubConfig, githubRepo: event.target.value, isConfigured: false })}
                placeholder="repository-name"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
            <label className="space-y-2 text-xs font-semibold sm:col-span-2">
              Branch
              <input
                value={githubConfig.githubBranch}
                onChange={(event) => setGithubConfig({ ...githubConfig, githubBranch: event.target.value, isConfigured: false })}
                placeholder="main"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
            <label className="space-y-2 text-xs font-semibold sm:col-span-2">
              Personal access token
              <input
                value={githubConfig.githubToken}
                onChange={(event) => setGithubConfig({ ...githubConfig, githubToken: event.target.value, isConfigured: false })}
                placeholder="your-github-token"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-[#666d7c] dark:text-[#8c96aa]">
              {githubConfig.isConfigured ? (
                <><Check className="h-3.5 w-3.5 text-emerald-500" /> Configuration saved</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Changes are local until saved</>
              )}
            </p>
            <button
              type="button"
              onClick={handleSaveGithubConfig}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-xs font-semibold transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              {githubSaved ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : null}
              {githubSaved ? "Saved" : "Save GitHub configuration"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
