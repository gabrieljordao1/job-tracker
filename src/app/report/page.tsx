"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Briefcase, CheckCircle, Clock, AlertTriangle, Pause } from "lucide-react";

interface Job {
  id: string;
  community: string;
  lot: string;
  phase: string;
  crew: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

function phaseColor(phase: string) {
  const map: Record<string, string> = {
    drywall: "#60a5fa", texture: "#a78bfa", prime: "#c084fc",
    paint: "#34d399", patch: "#fbbf24", other: "#94a3b8",
  };
  return map[phase] || "#94a3b8";
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    not_started: "#94a3b8", in_progress: "#60a5fa",
    complete: "#34d399", delayed: "#f87171", on_hold: "#fbbf24",
  };
  return map[status] || "#94a3b8";
}

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ReportContent() {
  const params = useSearchParams();
  const raw = params.get("data");

  let jobs: Job[] = [];
  try {
    if (raw) jobs = JSON.parse(atob(raw));
  } catch {
    // invalid data
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-[rgba(255,255,255,0.2)]" />
          <h1 className="text-xl font-semibold mb-2">No Report Data</h1>
          <p className="text-sm text-[rgba(255,255,255,0.5)]">
            This link doesn&apos;t contain any job data. Ask the sender for an updated link.
          </p>
        </div>
      </div>
    );
  }

  const total = jobs.length;
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const complete = jobs.filter((j) => j.status === "complete").length;
  const delayed = jobs.filter((j) => j.status === "delayed").length;
  const notStarted = jobs.filter((j) => j.status === "not_started").length;
  const onHold = jobs.filter((j) => j.status === "on_hold").length;

  // Group by community
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
      {/* Header */}
      <div className="text-center pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Briefcase size={24} className="text-emerald-400" />
          <h1 className="text-2xl font-bold">Weekly Job Report</h1>
        </div>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          Stancil Services &mdash; {dateStr}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-[rgba(255,255,255,0.4)]">Total Jobs</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{inProgress}</div>
          <div className="text-xs text-[rgba(255,255,255,0.4)]">In Progress</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{complete}</div>
          <div className="text-xs text-[rgba(255,255,255,0.4)]">Complete</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{delayed}</div>
          <div className="text-xs text-[rgba(255,255,255,0.4)]">Delayed</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-lg p-3 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-[rgba(255,255,255,0.6)]">{notStarted + onHold}</div>
          <div className="text-xs text-[rgba(255,255,255,0.4)]">Waiting</div>
        </div>
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
            className="h-full rounded-full transition-all"
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
            const cDone = cJobs.filter((j) => j.status === "complete").length;
            const cActive = cJobs.filter((j) => j.status === "in_progress").length;
            const cDelayed = cJobs.filter((j) => j.status === "delayed").length;
            return (
              <div key={community} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="font-medium">{community}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {cActive > 0 && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Clock size={12} /> {cActive}
                      </span>
                    )}
                    {cDone > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle size={12} /> {cDone}
                      </span>
                    )}
                    {cDelayed > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertTriangle size={12} /> {cDelayed}
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t border-[#1a1a1a]">
                  {cJobs
                    .sort((a, b) => a.lot.localeCompare(b.lot, undefined, { numeric: true }))
                    .map((job) => (
                      <div
                        key={job.id}
                        className="px-4 py-2 border-b border-[#1a1a1a] last:border-0 flex items-center gap-3"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: statusColor(job.status) }}
                        />
                        <span className="font-mono text-sm">Lot {job.lot}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: `${phaseColor(job.phase)}20`,
                            color: phaseColor(job.phase),
                          }}
                        >
                          {fmt(job.phase)}
                        </span>
                        <span className="text-xs text-[rgba(255,255,255,0.3)] ml-auto">
                          {fmt(job.status)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[rgba(255,255,255,0.25)] pt-4">
        Generated {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        {" "}at {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[rgba(255,255,255,0.5)]">Loading report...</div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
