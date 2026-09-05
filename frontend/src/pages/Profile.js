import React, { useEffect, useState } from 'react';
import API from '../api';
import { User, Code2, Briefcase, Github, Linkedin, Globe, Plus, Trash2, Save, Sparkles, CheckCircle2, Award, Flame, Coins, Swords } from 'lucide-react';

const TECH_OPTIONS = [
  "React", "Vue", "Angular", "Next.js", "TypeScript", "JavaScript",
  "Node.js", "Express", "Python", "Django", "FastAPI", "Java", "Spring Boot",
  "C++", "C", "Go", "Rust", "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "Docker", "AWS", "Firebase", "GraphQL", "REST APIs"
];

const DSA_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const STATUS_OPTIONS = [
  "Undergraduate", "Graduate Student", "Bootcamp", "Self-Taught",
  "Working Professional", "Freelancer", "Open to Work"
];

const Badge = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent border border-accent/20 transition-all hover:bg-accent/20">
    {label}
    {onRemove && (
      <button 
        type="button" 
        onClick={onRemove} 
        className="text-accent/60 hover:text-accent2 transition p-0.5 rounded-full hover:bg-white/10"
        title="Remove"
      >
        <Trash2 size={11} />
      </button>
    )}
  </span>
);

const SectionCard = ({ icon, title, description, children }) => (
  <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-200 hover:border-[#3a3a4c]">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2a38]/60">
      <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [techInput, setTechInput] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    leetcodeUsername: '',
    currentStatus: '',
    dsaLevel: '',
    codingExperienceYears: 0,
    bio: '',
    techStack: [],
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    projects: [],
  });

  useEffect(() => {
    API.get('/auth/me').then(res => {
      const u = res.data;
      setUser(u);
      setForm({
        displayName: u.displayName || '',
        leetcodeUsername: u.leetcodeUsername || '',
        currentStatus: u.currentStatus || '',
        dsaLevel: u.dsaLevel || '',
        codingExperienceYears: u.codingExperienceYears || 0,
        bio: u.bio || '',
        techStack: u.techStack || [],
        githubUrl: u.githubUrl || '',
        linkedinUrl: u.linkedinUrl || '',
        portfolioUrl: u.portfolioUrl || '',
        projects: u.projects || [],
      });
    }).catch(err => console.error("Profile load error:", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/auth/update-profile', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addTech = (tech) => {
    if (!form.techStack.includes(tech)) {
      setForm(f => ({ ...f, techStack: [...f.techStack, tech] }));
    }
    setTechInput('');
    setShowTechDropdown(false);
  };

  const removeTech = (tech) => {
    setForm(f => ({ ...f, techStack: f.techStack.filter(t => t !== tech) }));
  };

  const addProject = () => {
    setForm(f => ({
      ...f,
      projects: [...f.projects, { name: '', description: '', link: '', techUsed: [] }]
    }));
  };

  const updateProject = (idx, field, value) => {
    setForm(f => {
      const projects = [...f.projects];
      projects[idx] = { ...projects[idx], [field]: value };
      return { ...f, projects };
    });
  };

  const removeProject = (idx) => {
    setForm(f => ({ ...f, projects: f.projects.filter((_, i) => i !== idx) }));
  };

  const filteredTech = TECH_OPTIONS.filter(t =>
    t.toLowerCase().includes(techInput.toLowerCase()) && !form.techStack.includes(t)
  );

  if (!user) return (
    <div className="p-20 text-center animate-pulse text-sm font-medium text-accent flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <span>Loading your profile...</span>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto text-gray-100 font-sans">

      {/* Header Banner */}
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent to-purple-400 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-accent/25">
            {(form.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {form.displayName || "My Profile"}
              <Sparkles className="text-accent4" size={20} />
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg ${
            saved
              ? 'bg-accent3 text-black font-extrabold shadow-accent3/20'
              : 'bg-accent text-white hover:bg-accent/90 hover:scale-[1.02] shadow-accent/20 active:scale-95'
          } disabled:opacity-50`}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save Changes'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-5 flex items-center gap-4 hover:border-accent4/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-accent4/10 border border-accent4/20 flex items-center justify-center text-accent4">
            <Coins size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{user.focusCoins || 0}</div>
            <div className="text-xs text-gray-400 font-medium">Focus Coins</div>
          </div>
        </div>

        <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-5 flex items-center gap-4 hover:border-accent2/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-accent2/10 border border-accent2/20 flex items-center justify-center text-accent2">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{user.streak || 0} Days</div>
            <div className="text-xs text-gray-400 font-medium">Active Streak</div>
          </div>
        </div>

        <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-5 flex items-center gap-4 hover:border-accent3/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-accent3/10 border border-accent3/20 flex items-center justify-center text-accent3">
            <Swords size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{user.duelWins || 0} Wins</div>
            <div className="text-xs text-gray-400 font-medium">Duel Victories</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">

        {/* ── Basic Info ── */}
        <SectionCard 
          icon={<User size={18} />} 
          title="Personal Information" 
          description="Your public display name, role, and bio for pods."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-2 block">Display Name</label>
              <input
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g. Alex Chen"
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-2 block">Current Status</label>
              <select
                value={form.currentStatus}
                onChange={e => setForm(f => ({ ...f, currentStatus: e.target.value }))}
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
              >
                <option value="">Select your status...</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-300 block">About Me</label>
              <span className="text-xs text-gray-500">{form.bio.length}/300</span>
            </div>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 300) }))}
              placeholder="Tell other developers what you're interested in building..."
              rows={3}
              className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none placeholder-gray-600"
            />
          </div>
        </SectionCard>

        {/* ── Coding Background ── */}
        <SectionCard 
          icon={<Code2 size={18} />} 
          title="Technical Background" 
          description="Your DSA proficiency, linked LeetCode handle, and primary skills."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-2 block">DSA Skill Level</label>
              <select
                value={form.dsaLevel}
                onChange={e => setForm(f => ({ ...f, dsaLevel: e.target.value }))}
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
              >
                <option value="">Select level...</option>
                {DSA_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-2 block">Coding Experience</label>
              <select
                value={form.codingExperienceYears}
                onChange={e => setForm(f => ({ ...f, codingExperienceYears: Number(e.target.value) }))}
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
              >
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n === 0 ? '< 1 year' : n === 5 ? '5+ years' : `${n} year${n > 1 ? 's' : ''}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-2 block">
                LeetCode Handle <span className="text-accent text-[10px] font-bold uppercase">(For Verification)</span>
              </label>
              <input
                value={form.leetcodeUsername}
                onChange={e => setForm(f => ({ ...f, leetcodeUsername: e.target.value }))}
                placeholder="e.g. neetcode"
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="text-xs font-semibold text-gray-300 mb-2.5 block">Tech Stack & Tools</label>
            {form.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.techStack.map(t => (
                  <Badge key={t} label={t} onRemove={() => removeTech(t)} />
                ))}
              </div>
            )}
            <div className="relative">
              <input
                value={techInput}
                onChange={e => { setTechInput(e.target.value); setShowTechDropdown(true); }}
                onFocus={() => setShowTechDropdown(true)}
                placeholder="Search or add custom technology (e.g. Next.js, Docker, Go)..."
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
                onKeyDown={e => {
                  if (e.key === 'Enter' && techInput.trim()) {
                    e.preventDefault();
                    addTech(techInput.trim());
                  }
                }}
              />
              {showTechDropdown && filteredTech.length > 0 && (
                <div className="absolute top-full mt-1.5 w-full bg-[#181824] border border-[#2a2a38] rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-[#2a2a38]/40">
                  {filteredTech.slice(0, 8).map(t => (
                    <button
                      type="button"
                      key={t}
                      onMouseDown={() => addTech(t)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-accent/15 hover:text-accent transition flex items-center justify-between"
                    >
                      <span>{t}</span>
                      <Plus size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Projects ── */}
        <SectionCard 
          icon={<Briefcase size={18} />} 
          title="Featured Projects" 
          description="Highlight projects you have built to showcase to Study Pod creators."
        >
          <div className="flex flex-col gap-4 mb-4">
            {form.projects.length === 0 && (
              <div className="text-center py-8 border border-dashed border-[#2a2a38] rounded-2xl text-gray-500 text-sm">
                No projects added yet. Click below to add your first project!
              </div>
            )}
            {form.projects.map((proj, idx) => (
              <div key={idx} className="bg-[#0c0c0f] border border-[#2a2a38] rounded-2xl p-5 sm:p-6 transition-all hover:border-[#3a3a4c]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#2a2a38]/50">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} /> Project #{idx + 1}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => removeProject(idx)} 
                    className="text-gray-500 hover:text-accent2 transition p-1 rounded-lg hover:bg-white/5"
                    title="Delete Project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Project Name</label>
                    <input
                      value={proj.name}
                      onChange={e => updateProject(idx, 'name', e.target.value)}
                      placeholder="e.g. Distributed Task Queue"
                      className="w-full bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Project URL (GitHub / Demo)</label>
                    <input
                      value={proj.link}
                      onChange={e => updateProject(idx, 'link', e.target.value)}
                      placeholder="https://github.com/username/project"
                      className="w-full bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs text-gray-400 mb-1.5 block">Brief Description</label>
                  <textarea
                    value={proj.description}
                    onChange={e => updateProject(idx, 'description', e.target.value)}
                    placeholder="What problem does this project solve? What did you build?"
                    rows={2}
                    className="w-full bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none placeholder-gray-600"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-xs text-gray-400 mb-1.5 block">Tech Stack (comma-separated)</label>
                  <input
                    value={(proj.techUsed || []).join(', ')}
                    onChange={e => updateProject(idx, 'techUsed', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="React, Express, Redis, Docker"
                    className="w-full bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addProject}
            className="flex items-center gap-2 border border-dashed border-[#2a2a38] hover:border-accent text-gray-400 hover:text-accent px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all w-full justify-center hover:bg-accent/5"
          >
            <Plus size={15} /> Add Another Project
          </button>
        </SectionCard>

        {/* ── Links & Socials ── */}
        <SectionCard 
          icon={<Globe size={18} />} 
          title="Socials & Portfolio" 
          description="Connect your GitHub, LinkedIn, and personal portfolio links."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { field: 'githubUrl', icon: <Github size={16} />, label: 'GitHub Profile', placeholder: 'https://github.com/username' },
              { field: 'linkedinUrl', icon: <Linkedin size={16} />, label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/username' },
              { field: 'portfolioUrl', icon: <Globe size={16} />, label: 'Personal Website', placeholder: 'https://alexchen.dev' },
            ].map(({ field, icon, label, placeholder }) => (
              <div key={field}>
                <label className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <span className="text-accent">{icon}</span>
                  {label}
                </label>
                <input
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-600"
                />
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
};

export default Profile;
