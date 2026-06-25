"use client";

import { useState, useEffect } from "react";
import { Briefcase, Share2, Download, Check } from "lucide-react";

interface Job {
  id: string;
  community: string;
  builder: string;
  lot: string;
  stage: string;
  crew: string;
  notes: string;
}

const STAGE_GROUPS: { group: string; color: string; stages: string[] }[] = [
  { group: "Drywall", color: "#60a5fa", stages: ["Hang", "Scrap", "Tape", "Bed", "Skim", "Sand"] },
  { group: "Paint", color: "#34d399", stages: ["Prime", "1st Point Up", "1st Paint", "Final Point Up", "Final Paint"] },
  { group: "QC", color: "#a78bfa", stages: ["QC Point Up", "QC Paint"] },
  { group: "Homeowners", color: "#f472b6", stages: ["Homeowners Point Up", "Homeowners Paint"] },
  { group: "Waiting", color: "#fbbf24", stages: ["Waiting for Prime", "Waiting for Trim", "Waiting for Final", "Waiting for QC", "Waiting for Homeowners"] },
  { group: "Done", color: "#22c55e", stages: ["Complete"] },
];

function stageColor(stage: string): string {
  for (const g of STAGE_GROUPS) {
    if (g.stages.includes(stage)) return g.color;
  }
  return "#94a3b8";
}

export default function ReportPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    // Read jobs from localStorage (same key as main page)
    try {
      const raw = localStorage.getItem("stancil_jobs_v3");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setJobs(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const handleShare = async () => {
    // Build a clean text summary to share
    const grouped = jobs.reduce<Record<string, Job[]>>((acc, j) => {
      (acc[j.community] ||= []).push(j);
      return acc;
    }, {});

    let text = `Stancil Services — Weekly Job Report\n`;
    text += `${jobs.length} total lots · ${jobs.filter(j => j.stage === "Complete").length} complete\n\n`;

    for (const [community, cJobs] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
      const builder = cJobs[0]?.builder || "";
      const done = cJobs.filter(j => j.stage === "Complete").length;
      text += `${community} (${builder}) — ${done}/${cJobs.length} done\n`;
      for (const job of cJobs.sort((a, b) => a.lot.localeCompare(b.lot, undefined, { numeric: true }))) {
        text += `  Lot ${job.lot}: ${job.stage || "—"}${job.notes ? ` (${job.notes})` : ""}\n`;
      }
      text += "\n";
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: "Weekly Job Report", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { /* ignore */ }
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-[rgba(255,255,255,0.2)]" />
          <h1 className="text-xl font-semibold mb-2">No Report Data</h1>
          <p className="text-sm text-[rgba(255,255,255,0.5)]">
            No jobs found. Add jobs on the main page first.
          </p>
        </div>
      </div>
    );
  }

  const total = jobs.length;
  const drywall = jobs.filter((j) => STAGE_GROUPS[0].stages.includes(j.stage)).length;
  const paint = jobs.filter((j) => STAGE_GROUPS[1].stages.includes(j.stage)).length;
  const qc = jobs.filter((j) => STAGE_GROUPS[2].stages.includes(j.stage)).length;
  const homeowners = jobs.filter((j) => STAGE_GROUPS[3].stages.includes(j.stage)).length;
  const waiting = jobs.filter((j) => STAGE_GROUPS[4].stages.includes(j.stage)).length;
  const complete = jobs.filter((j) => j.stage === "Complete").length;

  const grouped = jobs.reduce<Record<string, Job[]>>((acc, j) => {
    (acc[j.community] ||= []).push(j);
    return acc;
  }, {});

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const dateStr = `Week of ${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header with share button */}
      <div className="text-center pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Briefcase size={24} className="text-emerald-400" />
          <h1 className="text-2xl font-bold">Weekly Job Report</h1>
        </div>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          Stancil Services &mdash; {dateStr}
        </p>
        <button
          onClick={handleShare}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors"
        >
          {shared ? <Check size={14} /> : <Share2 size={14} />}
          {shared ? "Copied!" : "Share Report"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { n: total, label: "Total", color: "" },
          { n: drywall, label: "Drywall", color: "text-blue-400" },
          { n: paint, label: "Paint", color: "text-emerald-400" },
          { n: qc + homeowners, label: "QC/HO", color: "text-purple-400" },
          { n: waiting, label: "Waiting", color: "text-amber-400" },
          { n: complete, label: "Done", color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.n}</div>
            <div className="text-xs text-[rgba(255,255,255,0.4)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Completion</span>
          <span className="text-sm text-emerald-400 font-medium">
            {total > 0 ? Math.round((complete / total) * 100) : 0}%
          </span>
        </div>
        <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${total > 0 ? (complete / total) * 100 : 0}%`,
              background: "linear-gradient(90deg, #34d399, #10b981)",
            }}
          />
        </div>
      </div>

      {/* By Community */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">By Community</h2>
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([community, cJobs]) => {
            const builder = cJobs[0]?.builder || "";
            const cDone = cJobs.filter((j) => j.stage === "Complete").length;
            const cDrywall = cJobs.filter((j) => STAGE_GROUPS[0].stages.includes(j.stage)).length;
            const cPaint = cJobs.filter((j) => STAGE_GROUPS[1].stages.includes(j.stage)).length;
            const cWaiting = cJobs.filter((j) => STAGE_GROUPS[4].stages.includes(j.stage)).length;
            return (
              <div key={community} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-medium">{community}</span>
                      <span className="text-xs text-[rgba(255,255,255,0.35)] ml-2">{builder}</span>
                    </div>
                    <span className="text-xs text-emerald-400">{cDone}/{cJobs.length} done</span>
                  </div>
                  <div className="flex gap-3 text-xs text-[rgba(255,255,255,0.5)]">
                    {cDrywall > 0 && <span className="text-blue-400">{cDrywall} drywall</span>}
                    {cPaint > 0 && <span className="text-emerald-400">{cPaint} paint</span>}
                    {cWaiting > 0 && <span className="text-amber-400">{cWaiting} waiting</span>}
                  </div>
                </div>
                <div className="border-t border-[#1a1a1a]">
                  {cJobs
                    .sort((a, b) => a.lot.localeCompare(b.lot, undefined, { numeric: true }))
                    .map((job) => (
                      <div key={job.id} className="px-4 py-1.5 border-b border-[#1a1a1a] last:border-0 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: stageColor(job.stage) }} />
                        <span className="font-mono text-xs w-12">Lot {job.lot}</span>
                        <span className="text-xs text-[rgba(255,255,255,0.5)] flex-1 truncate">{job.stage || "—"}</span>
                        {job.notes && <span className="text-[10px] text-[rgba(255,255,255,0.3)] truncate max-w-[120px]">{job.notes}</span>}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
      </div>

      <div className="text-center text-xs text-[rgba(255,255,255,0.25)] pt-4">
        Generated {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}
