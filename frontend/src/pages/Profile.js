import React, { useEffect, useState } from 'react';
import API from '../api';
import { User, Code2, Briefcase, Github, Linkedin, Globe, Plus, Trash2, Save} from 'lucide-react';

const TECH_OPTIONS = [
  "React","Vue","Angular","Next.js","TypeScript","JavaScript",
  "Node.js","Express","Python","Django","FastAPI","Java","Spring Boot",
  "C++","C","Go","Rust","MongoDB","PostgreSQL","MySQL","Redis",
  "Docker","AWS","Firebase","GraphQL","REST APIs"
];

const DSA_LEVELS = ["Beginner","Intermediate","Advanced","Expert"];
const STATUS_OPTIONS = [
  "Undergraduate","Graduate Student","Bootcamp","Self-Taught",
  "Working Professional","Freelancer","Open to Work"
];

const Badge = ({ label, onRemove, color = "bg-accent/10 text-accent border-accent/20" }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${color}`}>
    {label}
    {onRemove && (
      <button onClick={onRemove} className="hover:text-accent2 transition">
        <Trash2 size={10}/>
      </button>
    )}
  </span>
);

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8">
    <h2 className="text-sm font-head font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-white">
      <span className="text-accent">{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [techInput, setTechInput] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);

  // Form state mirrors the user model
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
    });
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
    <div className="p-20 text-center animate-pulse font-mono uppercase text-xs tracking-widest text-accent">
      Loading Profile...
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto font-body text-white">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-head font-black italic uppercase tracking-tighter">My Profile</h1>
          <p className="text-muted text-sm mt-1 font-mono">{user.email}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition
            ${saved ? 'bg-accent3 text-black' : 'bg-accent text-white hover:scale-105 shadow-xl shadow-accent/20'}`}
        >
          <Save size={16}/>
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Profile'}
        </button>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Basic Info ── */}
        <SectionCard icon={<User size={16}/>} title="Basic Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">Display Name</label>
              <input
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g. Harshitha"
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">Current Status</label>
              <select
                value={form.currentStatus}
                onChange={e => setForm(f => ({ ...f, currentStatus: e.target.value }))}
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
              >
                <option value="">Select status...</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">Bio <span className="text-muted/50">(max 300 chars)</span></label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 300) }))}
              placeholder="Tell others about yourself..."
              rows={3}
              className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm resize-none"
            />
            <p className="text-[10px] text-muted/50 text-right mt-1">{form.bio.length}/300</p>
          </div>
        </SectionCard>

        {/* ── Coding Background ── */}
        <SectionCard icon={<Code2 size={16}/>} title="Coding Background">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">DSA Skill Level</label>
              <select
                value={form.dsaLevel}
                onChange={e => setForm(f => ({ ...f, dsaLevel: e.target.value }))}
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
              >
                <option value="">Select level...</option>
                {DSA_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">Experience (years)</label>
              <select
                value={form.codingExperienceYears}
                onChange={e => setForm(f => ({ ...f, codingExperienceYears: Number(e.target.value) }))}
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
              >
                {[0,1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n === 0 ? '< 1 year' : n === 5 ? '5+ years' : `${n} year${n > 1 ? 's' : ''}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">LeetCode Username</label>
              <input
                value={form.leetcodeUsername}
                onChange={e => setForm(f => ({ ...f, leetcodeUsername: e.target.value }))}
                placeholder="e.g. harshitha_52"
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm font-mono"
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3 block">Tech Stack</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.techStack.map(t => (
                <Badge key={t} label={t} onRemove={() => removeTech(t)} />
              ))}
            </div>
            <div className="relative">
              <input
                value={techInput}
                onChange={e => { setTechInput(e.target.value); setShowTechDropdown(true); }}
                onFocus={() => setShowTechDropdown(true)}
                placeholder="Add tech (e.g. React)..."
                className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && techInput.trim()) {
                    addTech(techInput.trim());
                  }
                }}
              />
              {showTechDropdown && filteredTech.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-[#14141a] border border-[#2a2a38] rounded-xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                  {filteredTech.slice(0, 8).map(t => (
                    <button
                      key={t}
                      onMouseDown={() => addTech(t)}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-accent/10 hover:text-accent transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Projects ── */}
        <SectionCard icon={<Briefcase size={16}/>} title="Projects I've Built">
          <div className="flex flex-col gap-4 mb-4">
            {form.projects.map((proj, idx) => (
              <div key={idx} className="bg-[#0c0c0f] border border-[#2a2a38] rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-mono uppercase text-muted tracking-widest">Project #{idx + 1}</span>
                  <button onClick={() => removeProject(idx)} className="text-muted hover:text-accent2 transition">
                    <Trash2 size={14}/>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={proj.name}
                    onChange={e => updateProject(idx, 'name', e.target.value)}
                    placeholder="Project name"
                    className="bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
                  />
                  <input
                    value={proj.link}
                    onChange={e => updateProject(idx, 'link', e.target.value)}
                    placeholder="GitHub / Live URL"
                    className="bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm font-mono"
                  />
                </div>
                <textarea
                  value={proj.description}
                  onChange={e => updateProject(idx, 'description', e.target.value)}
                  placeholder="What does this project do?"
                  rows={2}
                  className="w-full mt-3 bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm resize-none"
                />
                <input
                  value={(proj.techUsed || []).join(', ')}
                  onChange={e => updateProject(idx, 'techUsed', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Tech used (comma-separated): React, Node.js"
                  className="w-full mt-3 bg-[#14141a] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addProject}
            className="flex items-center gap-2 border border-dashed border-[#2a2a38] hover:border-accent text-muted hover:text-accent px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition w-full justify-center"
          >
            <Plus size={14}/> Add Project
          </button>
        </SectionCard>

        {/* ── Links ── */}
        <SectionCard icon={<Globe size={16}/>} title="Links & Socials">
          <div className="flex flex-col gap-4">
            {[
              { field: 'githubUrl', icon: <Github size={16}/>, label: 'GitHub URL', placeholder: 'https://github.com/username' },
              { field: 'linkedinUrl', icon: <Linkedin size={16}/>, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
              { field: 'portfolioUrl', icon: <Globe size={16}/>, label: 'Portfolio URL', placeholder: 'https://yoursite.com' },
            ].map(({ field, icon, label, placeholder }) => (
              <div key={field} className="flex items-center gap-3">
                <span className="text-muted shrink-0">{icon}</span>
                <div className="flex-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1 block">{label}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Stats summary (read-only) */}
        <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8">
          <h2 className="text-sm font-head font-black uppercase tracking-widest mb-6 text-muted">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Focus Coins', value: `🪙 ${user.focusCoins}` },
              { label: 'Streak', value: `🔥 ${user.streak} days` },
              { label: 'Duel Wins', value: `⚔️ ${user.duelWins}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0c0c0f] rounded-2xl p-4 text-center">
                <div className="text-lg font-black text-white">{value}</div>
                <div className="text-[10px] font-mono text-muted uppercase mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
