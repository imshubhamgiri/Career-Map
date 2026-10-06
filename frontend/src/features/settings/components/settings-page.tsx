"use client";

import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState , useRef } from "react";
import type { ApiKeyResponse, GithubConfigForm } from "../types";
import { Button } from "@/core/components/ui/button";
import {
  VerifyGithubConfigResult,
  deleteApiKey,
  generateApiKey,
  updateGithubConfig,
  verifyGithubConfig,
} from "../services/setting-service";
import { ApiError } from "@/lib/api-client";


const initialGithubConfig: GithubConfigForm = {
  githubUsername: "your-username",
  githubRepo: "interview-solutions",
  githubBranch: "main",
  personalAccessToken: "your-github-token",
};

export function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[] | null>(null);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [githubConfig, setGithubConfig] = useState<GithubConfigForm>(initialGithubConfig);
  const [githubSaved, setGithubSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [githubVerifyError, setGithubVerifyError] = useState<string | null>(null);
  const [githubVerifyLoading, setGithubVerifyLoading] = useState(false);
  const [githubSaveLoading, setGithubSaveLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword , setshowPassword] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyGithubConfigResult | null>(null);
  const [githubSuccessMessage, setGithubSuccessMessage] = useState<string | null>(null);

  const KeyInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateApiKey = async () => {
    setIsLoading(true);
    setApiKeyError(null);
    try {
      const name = keyName.trim() || undefined;
      const response = await generateApiKey({ name });
      if(response && response.rawKey) {
        setNewKey(response.rawKey);
        setApiKeys((currentKeys) => [response.apiKey, ...currentKeys || []]);
      }
    } catch (error) {
      setApiKeyError("Failed to generate API key. Please try again.");
    } finally {
      setKeyName("");
      setIsLoading(false);
    }    
  };


  const togglePasswordVisibility = () => {
    if (KeyInputRef.current) {
      const inputType = KeyInputRef.current.type;
      KeyInputRef.current.type = inputType === "password" ? "text" : "password";
    }
  }



  const handleDeleteApiKey = async (id: string) => {
    setApiKeyError(null);
    try {
      await deleteApiKey(id);
      setApiKeys((currentKeys) => { 
        currentKeys = currentKeys || [];
        return currentKeys.filter((apiKey) => apiKey.id !== id);
      });
    } catch (error) {
      setApiKeyError("Failed to delete API key. Please try again.");
    }
  };

  const handleVerifyGithubConfig = async () => {
    setGithubVerifyLoading(true);
    setGithubVerifyError(null);
    setGithubSuccessMessage(null);
    setVerifyResult(null);
    setIsVerified(false);
    try {
      const githubConfigToVerify = {
        githubUsername: githubConfig.githubUsername,
        githubRepo: githubConfig.githubRepo,
        personalAccessToken: githubConfig.personalAccessToken,
      };

      const response = await verifyGithubConfig(githubConfigToVerify);
      setVerifyResult(response.data);
      setIsVerified(response.data.valid);
      setGithubConfig((currentConfig) => ({...currentConfig, githubBranch: response.data.defaultBranch}));
      setGithubSuccessMessage(
        response.message ?? "GitHub repository access verified successfully."
      );
    } catch (error) {
      setGithubVerifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Unable to verify the GitHub configuration. Please try again."
      );
    } finally {
      setGithubVerifyLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };



  const handleSaveGithubConfig = async () => {
    if (!verifyResult?.valid || githubSaveLoading) {
      setGithubVerifyError("Verify the GitHub configuration before saving it.");
      return;
    }

    setGithubSaveLoading(true);
    setGithubVerifyError(null);
    setGithubSuccessMessage(null);
    try {
      const response = await updateGithubConfig(githubConfig);
      setGithubSaved(true);
      setGithubSuccessMessage(
        response.message ?? "GitHub configuration saved successfully."
      );
    } catch (error) {
      setGithubSaved(false);
      setGithubVerifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Unable to save the GitHub configuration. Please try again."
      );
    } finally {
      setGithubSaveLoading(false);
    }
  };

  const handleGithubFieldChange = (
    field: keyof GithubConfigForm,
    value: string
  ) => {
    setGithubConfig((currentConfig) => ({
      ...currentConfig,
      [field]: value,
    }));
    setGithubSaved(false);
    setIsVerified(false);
    setVerifyResult(null);
    setGithubVerifyError(null);
    setGithubSuccessMessage(null);
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
            <Button
              type="button"
              onClick={handleGenerateApiKey}
              disabled={isLoading}
              className=" inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-indigo-light px-4 text-xs font-semibold text-white transition hover:bg-[#4b55dc] dark:bg-brand-indigo dark:hover:bg-[#6c72e8]" 
            >
              <Plus className="h-3.5 w-3.5" />
              Generate API key
            </Button>
          </div>

          {apiKeyError && (
            <p className="mt-2 text-sm text-red-500">{apiKeyError}</p>
          )}

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
                <Button
                  type="button"
                  onClick={handleCopyKey}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/70 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-300/20 dark:text-amber-100 dark:hover:bg-amber-400/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy key"}
                </Button>
              </div>
              <code className="mt-3 block overflow-x-auto rounded-lg bg-white/80 px-3 py-2 text-xs text-amber-950 dark:bg-black/20 dark:text-amber-100">
                {newKey}
              </code>
            </div>
          )}

          <div className="mt-6 divide-y divide-zinc-100 dark:divide-white/5">
            {apiKeys?.map((apiKey) => (
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
            {(!apiKeys || apiKeys.length === 0) && (
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
                onChange={(event) => handleGithubFieldChange("githubUsername", event.target.value)}
                placeholder="your-username"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
            <label className="space-y-2 text-xs font-semibold">
              Repository
              <input
                value={githubConfig.githubRepo}
                onChange={(event) => handleGithubFieldChange("githubRepo", event.target.value)}
                placeholder="repository-name"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
            <label className="space-y-2 text-xs font-semibold sm:col-span-2">
              Branch
              <input
                value={githubConfig.githubBranch}
                onChange={(event) => handleGithubFieldChange("githubBranch", event.target.value)}
                placeholder="main"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
            </label>
            <label className="space-y-2 relative text-xs font-semibold sm:col-span-2">
              Personal access token
              <div className="relative mt-2">
              <input
                ref = {KeyInputRef}
                type="password"
                value={githubConfig.personalAccessToken}
                onChange={(event) => handleGithubFieldChange("personalAccessToken", event.target.value)}
                placeholder="your-github-token"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none transition focus:border-brand-indigo-light focus:ring-4 focus:ring-brand-indigo-light/10 dark:border-white/10 dark:focus:border-brand-indigo"
              />
              <Button
                type="button" // Prevents form submission if placed inside a <form>
                onClick={togglePasswordVisibility}
                className="absolute rounded-2xl right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-100 dark:hover:text-zinc-300"
              >
                {/* Dynamic Icon changes based on state */}
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
             </div>
            </label>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-[#666d7c] dark:text-[#8c96aa]">
              {githubSaved ? (
                <><Check className="h-3.5 w-3.5 text-emerald-500" /> Configuration saved</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Changes are local until saved</>
              )}
            </p>
            <div className="flex gap-3">
            <div className="self-center text-xs">
              {githubVerifyError && (
                <p className="text-rose-600 dark:text-rose-400" role="alert">
                  {githubVerifyError}
                </p>
              )}
              {githubSuccessMessage && !githubVerifyError && (
                <p className="text-emerald-600 dark:text-emerald-400" role="status">
                  {githubSuccessMessage}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerifyGithubConfig}
              className=" h-10 flex items-center gap-2 rounded-xl border border-zinc-200 px-4 text-xs font-semibold transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              disabled={githubVerifyLoading || githubSaveLoading}
              >
              <span>
                {isVerified ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : null}
                </span> 
                <span>
                {isVerified ? "Verified" : "Verify GitHub configuration"}
                </span>
            </button> 

              <Button
              type="button"
              onClick={handleSaveGithubConfig}
              className="h-10 gap-2 rounded-xl border border-zinc-200 px-4 text-xs font-semibold transition hover:bg-zinc-50 hover:text-black disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-white/5 dark:disabled:border-white/5 dark:disabled:bg-white/5 dark:disabled:text-zinc-500 dark:disabled:hover:bg-white/5"
              disabled={!isVerified || githubVerifyLoading || githubSaveLoading}
              
              >
                {githubSaveLoading ? "Saving..." : "Save configuration"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
