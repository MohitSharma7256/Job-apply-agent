import React, { useState, useEffect } from 'react';
import { 
  User, Briefcase, MapPin, DollarSign, GraduationCap,
  Target, Shield, Settings, Plus, X, Edit2, Save,
  Upload, Download, TrendingUp, Award, Clock,
  CheckCircle, AlertCircle, Info, Star, Zap
} from 'lucide-react';

const EnhancedUserProfile = ({ 
  userId, 
  profileData, 
  onSave, 
  onUploadResume,
  showAdvanced = true 
}) => {
  const [profile, setProfile] = useState(profileData || {});
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'advanced', label: 'Advanced', icon: Target }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(profile);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file) => {
    setUploadProgress(0);
    try {
      await onUploadResume(file, (progress) => setUploadProgress(progress));
    } catch (error) {
      console.error('Failed to upload resume:', error);
    }
  };

  const updateProfile = (section, field, value) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: [...(prev.skills?.technical || []), skill]
      }
    }));
  };

  const removeSkill = (skill, category) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter(s => s !== skill)
      }
    }));
  };

  const addWorkExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
      technologies: []
    };
    
    setProfile(prev => ({
      ...prev,
      experience: [...(prev.experience || []), newExperience]
    }));
  };

  const updateWorkExperience = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeWorkExperience = (id) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Enhanced Profile</h1>
          <p className="text-gray-400">Complete your profile for better job matching</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-400">Profile Completion</span>
          <span className="text-sm font-bold text-blue-400">85%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Complete your profile to get 30% more job matches</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'basic' && (
          <BasicInfoTab 
            profile={profile} 
            editing={editing}
            updateProfile={updateProfile}
            onResumeUpload={handleResumeUpload}
            uploadProgress={uploadProgress}
          />
        )}
        
        {activeTab === 'experience' && (
          <ExperienceTab 
            profile={profile}
            editing={editing}
            updateWorkExperience={updateWorkExperience}
            removeWorkExperience={removeWorkExperience}
            addWorkExperience={addWorkExperience}
          />
        )}
        
        {activeTab === 'preferences' && (
          <PreferencesTab 
            profile={profile}
            editing={editing}
            updateProfile={updateProfile}
            addSkill={addSkill}
            removeSkill={removeSkill}
          />
        )}
        
        {activeTab === 'advanced' && showAdvanced && (
          <AdvancedTab 
            profile={profile}
            editing={editing}
            updateProfile={updateProfile}
          />
        )}
      </div>
    </div>
  );
};

// Basic Info Tab Component
const BasicInfoTab = ({ profile, editing, updateProfile, onResumeUpload, uploadProgress }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <User className="w-5 h-5 mr-2" />
          Personal Information
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
          <input
            type="text"
            value={profile.basicInfo?.name || ''}
            onChange={(e) => updateProfile('basicInfo', 'name', e.target.value)}
            disabled={!editing}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={profile.basicInfo?.email || ''}
            onChange={(e) => updateProfile('basicInfo', 'email', e.target.value)}
            disabled={!editing}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
          <input
            type="tel"
            value={profile.basicInfo?.phone || ''}
            onChange={(e) => updateProfile('basicInfo', 'phone', e.target.value)}
            disabled={!editing}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">LinkedIn</label>
          <input
            type="url"
            value={profile.basicInfo?.linkedin || ''}
            onChange={(e) => updateProfile('basicInfo', 'linkedin', e.target.value)}
            disabled={!editing}
            placeholder="https://linkedin.com/in/yourprofile"
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Location
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
          <input
            type="text"
            value={profile.location?.city || ''}
            onChange={(e) => updateProfile('location', 'city', e.target.value)}
            disabled={!editing}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">State</label>
          <input
            type="text"
            value={profile.location?.state || ''}
            onChange={(e) => updateProfile('location', 'state', e.target.value)}
            disabled={!editing}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Country</label>
          <input
            type="text"
            value={profile.location?.country || ''}
            onChange={(e) => updateProfile('location', 'country', e.target.value)}
            disabled={!editing}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={profile.location?.willingToRelocate || false}
            onChange={(e) => updateProfile('location', 'willingToRelocate', e.target.checked)}
            disabled={!editing}
            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
          />
          <label className="text-sm text-gray-400">Willing to relocate</label>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Upload className="w-5 h-5 mr-2" />
          Resume Upload
        </h3>
        
        <div className="p-6 rounded-xl border-2 border-dashed border-white/20 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Upload your resume for AI-powered analysis</p>
          <p className="text-sm text-gray-500 mb-4">PDF, DOC, DOCX (Max 5MB)</p>
          
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => e.target.files[0] && onResumeUpload(e.target.files[0])}
            disabled={!editing}
            className="hidden"
            id="resume-upload"
          />
          
          <label
            htmlFor="resume-upload"
            className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              editing 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Choose File
          </label>
          
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-1">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Experience Tab Component
const ExperienceTab = ({ profile, editing, updateWorkExperience, removeWorkExperience, addWorkExperience }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Briefcase className="w-5 h-5 mr-2" />
          Work Experience
        </h3>
        
        {editing && (
          <button
            onClick={addWorkExperience}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Experience
          </button>
        )}
      </div>
      
      {profile.experience?.map((exp) => (
        <div key={exp.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Position</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateWorkExperience(exp.id, 'position', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                  disabled={!editing || exp.current}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
                />
              </div>
            </div>
            
            {editing && (
              <button
                onClick={() => removeWorkExperience(exp.id)}
                className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={exp.current || false}
              onChange={(e) => updateWorkExperience(exp.id, 'current', e.target.checked)}
              disabled={!editing}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <label className="text-sm text-gray-400">Currently working here</label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={exp.description}
              onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
              disabled={!editing}
              rows={3}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white resize-none"
            />
          </div>
        </div>
      ))}
      
      {!profile.experience || profile.experience.length === 0 && (
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No work experience added yet</p>
          {editing && (
            <button
              onClick={addWorkExperience}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Your First Experience
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Preferences Tab Component
const PreferencesTab = ({ profile, editing, updateProfile, addSkill, removeSkill }) => {
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Target className="w-5 h-5 mr-2" />
          Job Preferences
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Job Types</label>
            <div className="space-y-2">
              {['full-time', 'part-time', 'contract', 'freelance'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.preferences?.jobTypes?.includes(type) || false}
                    onChange={(e) => {
                      const current = profile.preferences?.jobTypes || [];
                      const updated = e.target.checked 
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      updateProfile('preferences', 'jobTypes', updated);
                    }}
                    disabled={!editing}
                    className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                  />
                  <label className="text-sm text-gray-400 capitalize">{type.replace('-', ' ')}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Work Mode</label>
            <div className="space-y-2">
              {['onsite', 'remote', 'hybrid'].map(mode => (
                <div key={mode} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="workMode"
                    checked={profile.preferences?.workMode === mode}
                    onChange={() => updateProfile('preferences', 'workMode', mode)}
                    disabled={!editing}
                    className="border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                  />
                  <label className="text-sm text-gray-400 capitalize">{mode}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Minimum Salary</label>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={profile.preferences?.minSalary || ''}
                onChange={(e) => updateProfile('preferences', 'minSalary', parseInt(e.target.value))}
                disabled={!editing}
                placeholder="50000"
                className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
              />
              <span className="text-sm text-gray-400">per year</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Industries to Avoid</label>
            <input
              type="text"
              value={profile.preferences?.blacklistedIndustries?.join(', ') || ''}
              onChange={(e) => updateProfile('preferences', 'blacklistedIndustries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              disabled={!editing}
              placeholder="gambling, tobacco, weapons"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Zap className="w-5 h-5 mr-2" />
          Skills
        </h3>
        
        <div className="space-y-4">
          {/* Technical Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Technical Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.skills?.technical?.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center"
                >
                  {skill}
                  {editing && (
                    <button
                      onClick={() => removeSkill(skill, 'technical')}
                      className="ml-2 text-blue-300 hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            
            {editing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add a skill..."
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>
          
          {/* Soft Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Soft Skills</label>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.soft?.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center"
                >
                  {skill}
                  {editing && (
                    <button
                      onClick={() => removeSkill(skill, 'soft')}
                      className="ml-2 text-green-300 hover:text-green-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced Tab Component
const AdvancedTab = ({ profile, editing, updateProfile }) => {
  return (
    <div className="space-y-6">
      {/* Work Authorization */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Shield className="w-5 h-5 mr-2" />
          Work Authorization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={profile.workAuthorization?.citizen || false}
              onChange={(e) => updateProfile('workAuthorization', 'citizen', e.target.checked)}
              disabled={!editing}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <label className="text-sm text-gray-400">US Citizen</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={profile.workAuthorization?.workVisa || false}
              onChange={(e) => updateProfile('workAuthorization', 'workVisa', e.target.checked)}
              disabled={!editing}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <label className="text-sm text-gray-400">Work Visa</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={profile.workAuthorization?.requiresSponsorship || false}
              onChange={(e) => updateProfile('workAuthorization', 'requiresSponsorship', e.target.checked)}
              disabled={!editing}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <label className="text-sm text-gray-400">Requires Sponsorship</label>
          </div>
        </div>
      </div>

      {/* Education */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <GraduationCap className="w-5 h-5 mr-2" />
          Education
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Highest Degree</label>
            <select
              value={profile.education?.highestDegree || ''}
              onChange={(e) => updateProfile('education', 'highestDegree', e.target.value)}
              disabled={!editing}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
            >
              <option value="">Select Degree</option>
              <option value="high-school">High School</option>
              <option value="associate">Associate Degree</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="phd">PhD</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Field of Study</label>
            <input
              type="text"
              value={profile.education?.fieldOfStudy || ''}
              onChange={(e) => updateProfile('education', 'fieldOfStudy', e.target.value)}
              disabled={!editing}
              placeholder="Computer Science"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
            />
          </div>
        </div>
      </div>

      {/* Application Settings */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Settings className="w-5 h-5 mr-2" />
          Application Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Max Applications Per Day</label>
            <input
              type="number"
              value={profile.applicationSettings?.maxApplicationsPerDay || 10}
              onChange={(e) => updateProfile('applicationSettings', 'maxApplicationsPerDay', parseInt(e.target.value))}
              disabled={!editing}
              min="1"
              max="50"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Default Apply Mode</label>
            <select
              value={profile.applicationSettings?.defaultMode || 'REVIEW_REQUIRED'}
              onChange={(e) => updateProfile('applicationSettings', 'defaultMode', e.target.value)}
              disabled={!editing}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 disabled:opacity-50 text-white"
            >
              <option value="DRAFT_ONLY">Draft Only</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="FULL_AUTO">Full Auto (Not Recommended)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserProfile;
