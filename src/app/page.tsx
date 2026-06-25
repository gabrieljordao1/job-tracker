"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Share2,
  Search,
  Home,
} from "lucide-react";

// ─── Types ───────────────────────────────────────

interface Job {
  id: string;
  community: string;
  builder: string;
  lot: string;
  stage: string;
  crew: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Data from spreadsheet ───────────────────────

const COMMUNITIES: { name: string; builder: string }[] = [
  { name: "Odell Park", builder: "DRB" },
  { name: "Mallard Park", builder: "Pulte" },
  { name: "Galloway", builder: "Pulte" },
  { name: "Olmsted", builder: "Pote" },
  { name: "Sugar Creek", builder: "Red Cedar" },
  { name: "Plot", builder: "Red Cedar" },
  { name: "Anderson Townhomes", builder: "DR Horton" },
];

const STAGE_GROUPS: { group: string; color: string; stages: string[] }[] = [
  { group: "Drywall", color: "#60a5fa", stages: ["Hang", "Scrap", "Tape", "Bed", "Skim", "Sand"] },
  { group: "Paint", color: "#34d399", stages: ["Prime", "1st Point Up", "1st Paint", "Final Point Up", "Final Paint"] },
  { group: "QC", color: "#a78bfa", stages: ["QC Point Up", "QC Paint"] },
  { group: "Homeowners", color: "#f472b6", stages: ["Homeowners Point Up", "Homeowners Paint"] },
  { group: "Waiting", color: "#fbbf24", stages: ["Waiting for Prime", "Waiting for Trim", "Waiting for Final", "Waiting for QC", "Waiting for Homeowners"] },
  { group: "Done", color: "#22c55e", stages: ["Complete"] },
];

const ALL_STAGES = STAGE_GROUPS.flatMap((g) => g.stages);

const CREWS = [
  "Gabriel's Crew", "Marcus's Crew", "Tyler's Crew", "Gabe's Crew",
  "Jordan's Crew", "Sub - Drywaller", "Sub - Painter", "Sub - Texture",
];

// ─── Seed data from the spreadsheet ──────────────

function buildSeedJobs(): Job[] {
  const now = new Date().toISOString();
  const jobs: Job[] = [];
  let idx = 0;
  const add = (community: string, builder: string, lot: string, stage: string, notes = "") => {
    jobs.push({
      id: `seed_${idx++}`,
      community, builder, lot, stage, crew: "", notes,
      createdAt: now, updatedAt: now,
    });
  };

  // Odell Park — DRB (6 lots, 2 complete)
  add("Odell Park", "DRB", "1", "Complete");
  add("Odell Park", "DRB", "2", "Complete");
  add("Odell Park", "DRB", "3", "Waiting for QC");
  add("Odell Park", "DRB", "4", "Waiting for QC");
  add("Odell Park", "DRB", "5", "Waiting for QC");
  add("Odell Park", "DRB", "42", "");

  // Mallard Park — Pulte (18 lots, 12 complete)
  add("Mallard Park", "Pulte", "13", "Waiting for Homeowners");
  for (const lot of ["14","15","16","17","18","19","20"]) {
    add("Mallard Park", "Pulte", lot, "Complete");
  }
  add("Mallard Park", "Pulte", "21", "QC Point Up");
  add("Mallard Park", "Pulte", "22", "QC Point Up");
  add("Mallard Park", "Pulte", "23", "Final Point Up");
  add("Mallard Park", "Pulte", "24", "Final Point Up");
  add("Mallard Park", "Pulte", "25", "Final Point Up");
  for (const lot of ["58","59","60","61","62"]) {
    add("Mallard Park", "Pulte", lot, "Complete");
  }

  // Galloway — Pulte (8 lots, 3 complete)
  for (const lot of ["21","22","23","24"]) {
    add("Galloway", "Pulte", lot, "Waiting for Homeowners");
  }
  for (const lot of ["25","26","27"]) {
    add("Galloway", "Pulte", lot, "Complete");
  }
  add("Galloway", "Pulte", "28", "Homeowners Paint");

  // Olmsted — Pote (5 lots, 3 complete)
  add("Olmsted", "Pote", "276", "Complete");
  add("Olmsted", "Pote", "277", "Complete");
  add("Olmsted", "Pote", "278", "Complete");
  add("Olmsted", "Pote", "279", "Waiting for Homeowners");
  add("Olmsted", "Pote", "280", "QC Point Up");

  // Sugar Creek — Red Cedar (40 lots, 10 complete)
  for (const lot of ["1","2","3","4"]) add("Sugar Creek", "Red Cedar", lot, "Complete");
  add("Sugar Creek", "Red Cedar", "5", "Waiting for Homeowners");
  for (const lot of ["6","7","8"]) add("Sugar Creek", "Red Cedar", lot, "Complete");
  add("Sugar Creek", "Red Cedar", "9", "Waiting for Homeowners");
  add("Sugar Creek", "Red Cedar", "10", "Homeowners Point Up");
  add("Sugar Creek", "Red Cedar", "11", "Waiting for Homeowners");
  for (const lot of ["12","13","14"]) add("Sugar Creek", "Red Cedar", lot, "Complete");
  add("Sugar Creek", "Red Cedar", "15", "Waiting for Homeowners", "need repair done in garage");
  for (let i = 16; i <= 33; i++) {
    add("Sugar Creek", "Red Cedar", String(i), "Waiting for Homeowners");
  }
  for (let i = 34; i <= 40; i++) {
    add("Sugar Creek", "Red Cedar", String(i), "Waiting for Final");
  }

  // Plot — Red Cedar (32 lots, 0 complete)
  for (const s of ["A","B","C","D"]) {
    add("Plot", "Red Cedar", `1${s}`, "Waiting for Homeowners", s === "A" ? "Need to ask for EPO for accent colors" : "");
    add("Plot", "Red Cedar", `2${s}`, "Waiting for Homeowners");
    add("Plot", "Red Cedar", `3${s}`, "Waiting for Homeowners");
    add("Plot", "Red Cedar", `4${s}`, "Waiting for Homeowners");
    add("Plot", "Red Cedar", `5${s}`, "");
    add("Plot", "Red Cedar", `6${s}`, "Waiting for QC");
    add("Plot", "Red Cedar", `7${s}`, "Waiting for QC");
    add("Plot", "Red Cedar", `8${s}`, "Waiting for Homeowners");
  }

  // Anderson Townhomes — DR Horton (19 lots, 0 complete)
  for (const lot of ["1","2","3","4","5"]) add("Anderson Townhomes", "DR Horton", lot, "Final Paint");
  add("Anderson Townhomes", "DR Horton", "6", "Waiting for QC");
  add("Anderson Townhomes", "DR Horton", "7", "Final Paint");
  add("Anderson Townhomes", "DR Horton", "8", "Final Paint");
  add("Anderson Townhomes", "DR Horton", "9", "Waiting for Final");
  for (const lot of ["10","11","12","13","14","15","16","17","18"]) {
    add("Anderson Townhomes", "DR Horton", lot, "Waiting for QC");
  }
  add("Anderson Townhomes", "DR Horton", "19", "Waiting for Homeowners");

  return jobs;
}

// ─── Helpers ─────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("stancil_jobs_v3");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Re-seed if saved data is empty (user deleted all, or browser purged)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // First load or empty: seed from spreadsheet data
    const seed = buildSeedJobs();
    localStorage.setItem("stancil_jobs_v3", JSON.stringify(seed));
    return seed;
  } catch {
    // Corrupted data — re-seed
    const seed = buildSeedJobs();
    try { localStorage.setItem("stancil_jobs_v3", JSON.stringify(seed)); } catch {}
    return seed;
  }
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem("stancil_jobs_v3", JSON.stringify(jobs));
}

function stageColor(stage: string): string {
  for (const g of STAGE_GROUPS) {
    if (g.stages.includes(stage)) return g.color;
  }
  return "#94a3b8";
}

function stageGroup(stage: string): string {
  for (const g of STAGE_GROUPS) {
    if (g.stages.includes(stage)) return g.group;
  }
  return "—";
}

function builderFor(community: string): string {
  return COMMUNITIES.find((c) => c.name === community)?.builder || "";
}

// ─── Main Page ───────────────────────────────────

export default function JobTracker() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStageGroup, setFilterStageGroup] = useState<string>("all");
  const [filterCommunity, setFilterCommunity] = useState<string>("all");
  const [expandedCommunity, setExpandedCommunity] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    community: "",
    lot: "",
    stage: "",
    crew: "",
    notes: "",
  });

  useEffect(() => {
    setJobs(loadJobs());
  }, []);

  const persist = useCallback((updated: Job[]) => {
    setJobs(updated);
    saveJobs(updated);
  }, []);

  // ─── CRUD ────────────────────────────────────

  const handleSubmit = () => {
    if (!form.community || !form.lot) return;
    const now = new Date().toISOString();
    const builder = builderFor(form.community);

    if (editingId) {
      persist(
        jobs.map((j) =>
          j.id === editingId
            ? { ...j, ...form, builder, updatedAt: now }
            : j
        )
      );
      setEditingId(null);
    } else {
      persist([
        ...jobs,
        { id: genId(), ...form, builder, createdAt: now, updatedAt: now },
      ]);
    }
    resetForm();
  };

  const handleEdit = (job: Job) => {
    setForm({
      community: job.community,
      lot: job.lot,
      stage: job.stage,
      crew: job.crew,
      notes: job.notes,
    });
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this job?")) return;
    persist(jobs.filter((j) => j.id !== id));
  };

  const quickStage = (id: string, stage: string) => {
    const now = new Date().toISOString();
    persist(jobs.map((j) => (j.id === id ? { ...j, stage, updatedAt: now } : j)));
  };

  const resetForm = () => {
    setForm({ community: "", lot: "", stage: "", crew: "", notes: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleResetData = () => {
    if (!confirm("Reset all jobs to the original spreadsheet data? Any changes you made will be lost.")) return;
    const seed = buildSeedJobs();
    persist(seed);
  };

  // ─── Filtering ───────────────────────────────

  const filtered = jobs.filter((j) => {
    if (filterCommunity !== "all" && j.community !== filterCommunity) return false;
    if (filterStageGroup !== "all") {
      const sg = STAGE_GROUPS.find((g) => g.group === filterStageGroup);
      if (sg && !sg.stages.includes(j.stage)) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        j.community.toLowerCase().includes(s) ||
        j.lot.toLowerCase().includes(s) ||
        j.crew.toLowerCase().includes(s) ||
        j.notes.toLowerCase().includes(s) ||
        j.stage.toLowerCase().includes(s) ||
        j.builder.toLowerCase().includes(s)
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
  const drywall = jobs.filter((j) => STAGE_GROUPS[0].stages.includes(j.stage)).length;
  const paint = jobs.filter((j) => STAGE_GROUPS[1].stages.includes(j.stage)).length;
  const waiting = jobs.filter((j) => STAGE_GROUPS[4].stages.includes(j.stage)).length;
  const complete = jobs.filter((j) => j.stage === "Complete").length;

  // Unique communities in jobs
  const jobCommunities = [...new Set(jobs.map((j) => j.community))].sort();

  // Report — open the report page (reads from localStorage)
  const handleReport = () => {
    window.open("/report", "_blank");
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
              onClick={handleReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
            >
              <Share2 size={14} />
              Report
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { n: total, label: "Total", color: "" },
            { n: drywall, label: "Drywall", color: "text-blue-400" },
            { n: paint, label: "Paint", color: "text-emerald-400" },
            { n: waiting, label: "Waiting", color: "text-amber-400" },
            { n: complete, label: "Done", color: "text-green-500" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-lg p-2 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.n}</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.4)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-2">
            <Search size={16} className="text-[rgba(255,255,255,0.3)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lots, communities, builders..."
              className="bg-transparent flex-1 outline-none text-sm placeholder:text-[rgba(255,255,255,0.25)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <select
              value={filterStageGroup}
              onChange={(e) => setFilterStageGroup(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              <option value="all">All Stages</option>
              {STAGE_GROUPS.map((g) => (
                <option key={g.group} value={g.group}>{g.group}</option>
              ))}
            </select>
            <select
              value={filterCommunity}
              onChange={(e) => setFilterCommunity(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              <option value="all">All Communities</option>
              {jobCommunities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Job List grouped by community */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-lg p-8 text-center">
            <Home size={32} className="mx-auto mb-3 text-[rgba(255,255,255,0.2)]" />
            <p className="text-[rgba(255,255,255,0.5)]">No jobs match your filters</p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([community, cJobs]) => {
              const isExpanded = expandedCommunity === community || expandedCommunity === null;
              const done = cJobs.filter((j) => j.stage === "Complete").length;
              const builder = cJobs[0]?.builder || builderFor(community);
              return (
                <div key={community} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedCommunity(expandedCommunity === community ? null : community)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <div className="text-left min-w-0">
                        <span className="font-medium">{community}</span>
                        <span className="text-xs text-[rgba(255,255,255,0.35)] ml-2">{builder}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] shrink-0 ml-2">
                        {cJobs.length}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-400 shrink-0">
                      {done}/{cJobs.length} done
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#1a1a1a]">
                      {cJobs
                        .sort((a, b) => a.lot.localeCompare(b.lot, undefined, { numeric: true }))
                        .map((job) => (
                          <div
                            key={job.id}
                            className="px-4 py-2.5 border-b border-[#1a1a1a] last:border-0 flex items-center gap-3"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: stageColor(job.stage) }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-medium">Lot {job.lot}</span>
                                {job.stage && (
                                  <span
                                    className="text-[11px] px-1.5 py-0.5 rounded"
                                    style={{
                                      background: `${stageColor(job.stage)}15`,
                                      color: stageColor(job.stage),
                                    }}
                                  >
                                    {job.stage}
                                  </span>
                                )}
                              </div>
                              {(job.crew || job.notes) && (
                                <div className="text-xs text-[rgba(255,255,255,0.35)] truncate mt-0.5">
                                  {job.crew}{job.crew && job.notes ? " — " : ""}{job.notes}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleEdit(job)} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded">
                                <Edit3 size={14} className="text-[rgba(255,255,255,0.4)]" />
                              </button>
                              <button onClick={() => handleDelete(job.id)} className="p-1.5 hover:bg-red-400/10 rounded">
                                <Trash2 size={14} className="text-red-400/40" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Reset + Footer */}
      {jobs.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <Briefcase size={40} className="mx-auto text-[rgba(255,255,255,0.15)]" />
          <p className="text-[rgba(255,255,255,0.4)] text-sm">No jobs found</p>
          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-lg text-sm bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors"
          >
            Load Default Jobs
          </button>
        </div>
      )}
      {jobs.length > 0 && (
        <div className="text-center py-6">
          <button
            onClick={handleResetData}
            className="text-xs text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.5)] transition-colors"
          >
            Reset to spreadsheet data
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#111] border border-[#222] rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              <h2 className="font-semibold">{editingId ? "Edit Job" : "Add New Job"}</h2>
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
                    <option key={c.name} value={c.name}>{c.name} ({c.builder})</option>
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
                  placeholder="e.g. 12, 3A, 45"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400 placeholder:text-[rgba(255,255,255,0.2)]"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="">Select stage...</option>
                  {STAGE_GROUPS.map((g) => (
                    <optgroup key={g.group} label={`── ${g.group} ──`}>
                      {g.stages.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Crew */}
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] mb-1 block">Crew (optional)</label>
                <select
                  value={form.crew}
                  onChange={(e) => setForm({ ...form, crew: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="">No crew assigned</option>
                  {CREWS.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
