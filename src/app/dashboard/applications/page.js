"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus, Trash2, Table, Info } from "lucide-react";

const STORAGE_KEY = "agentPro.applicationLog.v1";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyRow() {
  return {
    id: newId(),
    appliedDate: "",
    company: "",
    roleTitle: "",
    location: "",
    workMode: "",
    platform: "",
    salaryPackage: "",
    resumeUsed: "",
    resumeTailored: "no",
    coverLetterUsed: "no",
    coverLetterFile: "",
    status: "Applied",
    notes: "",
  };
}

/** @param {string} v */
function csvEscape(v) {
  const s = v ?? "";
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  const keys = [
    "appliedDate",
    "company",
    "roleTitle",
    "location",
    "workMode",
    "platform",
    "salaryPackage",
    "resumeUsed",
    "resumeTailored",
    "coverLetterUsed",
    "coverLetterFile",
    "status",
    "notes",
  ];
  const header =
    "Applied Date,Company,Role Title,Location,Work Mode,Platform,Salary Package,Resume Used,Resume Tailored,Cover Letter Used,Cover Letter File,Status,Notes";
  const lines = rows.map((r) =>
    keys.map((k) => csvEscape(r[k])).join(","),
  );
  return `\uFEFF${header}\n${lines.join("\n")}`;
}

export default function ApplicationsLogPage() {
  const [rows, setRows] = useState(() => []);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setRows(parsed);
          setHydrated(true);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setRows([createEmptyRow()]);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows, hydrated]);

  const patchRow = useCallback((id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const exportCsv = useCallback(() => {
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const metaHint = useMemo(
    () =>
      "Data is saved in this browser (localStorage). Later we can plug in your Sheet API / database.",
    [],
  );

  if (!hydrated) {
    return (
      <div className="p-8 max-w-[100vw] mx-auto">
        <p className="text-slate-500 text-sm">Loading apply log…</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[100vw]">
      <header className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
            <Table className="w-9 h-9 text-blue-400 shrink-0" />
            Applications log (sheet)
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Each row = one apply. Mention which <strong className="text-slate-300">resume file</strong> and{" "}
            <strong className="text-slate-300">cover letter</strong> you sent, salary shown, location,  
            work mode, and dates — same idea as Excel.
          </p>
          <p className="text-xs text-slate-600 mt-2 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
            {metaHint}{" "}
            <Link href="/dashboard/resume" className="text-blue-400 hover:underline ml-1">
              Upload resumes & letters
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/15"
          >
            <Plus className="w-4 h-4" /> Add row
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 font-bold text-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-black/35 border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-3 w-36 sticky left-0 z-10 bg-slate-900/95 backdrop-blur border-r border-white/10">
                  Applied date
                </th>
                <th className="p-3 min-w-[120px]">Company</th>
                <th className="p-3 min-w-[140px]">Role / title</th>
                <th className="p-3 min-w-[110px]">Location</th>
                <th className="p-3 w-32">Work mode</th>
                <th className="p-3 min-w-[100px]">Platform</th>
                <th className="p-3 min-w-[130px]">Salary package</th>
                <th className="p-3 min-w-[140px]">Resume used</th>
                <th className="p-3 w-28 text-center">Tailored?</th>
                <th className="p-3 w-28 text-center">CL used?</th>
                <th className="p-3 min-w-[120px]">Cover letter file</th>
                <th className="p-3 w-36">Status</th>
                <th className="p-3 min-w-[180px]">Notes</th>
                <th className="p-3 w-14"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 hover:bg-white/[0.04] transition-colors align-top"
                >
                  <td className="p-2 sticky left-0 z-[1] bg-slate-950/90 backdrop-blur border-r border-white/10">
                    <input
                      type="date"
                      value={row.appliedDate}
                      onChange={(e) => patchRow(row.id, "appliedDate", e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={row.company}
                      placeholder="Google"
                      onChange={(e) => patchRow(row.id, "company", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={row.roleTitle}
                      placeholder="Senior React Engineer"
                      onChange={(e) => patchRow(row.id, "roleTitle", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={row.location}
                      placeholder="Bangalore / Remote India"
                      onChange={(e) => patchRow(row.id, "location", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={row.workMode || ""}
                      onChange={(e) => patchRow(row.id, "workMode", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    >
                      <option value="">— Mode —</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      value={row.platform}
                      placeholder="LinkedIn, Naukri…"
                      onChange={(e) => patchRow(row.id, "platform", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={row.salaryPackage}
                      placeholder='e.g. "₹32 LPA" / "Discussed"'
                      onChange={(e) => patchRow(row.id, "salaryPackage", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={row.resumeUsed}
                      placeholder='e.g. "Main_Resume_2024.pdf"'
                      onChange={(e) => patchRow(row.id, "resumeUsed", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <select
                      value={row.resumeTailored || "no"}
                      onChange={(e) => patchRow(row.id, "resumeTailored", e.target.value)}
                      className="w-full max-w-[6.5rem] bg-black/35 border border-white/10 rounded-lg px-1 py-2 text-slate-200 text-xs mx-auto outline-none focus:border-blue-500/45"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <select
                      value={row.coverLetterUsed || "no"}
                      onChange={(e) => patchRow(row.id, "coverLetterUsed", e.target.value)}
                      className="w-full max-w-[6.5rem] bg-black/35 border border-white/10 rounded-lg px-1 py-2 text-slate-200 text-xs mx-auto outline-none focus:border-blue-500/45"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      value={row.coverLetterFile}
                      placeholder='e.g. "CL_Meta.pdf"'
                      onChange={(e) => patchRow(row.id, "coverLetterFile", e.target.value)}
                      disabled={row.coverLetterUsed !== "yes"}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={row.status}
                      onChange={(e) => patchRow(row.id, "status", e.target.value)}
                      className="w-full bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Withdrawn">Withdrawn</option>
                      <option value="No response">No response</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <textarea
                      value={row.notes}
                      rows={2}
                      placeholder="HM name, recruiter, links…"
                      onChange={(e) => patchRow(row.id, "notes", e.target.value)}
                      className="w-full min-h-[3rem] bg-black/35 border border-white/10 rounded-lg px-2 py-2 text-slate-200 text-xs outline-none focus:border-blue-500/45 resize-y"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Delete row"
                      className="p-2 rounded-xl text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-30"
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
