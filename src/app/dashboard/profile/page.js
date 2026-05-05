"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Briefcase, MapPin, Save, Loader2, Target, Plus, X, Zap } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    currentRole: "",
    experience: "",
    targetRoles: [],
    skills: [],
    bio: ""
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (!response.ok) {
          console.error('[ProfilePage] API error:', data.error);
          return;
        }
        
        if (data.success && data.profile) {
          setProfile(prev => ({
            ...prev,
            ...data.profile
          }));
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile })
      });
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addTargetRole = () => {
    const role = prompt("Enter target role:");
    if (role) {
      setProfile(prev => ({
        ...prev,
        targetRoles: [...prev.targetRoles, role]
      }));
    }
  };

  const removeTargetRole = (role) => {
    setProfile(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.filter(r => r !== role)
    }));
  };

  const addSkill = () => {
    const skill = prompt("Enter skill:");
    if (skill) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-white">Your Profile</h1>
        <p className="text-slate-500 mt-2 text-sm">Manage your professional identity for AI tailoring.</p>
      </header>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <User className="w-5 h-5 text-blue-400" /> Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500/50 transition-all text-white"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500/50 transition-all text-white"
                    value={profile.email}
                    onChange={e => setProfile({...profile, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500/50 transition-all text-white"
                    value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500/50 transition-all text-white"
                    value={profile.location}
                    onChange={e => setProfile({...profile, location: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-purple-400" /> Professional Experience
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Current Role</label>
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-purple-500/50 transition-all text-white"
                    value={profile.currentRole}
                    onChange={e => setProfile({...profile, currentRole: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Total Experience</label>
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-purple-500/50 transition-all text-white"
                    value={profile.experience}
                    onChange={e => setProfile({...profile, experience: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Professional Bio</label>
                <textarea 
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-purple-500/50 transition-all text-white resize-none"
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Targets */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Target className="w-5 h-5 text-orange-400" /> Target Roles
            </h2>
            <div className="space-y-3">
              {profile.targetRoles.map((role, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                  <span className="text-sm font-medium text-slate-300">{role}</span>
                  <button 
                    onClick={() => removeTargetRole(role)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-md text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={addTargetRole}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-500 hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-2 text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Add Role
              </button>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" /> Key Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-2">
                  {skill}
                  <button 
                    onClick={() => removeSkill(skill)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button 
                onClick={addSkill}
                className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-slate-500 hover:border-yellow-500/50 hover:text-yellow-400 transition-all text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-white shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {loading ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
