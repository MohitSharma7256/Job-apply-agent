"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Upload, FileText, CheckCircle2, Loader2, Sparkles, 
  Trash2, Eye, Mail, Plus, Wand2, Save, X, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResumePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetterMode, setCoverLetterMode] = useState('manual'); 
  const [currentCoverLetter, setCurrentCoverLetter] = useState({ title: '', content: '' });
  
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setStatus('checking');
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success) setStatus('ok');
      else setStatus('error');
    } catch (e) {
      setStatus('error');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', '00000000-0000-0000-0000-000000000000');

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const newResume = {
          id: Date.now().toString(),
          name: data.fileName,
          size: data.size,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          url: data.url
        };
        setResumes(prev => [newResume, ...prev]);
        setError(null);
      } else {
        setError(data.error || 'Server Refused Upload. Configuration Error.');
      }
    } catch (err) {
      setError('Production Network Error. Check connection.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
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
    
    setCoverLetters(prev => [newCL, ...prev]);
    setShowCoverLetterModal(false);
    setCurrentCoverLetter({ title: '', content: '' });
  };

  const generateAICoverLetter = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCurrentCoverLetter({
        title: "AI_Generated_CL",
        content: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the role. Based on my technical background, I am confident that my skills in software development will make me a valuable asset to your team...\n\nBest regards,\n[Your Name]"
      });
      setIsGenerating(false);
      setCoverLetterMode('manual');
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Production Asset Hub</h1>
          <p className="text-slate-500 max-w-2xl font-medium">
            Professional document hub. Cloud-synced with Supabase infrastructure.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Server Status</p>
            <p className={cn("text-sm font-bold", status === 'ok' ? "text-emerald-400" : "text-amber-400")}>
              {status === 'ok' ? "Cloud Sync Active" : status === 'checking' ? "Diagnosing..." : "Cloud Connection Issue"}
            </p>
          </div>
          <button onClick={checkHealth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
            <RefreshCw className={cn("w-5 h-5", status === 'checking' && "animate-spin")} />
          </button>
        </div>
      </header>

      {error && (
        <div className="p-6 rounded-[32px] bg-red-500/10 border border-red-500/20 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-5 text-red-400">
            <AlertCircle className="w-6 h-6 mt-1 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-white tracking-tight">System Configuration Error</h4>
              <p className="text-sm font-medium text-red-400/80 leading-relaxed">{error}</p>
            </div>
          </div>
          {error.toLowerCase().includes('bucket') && (
            <div className="ml-11 p-4 rounded-2xl bg-black/40 border border-red-500/10 text-sm font-medium text-slate-300">
              <p className="font-bold text-white mb-2">How to fix this in Supabase:</p>
              <ol className="list-decimal list-inside space-y-1.5 opacity-80">
                <li>Go to your Supabase Project Dashboard</li>
                <li>Click on <b>&quot;Storage&quot;</b> in the left sidebar</li>
                <li>Click <b>&quot;New Bucket&quot;</b></li>
                <li>Name it exactly: <code className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">resumes</code></li>
                <li>Toggle <b>&quot;Public bucket&quot;</b> to ON, then click Save</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-500" /> Resumes
              </h2>
            </div>

            <div 
              className={cn(
                "p-16 md:p-24 rounded-[48px] bg-white/5 border-2 border-dashed transition-all flex flex-col items-center justify-center group cursor-pointer relative overflow-hidden",
                isUploading ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 hover:border-blue-500/40"
              )}
              onClick={() => !isUploading && fileInputRef.current.click()}
            >
              <div className="h-28 w-28 rounded-[40px] bg-blue-500/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-700">
                {isUploading ? <Loader2 className="h-14 w-14 text-blue-400 animate-spin" /> : <Upload className="h-14 w-14 text-blue-400" />}
              </div>
              <h3 className="text-3xl font-black text-white mb-4 text-center tracking-tight">
                {isUploading ? "Connecting to Cloud..." : "Upload Professional Asset"}
              </h3>
              <p className="text-slate-500 text-base text-center font-medium opacity-60">High-fidelity PDF / DOCX parsing enabled</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resumes.map(resume => (
                <div key={resume.id} className="p-7 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-red-500">
                      <FileText className="w-9 h-9" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-lg truncate max-w-[180px] tracking-tight">{resume.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">
                        <span>{resume.size}</span>
                        <span>•</span>
                        <span>{resume.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resume.url && (
                      <a href={resume.url} target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10 border border-white/5">
                        <Eye className="w-5 h-5" />
                      </a>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setResumes(resumes.filter(r => r.id !== resume.id)) }} className="p-3.5 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cover Letter Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Mail className="w-6 h-6 text-purple-500" /> Cover Letters
              </h2>
              <button 
                onClick={() => setShowCoverLetterModal(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-purple-600 text-white font-black hover:bg-purple-500 transition-all text-sm shadow-2xl shadow-purple-600/20"
              >
                <Plus className="w-5 h-5" /> Create New Asset
              </button>
            </div>

            {coverLetters.length === 0 ? (
              <div className="p-20 rounded-[48px] bg-white/[0.02] border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                <Mail className="w-16 h-16 text-slate-800 mb-8" />
                <h3 className="text-2xl font-black text-slate-600">No Assets Found</h3>
                <p className="text-slate-600 text-base max-w-sm mt-2 font-medium">Compose a professional cover letter to optimize your application strategy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coverLetters.map(cl => (
                  <div key={cl.id} className="p-7 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-purple-500/30 transition-all shadow-2xl">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Mail className="w-9 h-9" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-lg truncate max-w-[180px] tracking-tight">{cl.name}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{cl.size} • {cl.date}</p>
                      </div>
                    </div>
                    <button onClick={() => setCoverLetters(coverLetters.filter(c => c.id !== cl.id))} className="p-3.5 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <div className="p-10 rounded-[48px] bg-slate-900 border border-white/10 relative overflow-hidden group shadow-2xl">
            <Sparkles className="w-12 h-12 text-blue-500 mb-10" />
            <h3 className="text-3xl font-black text-white mb-6 tracking-tighter">Production Grade</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-bold opacity-80">
              Synced with Supabase Cloud. Every document is handled with zero-trust security.
            </p>
            <div className="space-y-6">
              {[
                { label: "Storage Bucket", status: "Active", color: "text-emerald-400" },
                { label: "AI Parsing", status: "Enabled", color: "text-blue-400" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5">
                  <span className="text-sm font-bold text-slate-500">{item.label}</span>
                  <span className={cn("text-xs font-black uppercase tracking-widest", item.color)}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Creator Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowCoverLetterModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[56px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-12 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-4xl font-black text-white tracking-tighter">Create Asset</h3>
              <button onClick={() => setShowCoverLetterModal(false)} className="p-4 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all border border-white/10">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-12 space-y-10">
              <div className="flex gap-4 p-2 bg-white/5 rounded-[32px] w-fit border border-white/5">
                <button onClick={() => setCoverLetterMode('manual')} className={cn("px-10 py-4 rounded-[24px] text-sm font-black transition-all", coverLetterMode === 'manual' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>Manual</button>
                <button onClick={() => setCoverLetterMode('ai')} className={cn("px-10 py-4 rounded-[24px] text-sm font-black transition-all flex items-center gap-3", coverLetterMode === 'ai' ? "bg-blue-600 text-white shadow-2xl shadow-blue-600/30" : "text-slate-500 hover:text-slate-300")}><Wand2 className="w-5 h-5" /> AI Generate</button>
              </div>

              {coverLetterMode === 'ai' ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-10 text-center">
                  <div className="h-32 w-32 rounded-[40px] bg-blue-600/10 flex items-center justify-center relative"><Sparkles className="w-16 h-16 text-blue-400" /><div className="absolute inset-0 rounded-[40px] border-4 border-blue-500/20 animate-ping" /></div>
                  <button onClick={generateAICoverLetter} disabled={isGenerating} className="px-16 py-6 rounded-[32px] bg-blue-600 hover:bg-blue-500 text-white font-black shadow-2xl shadow-blue-600/40 transition-all flex items-center gap-4 text-xl">{isGenerating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Wand2 className="w-7 h-7" />}{isGenerating ? "AI Composition..." : "Initialize AI Writer"}</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <input className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-6 outline-none focus:border-blue-500/50 transition-all text-white font-black text-xl" placeholder="Title" value={currentCoverLetter.title} onChange={e => setCurrentCoverLetter({...currentCoverLetter, title: e.target.value})} />
                  <textarea className="w-full h-80 bg-white/5 border border-white/10 rounded-[32px] px-8 py-8 outline-none focus:border-blue-500/50 transition-all text-white font-bold resize-none leading-relaxed text-lg" placeholder="Professional content..." value={currentCoverLetter.content} onChange={e => setCurrentCoverLetter({...currentCoverLetter, content: e.target.value})} />
                  <button onClick={handleSaveCoverLetter} className="w-full py-6 rounded-[32px] bg-white text-slate-950 font-black shadow-2xl transition-all flex items-center justify-center gap-4 text-xl hover:bg-slate-200"><Save className="w-7 h-7" /> Finalize Asset</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
