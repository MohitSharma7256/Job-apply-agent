"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { 
  Settings, User, Briefcase, FileText, Key, Bell, Shield, 
  Upload, Plus, Trash2, Save, RefreshCw, Check, AlertCircle
} from 'lucide-react';

const TABS = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'resumes', name: 'Resumes', icon: FileText },
  { id: 'credentials', name: 'Credentials', icon: Key },
  { id: 'autoapply', name: 'Auto-Apply', icon: Briefcase },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    skills: [] as string[],
    experience: 0,
    education: '',
    targetRoles: [] as string[],
    targetLocations: [] as string[],
    targetSalary: 0,
  });

  const [resumes, setResumes] = useState([
    { id: '1', name: 'Software Engineer', isDefault: true, tags: ['technical'] },
    { id: '2', name: 'Product Manager', isDefault: false, tags: ['management'] },
  ]);

  const [credentials, setCredentials] = useState([
    { platform: 'linkedin', email: '', password: '', status: 'not_logged' },
    { platform: 'indeed', email: '', password: '', status: 'not_logged' },
    { platform: 'naukri', email: '', password: '', status: 'not_logged' },
  ]);

  const [autoApply, setAutoApply] = useState({
    enabled: false,
    minScore: 70,
    maxPerDay: 50,
    pauseOnWeekends: true,
    timeStart: '09:00',
    timeEnd: '18:00',
    blacklistCompanies: [] as string[],
    blacklistKeywords: [] as string[],
    whitelistCompanies: [] as string[],
    whitelistKeywords: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveProfile = () => {
    setSaving(true);
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        <div className="flex gap-8">
          <nav className="w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    activeTab === tab.id
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </div>
          </nav>

          <main className="flex-1">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Profile</h2>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                      saved
                        ? "bg-green-500 text-white"
                        : saving
                        ? "bg-blue-500/50 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    )}
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Bangalore, India"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Skills</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {skill}
                        <button onClick={() => setProfile({ ...profile, skills: profile.skills.filter((_, idx) => idx !== i) })}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && newSkill && (setProfile({ ...profile, skills: [...profile.skills, newSkill] }), setNewSkill(''))}
                      placeholder="Add skill (press Enter)"
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                    <button
                      onClick={() => newSkill && (setProfile({ ...profile, skills: [...profile.skills, newSkill] }), setNewSkill(''))}
                      className="px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Target Roles</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.targetRoles.map((role, i) => (
                      <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {role}
                        <button onClick={() => setProfile({ ...profile, targetRoles: profile.targetRoles.filter((_, idx) => idx !== i) })}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={profile.targetRoles[profile.targetRoles.length] || ''}
                    onChange={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        setProfile({ ...profile, targetRoles: [...profile.targetRoles, e.target.value] });
                        e.target.value = '';
                      }
                    }}
                    placeholder="Add target role (press Enter)"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'resumes' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Resume Variants</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">
                    <Upload className="w-4 h-4" />
                    Upload Resume
                  </button>
                </div>

                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                        <div>
                          <p className="font-medium text-white">{resume.name}</p>
                          <p className="text-sm text-slate-500">{resume.tags.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {resume.isDefault && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Default</span>
                        )}
                        <button className="p-2 hover:bg-white/10 rounded-lg">
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                  <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Drop resume PDF here or click to upload</p>
                  <p className="text-xs text-slate-600 mt-2">Max 5MB, PDF only</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'credentials' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Platform Credentials</h2>
                <p className="text-sm text-slate-400">Credentials are encrypted and stored securely</p>

                <div className="space-y-4">
                  {credentials.map((cred) => (
                    <div key={cred.platform} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-white capitalize">{cred.platform}</h3>
                        <span className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded-full text-xs",
                          cred.status === 'logged_in' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {cred.status === 'logged_in' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {cred.status === 'logged_in' ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="email"
                          placeholder="Email"
                          value={cred.email}
                          onChange={(e) => setCredentials(credentials.map(c => c.platform === cred.platform ? { ...c, email: e.target.value } : c))}
                          className="bg-black/20 border border-white/10 rounded-lg px-4 py-2"
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={cred.password}
                          onChange={(e) => setCredentials(credentials.map(c => c.platform === cred.platform ? { ...c, password: e.target.value } : c))}
                          className="bg-black/20 border border-white/10 rounded-lg px-4 py-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium">
                  Save Credentials
                </button>
              </motion.div>
            )}

            {activeTab === 'autoapply' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Auto-Apply Configuration</h2>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-medium text-white">Enable Auto-Apply</p>
                    <p className="text-sm text-slate-400">Automatically apply to matching jobs</p>
                  </div>
                  <button
                    onClick={() => setAutoApply({ ...autoApply, enabled: !autoApply.enabled })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      autoApply.enabled ? "bg-blue-500" : "bg-slate-600"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      autoApply.enabled ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Minimum Match Score</label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={autoApply.minScore}
                      onChange={(e) => setAutoApply({ ...autoApply, minScore: parseInt(e.target.value) })}
                      className="w-full mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-1">Only apply to jobs with {autoApply.minScore}%+ match</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-400">Max Applications Per Day</label>
                    <input
                      type="number"
                      value={autoApply.maxPerDay}
                      onChange={(e) => setAutoApply({ ...autoApply, maxPerDay: parseInt(e.target.value) })}
                      className="w-full mt-2 bg-black/20 border border-white/10 rounded-lg px-4 py-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-medium text-white">Pause on Weekends</p>
                      <p className="text-sm text-slate-400">Don't apply on Sat-Sun</p>
                    </div>
                    <button
                      onClick={() => setAutoApply({ ...autoApply, pauseOnWeekends: !autoApply.pauseOnWeekends })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        autoApply.pauseOnWeekends ? "bg-blue-500" : "bg-slate-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        autoApply.pauseOnWeekends ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Apply Time Start</label>
                    <input
                      type="time"
                      value={autoApply.timeStart}
                      onChange={(e) => setAutoApply({ ...autoApply, timeStart: e.target.value })}
                      className="w-full mt-2 bg-black/20 border border-white/10 rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Apply Time End</label>
                    <input
                      type="time"
                      value={autoApply.timeEnd}
                      onChange={(e) => setAutoApply({ ...autoApply, timeEnd: e.target.value })}
                      className="w-full mt-2 bg-black/20 border border-white/10 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}