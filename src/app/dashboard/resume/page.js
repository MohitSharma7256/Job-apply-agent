"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Upload, FileText, CheckCircle2, Loader2, Sparkles, 
  Trash2, Eye, Mail, Plus, Wand2, Save, X 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResumePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetterMode, setCoverLetterMode] = useState('manual'); // 'manual' or 'ai'
  const [currentCoverLetter, setCurrentCoverLetter] = useState({ title: '', content: '' });
  
  // Real data state (starting empty to avoid dummy confusion)
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulating upload - will connect to real API/Supabase in next step
    setTimeout(() => {
      setIsUploading(false);
      const newResume = {
        id: Date.now().toString(),
        name: "My_Resume_" + new Date().getFullYear() + ".pdf",
        size: "1.1 MB",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isDefault: resumes.length === 0
      };
      setResumes([newResume, ...resumes]);
    }, 1500);
  };

  const handleSaveCoverLetter = () => {
    if (!currentCoverLetter.title) return;
    
    const newCL = {
      id: `cl-${Date.now()}`,
      name: currentCoverLetter.title + ".txt",
      size: (currentCoverLetter.content.length / 1024).toFixed(1) + " KB",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      content: currentCoverLetter.content
    };
    
    setCoverLetters([newCL, ...coverLetters]);
    setShowCoverLetterModal(false);
    setCurrentCoverLetter({ title: '', content: '' });
  };

  const generateAICoverLetter = () => {
    setIsGenerating(true);
    // Simulate AI generation based on profile
    setTimeout(() => {
      setCurrentCoverLetter({
        title: "AI_Generated_Cover_Letter",
        content: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the role. With my background in software development and my skills in React, Node.js and AI integration, I am confident that I can add significant value to your team...\n\nBest regards,\n[Your Name]"
      });
      setIsGenerating(false);
      setCoverLetterMode('manual'); // Switch to manual so they can edit
    }, 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Resume & Assets</h1>
        <p className="text-slate-500 max-w-2xl">
          Manage your career documents. AI uses these to tailor your applications and auto-fill details.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Resume Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Resumes
              </h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {resumes.length} Files
              </span>
            </div>

            <div 
              className="p-10 md:p-16 rounded-[32px] bg-white/5 border-2 border-dashed border-white/10 hover:border-blue-500/40 transition-all flex flex-col items-center justify-center group cursor-pointer relative overflow-hidden"
              onClick={handleUpload}
            >
              <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                {isUploading ? <Loader2 className="h-10 w-10 text-blue-400 animate-spin" /> : <Upload className="h-10 w-10 text-blue-400" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{isUploading ? "Uploading..." : "Upload New Resume"}</h3>
              <p className="text-slate-500 text-sm">PDF, DOCX or TXT (Max 5MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map(resume => (
                <div key={resume.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-red-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm truncate max-w-[120px]">{resume.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{resume.size} • {resume.date}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setResumes(resumes.filter(r => r.id !== resume.id)) }} className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Cover Letter Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" /> Cover Letters
              </h2>
              <button 
                onClick={() => setShowCoverLetterModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600/20 transition-all text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Create New
              </button>
            </div>

            {coverLetters.length === 0 ? (
              <div className="p-12 rounded-[32px] bg-white/[0.02] border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                <Mail className="w-10 h-10 text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">No Cover Letters</h3>
                <p className="text-slate-600 text-sm max-w-xs mt-1">Create a custom cover letter or let AI generate one for you.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coverLetters.map(cl => (
                  <div key={cl.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm truncate max-w-[120px]">{cl.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{cl.size} • {cl.date}</p>
                      </div>
                    </div>
                    <button onClick={() => setCoverLetters(coverLetters.filter(c => c.id !== cl.id))} className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <div className="p-8 rounded-[32px] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="w-8 h-8 text-blue-400/50 mb-6" />
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">AI Optimization</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Our AI analyzes your documents against target roles to give you the best chance of passing ATS filters.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resume Parsed
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                <div className="h-4 w-4 rounded-full border border-slate-700" /> Keywords Optimized
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Letter Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCoverLetterModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">New Cover Letter</h3>
                <p className="text-slate-500 text-sm mt-1">Write manually or use AI to generate</p>
              </div>
              <button onClick={() => setShowCoverLetterModal(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex gap-2 p-1 bg-black/40 rounded-2xl w-fit">
                <button 
                  onClick={() => setCoverLetterMode('manual')}
                  className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", coverLetterMode === 'manual' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
                >
                  Manual
                </button>
                <button 
                  onClick={() => setCoverLetterMode('ai')}
                  className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", coverLetterMode === 'ai' ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300")}
                >
                  <Wand2 className="w-4 h-4" /> AI Generate
                </button>
              </div>

              {coverLetterMode === 'ai' ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="h-20 w-20 rounded-full bg-purple-600/10 flex items-center justify-center relative">
                    <Sparkles className="w-10 h-10 text-purple-400" />
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Ready to Generate?</h4>
                    <p className="text-slate-500 text-sm max-w-sm mt-2">AI will use your profile details and skills to write a professional cover letter.</p>
                  </div>
                  <button 
                    onClick={generateAICoverLetter}
                    disabled={isGenerating}
                    className="px-10 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    {isGenerating ? "AI is writing..." : "Generate with AI"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all text-white font-bold"
                    placeholder="Document Title (e.g., Senior_Dev_CL)"
                    value={currentCoverLetter.title}
                    onChange={e => setCurrentCoverLetter({...currentCoverLetter, title: e.target.value})}
                  />
                  <textarea 
                    className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all text-white font-medium resize-none"
                    placeholder="Write your cover letter content here..."
                    value={currentCoverLetter.content}
                    onChange={e => setCurrentCoverLetter({...currentCoverLetter, content: e.target.value})}
                  />
                  <button 
                    onClick={handleSaveCoverLetter}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" /> Save Cover Letter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
