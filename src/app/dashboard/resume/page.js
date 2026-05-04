"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, FileText, CheckCircle2, Loader2, Sparkles, Trash2, Eye, Mail } from "lucide-react";

export default function ResumePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [resumes, setResumes] = useState([
    { id: "1", name: "Main_Resume_2024.pdf", size: "1.2 MB", date: "Oct 24, 2024", isDefault: true },
    { id: "2", name: "Frontend_Specific.pdf", size: "850 KB", date: "Oct 20, 2024", isDefault: false },
  ]);
  const [coverLetters, setCoverLetters] = useState([
    { id: "c1", name: "Cover_Default.docx", size: "24 KB", date: "Oct 22, 2024" },
  ]);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const newResume = {
        id: Date.now().toString(),
        name: "New_Upload.pdf",
        size: "1.1 MB",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isDefault: false
      };
      setResumes([newResume, ...resumes]);
    }, 2000);
  };

  const handleCoverUpload = () => {
    setIsUploadingCover(true);
    setTimeout(() => {
      setIsUploadingCover(false);
      const clip = {
        id: `c-${Date.now()}`,
        name: "New_Cover_Letter.pdf",
        size: "180 KB",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      setCoverLetters((prev) => [clip, ...prev]);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-white">Resume Management</h1>
        <p className="text-slate-500 mt-2">
          Upload your <strong className="text-slate-300">base resume</strong> first, then optional{" "}
          <strong className="text-slate-300">cover letters</strong>. When you apply, log which files you used in the{" "}
          <Link href="/dashboard/applications" className="text-blue-400 font-semibold hover:underline">
            Apply log
          </Link>{" "}
          sheet.
        </p>
      </header>

      <div className="mb-10 flex flex-wrap gap-3 text-xs font-bold">
        <span className="px-4 py-2 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">1 · Base resume</span>
        <span className="px-4 py-2 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">2 · Cover letters (optional)</span>
        <span className="px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">3 · Log each apply</span>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="col-span-2 space-y-6">
          <div className="p-12 rounded-[40px] bg-white/5 border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-all flex flex-col items-center justify-center group cursor-pointer relative overflow-hidden" onClick={handleUpload}>
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                {isUploading ? <Loader2 className="h-10 w-10 text-blue-400 animate-spin" /> : <Upload className="h-10 w-10 text-blue-400" />}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isUploading ? "Uploading Resume..." : "Drop your resume here"}
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                Support PDF, DOCX and TXT formats. Max file size 5MB.
              </p>
              <button className="mt-8 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm transition-all border border-white/10">
                Browse Files
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white px-2">Uploaded Resumes</h2>
            <div className="space-y-3">
              {resumes.map(resume => (
                <div key={resume.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-red-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{resume.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        <span>{resume.size}</span>
                        <span>•</span>
                        <span>{resume.date}</span>
                        {resume.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 lowercase tracking-normal font-medium">Default</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </button>
                    <button className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white px-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" /> Cover Letters
            </h2>
            <p className="text-sm text-slate-500 px-2 -mt-1">
              Names you use here can be copied into the Apply log (“Cover letter file” column).
            </p>
            <div
              className="p-8 rounded-[32px] bg-white/[0.03] border border-dashed border-white/15 hover:border-purple-500/40 transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={handleCoverUpload}
            >
              {isUploadingCover ? (
                <Loader2 className="h-10 w-10 text-purple-400 animate-spin mb-3" />
              ) : (
                <Mail className="h-10 w-10 text-purple-400 mb-3" />
              )}
              <p className="text-sm font-bold text-white">{isUploadingCover ? "Uploading…" : "Add cover letter"}</p>
              <p className="text-xs text-slate-500 mt-1">PDF / DOCX demo — wired like resume upload</p>
            </div>
            <div className="space-y-3">
              {coverLetters.map((cl) => (
                <div
                  key={cl.id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-900 border border-purple-500/25 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{cl.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                        {cl.size} · {cl.date}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-blue-500/20 relative overflow-hidden">
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-purple-400/50" />
            <h3 className="text-xl font-bold text-white mb-4">AI Analysis</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500 tracking-widest">
                  <span>ATS Score</span>
                  <span className="text-green-400">85%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your resume has strong keyword overlap for Full Stack Developer roles. Add more measurable System Design impact to strengthen senior-level matches.
              </p>
              <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all">
                Tailor Resume Now
              </button>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Quick Tips</h3>
            <ul className="space-y-4">
              {[
                "Use PDF for standard formatting",
                "Keep resume under 2 pages",
                "Quantify your achievements",
                "Add your GitHub/Portfolio"
              ].map((tip, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
