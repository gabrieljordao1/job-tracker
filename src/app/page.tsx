"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Share2,
  Filter,
  Search,
  Copy,
  Check,
  Home,
} from "lucide-react";

// ─── Types ───────────────────────────────────────

interface Job {
  id: string;
  community: string;
  lot: string;
  phase: Phase;
  crew: string;
  status: Status;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

type Phase = "drywall" | "texture" | "paint" | "patch" | "prime" | "other";
type Status = "not_started" | "in_progress" | "complete" | "delayed" | "on_hold";

const PHASES: { value: Phase; label: string; color: string }[] = [
  { value: "drywall", label: "Drywall", color: "#60a5fa" },
  { value: "texture", label: "Texture", color: "#a78bfa" },
  { value: "prime", label: "Prime", color: "#c084fc" },
  { value: "paint", label: "Paint", color: "#34d399" },
  { value: "patch", label: "Patch", color: "#fbbf24" },
  { value: "other", label: "Other", color: "#94a3b8" },
];

const STATUSES: { value: Status; label: string; color: string; bg: string }[] = [
  { value: "not_started", label: "Not Started", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  { value: "in_progress", label: "In Progress", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  { value: "complete", label: "Complete", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  { value: "delayed", label: "Delayed", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  { value: "on_hold", label: "On Hold", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
];

const COMMUNITIES = [
  "Mallard Park", "Odell Park", "Galloway", "Cedar Hills",
  "Olmsted", "Ridgeview", "Context", "Sugar Creek",
  "Cardinal Creek", "Plott", "Cama",
];

const CREWS = [
  "Gabriel's Crew", "Marcus's Crew", "Tyler's Crew", "Gabe's Crew",
  "Jordan's Crew", "Sub - Drywaller", "Sub - Painter", "Sub - Texture",
];

// ─── Helpers ─────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("stancil_jobs");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem("stancil_jobs", JSON.stringify(jobs));
}

function phaseColor(phase: Phase) {
  return PHASES.find((p) => p.value === phase)?.color || "#94a3b8";
}

function statusInfo(status: Status) {
  return STATUSES.find((s) => s.value === status) || STATUSES[0];
}

function fmt(label: string) {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Main Page ───────────────────────────────────

export default function JobTracker() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterCommunity, setFilterCommunity] = useState<string>("all");
  const [expandedCommunity, setExpandedCommunity] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");

  // Form state
  const [form, setForm] = useState({
    community: "",
    lot: "",
    phase: "paint" as Phase,
    crew: "",
    status: "not_started" as Status,
    notes: "",
  });

  // Load on mount
  useEffect(() => {
    setJobs(loadJobs());
  }, []);

  // Save on change
  const persist = useCallback((updated: Job[]) => {
    setJobs(updated);
    saveJobs(updated);
  }, []);

  // ─── CRUD ────────────────────────────────────

  const handleSubmit = () => {
    if (!form.community || !form.lot) return;
    const now = new Date().toISOString();

    if (editingId) {
      persist(
        jobs.map((j) =>
          j.id === editingId
            ? { ...j, ...form, updatedAt: now }
            : j
        )
      );
      setEditingId(null);
    } else {
      persist([
        ...jobs,
        { id: genId(), ...form, createdAt: now, updatedAt: now },
      ]);
    }
    resetForm();
  };

  const handleEdit = (job: Job) => {
    setForm({
      community: job.community,
      lot: job.lot,
      phase: job.phase,
      crew: job.crew,
      status: job.status,
      notes: job.notes,
    });
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this job?")) return;
    persist(jobs.filter((j) => j.id !== id));
  };

  const quickStatus = (id: string, status: Status) => {
    const now = new Date().toISOString();
    persist(jobs.map((j) => (j.id === id ? { ...j, status, updatedAt: now } : j)));
  };

  const resetForm = () => {
    setForm({ community: "", lot: "", phase: "paint", crew: "", status: "not_started", notes: "" });
    setShowForm(false);
    setEditingId(null);
  };

  // ─── Filtering ───────────────────────────────

  const filtered = jobs.filter((j) => {
    if (filterStatus !== "all" && j.status !== filterStatus) return false;
    if (filterCommunity !== "all" && j.community !== filterCommunity) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        j.community.toLowerCase().includes(s) ||
        j.lot.toLowerCase().includes(s) ||
        j.crew.toLowerCase().includes(s) ||
        j.notes.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Group by community
  const grouped = filtered.reduce<Record<string, Job[]>>((acc, j) => {
    (acc[j.community] ||= []).push(j);
    return acc;
  }, {});

  // Stats
  const total = jobs.length;
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const complete = jobs.filter((j) => j.status === "complete").length;
  const delayed = jobs.filter((j) => j.status === "delayed").length;

  // Unique communities in jobs
  const jobCommunities = [...new Set(jobs.map((j) => j.community))].sort();

  // Share link
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/report?data=${encodeURIComponent(btoa(JSON.stringify(jobs)))}`
    : "";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Weekly Job Report", url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222] px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-emerald-400" />
            <h1 className="text-lg font-semibold">Job Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              {copied ? "Copied!" : "Share Report"}
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors"
            >
              <Plus size={14} />
              Add Job
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-[rgba(255,255,255,0.4)]">Total</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{inProgress}</div>
            <div className="text-xs text-[rgba(255,255,255,0.4)]">Active</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{complete}</div>
            <div className="text-xs text-[rgba(255,255,255,0.4)]">Done</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{delayed}</div>
            <div className="text-xs text-[rgba(255,255,255,0.4)]">Delayed</div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-2">
            <Search size={16} className="text-[rgba(255,255,255,0.3)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="bg-transparent flex-1 outline-none text-sm placeholder:text-[rgba(255,255,255,0.25)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-sm outline-none min-w-0"
            >
              <option value="all">All Status</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterCommunity}
              onChange={(e) => setFilterCommunity(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-sm outline-none min-w-0"
            >
              <option value="all">All Communities</option>
              {jobCommunities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Job List (grouped by community) */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-lg p-8 text-center">
            <Home size={32} className="mx-auto mb-3 text-[rgba(255,255,255,0.2)]" />
            <p className="text-[rgba(255,255,255,0.5)] mb-1">No jobs yet</p>
            <p className="text-xs text-[rgba(255,255,255,0.3)]">Tap &quot;Add Job&quot; to get started</p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([community, communityJobs]) => {
              const isExpanded = expandedCommunity === community || expandedCommunity === null;
              const done = communityJobs.filter((j) => j.status === "complete").length;
              return (
                <div key={community} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedCommunity(
                        expandedCommunity === community ? null : community
                      )
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium">{community}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)]">
                        {communityJobs.length} job{communityJobs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-400">
                      {done}/{communityJobs.length} done
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#1a1a1a]">
                      {communityJobs
                        .sort((a, b) => a.lot.localeCompare(b.lot, undefined, { numeric: true }))
                        .map((job) => {
                          const si = statusInfo(job.status);
                          return (
                            <div
                              key={job.id}
                              className="px-4 py-3 border-b border-[#1a1a1a] last:border-0 flex items-center gap-3"
                            >
                              {/* Status dot + lot */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ background: si.color }}
                                  title={si.label}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium">
                                      Lot {job.lot}
                                    </span>
                                    <span
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{
                                        background: `${phaseColor(job.phase)}20`,
                                        color: phaseColor(job.phase),
                                      }}
                                    >
                                      {fmt(job.phase)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-[rgba(255,255,255,0.4)] truncate">
                                    {job.crew || "No crew"}{job.notes ? ` — ${job.notes}` : ""}
                                  </div>
                                </div>
                              </div>

                              {/* Quick status buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <select
                                  value={job.status}
                                  onChange={(e) => quickStatus(job.id, e.target.value as Status)}
                                  className="bg-transparent border border-[#333] rounded px-1.5 py-1 text-xs outline-none"
                                  style={{ color: si.color }}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleEdit(job)}
                                  className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded"
                                >
                                  <Edit3 size={14} className="text-[rgba(255,255,255,0.4)]" />
                                </button>
                                <button
                                  onClick={() => handleDelete(job.id)}
                                  className="p-1.5 hover:bg-red-400/10 rounded"
                                >
                                  <Trash2 size={14} className="text-red-400/50" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Add/Edit Job Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#111] border border-[#222] rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              <h2 className="font-semibold">
                {editingId ? "Edit Job" : "Add New Job"}
              </h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-[#1a1a1a] rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Community */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Community</label>
                <select
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="">Select community...</option>
                  {COMMUNITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Lot */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Lot Number</label>
                <input
                  type="text"
                  value={form.lot}
                  onChange={(e) => setForm({ ...form, lot: e.target.value })}
                  placeholder="e.g. 12, 3A, 45-48"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400 placeholder:text-[rgba(255,255,255,0.2)]"
                />
              </div>

              {/* Phase */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Phase</label>
                <div className="grid grid-cols-3 gap-2">
                  {PHASES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setForm({ ...form, phase: p.value })}
                      className="px-3 py-2 rounded-lg text-sm border transition-colors"
                      style={{
                        background: form.phase === p.value ? `${p.color}15` : "transparent",
                        borderColor: form.phase === p.value ? `${p.color}50` : "#222",
                        color: form.phase === p.value ? p.color : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crew */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Crew</label>
                <select
                  value={form.crew}
                  onChange={(e) => setForm({ ...form, crew: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="">Select crew...</option>
                  {CREWS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400 placeholder:text-[rgba(255,255,255,0.2)] resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!form.community || !form.lot}
                className="w-full py-3 rounded-lg text-sm font-medium bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {editingId ? "Save Changes" : "Add Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
