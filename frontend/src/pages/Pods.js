import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, Users, LogOut, MessageSquare, UserPlus, Clock, AlertTriangle, XCircle, Search, X } from 'lucide-react';
import API from '../api';

const toStr = (id) => (id?._id || id)?.toString();

const TECH_OPTIONS = ["React","Node.js","Python","MongoDB","TypeScript","Next.js","Express","PostgreSQL","Vue","Django","Flutter","Swift","Kotlin","GraphQL","Redis","AWS","Docker","Rust","Go","Java"];
const TAG_OPTIONS = ["Beginner Friendly","Open Source","Hackathon","MVP","Level Up","Full Stack","Mobile","Backend","Frontend","AI/ML","Game Dev","Web3"];

const TECH_COLORS = {
  "React":"bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Node.js":"bg-green-500/10 text-green-400 border-green-500/20",
  "Python":"bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "MongoDB":"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "TypeScript":"bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Next.js":"bg-white/10 text-white border-white/20",
  "PostgreSQL":"bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Docker":"bg-blue-400/10 text-blue-300 border-blue-400/20",
};
const techColor = (t) => TECH_COLORS[t] || "bg-accent/10 text-accent border-accent/20";

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ requester, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-head font-black uppercase mb-1 text-white">Reject Request</h2>
        <p className="text-muted text-xs font-mono mb-6">From: <span className="text-accent">{requester?.split('@')[0]}</span></p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Give a reason (will be shown to the applicant)..."
          rows={3} className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent2 resize-none mb-4 text-sm" />
        <div className="flex gap-3">
          <button onClick={() => onConfirm(reason)} className="flex-1 py-3 bg-accent2 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition">Reject</button>
          <button onClick={onCancel} className="flex-1 py-3 border border-[#2a2a38] text-muted rounded-xl font-black uppercase text-xs hover:text-white transition">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Close Pod Modal ──────────────────────────────────────────────────────────
const ClosePodModal = ({ pod, onClose, onClosed }) => {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-head font-black uppercase mb-1 text-white">🏆 Close Pod</h2>
        <p className="text-muted text-xs font-mono mb-6">This pod will be added to the <span className="text-accent">Pods Hall of Fame</span> and removed from the lobby.</p>
        <input value={link} onChange={e => setLink(e.target.value)}
          placeholder="Project link (GitHub / Live URL) — optional"
          className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent mb-4 text-sm" />
        <div className="flex gap-3">
          <button disabled={loading} onClick={async () => {
            setLoading(true);
            try { await API.post(`/pods/${pod._id}/close`, { projectLink: link }); onClosed(); onClose(); }
            catch (e) { alert(e.response?.data?.message || "Failed to close pod."); }
            finally { setLoading(false); }
          }} className="flex-1 py-3 bg-accent text-white rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition disabled:opacity-60">
            {loading ? "Closing..." : "Close & Add to Hall of Fame"}
          </button>
          <button onClick={onClose} className="px-5 py-3 border border-[#2a2a38] text-muted rounded-xl font-black uppercase text-xs hover:text-white transition">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Create Pod Modal ─────────────────────────────────────────────────────────
const CreatePodModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ title: "", idea: "", techStack: [], maxMembers: 4, tags: [] });
  const [loading, setLoading] = useState(false);
  const [techInput, setTechInput] = useState("");

  const toggleTech = (t) => setForm(f => ({ ...f, techStack: f.techStack.includes(t) ? f.techStack.filter(x => x !== t) : [...f.techStack, t] }));
  const toggleTag = (t) => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }));

  const addCustomTech = () => {
    const t = techInput.trim();
    if (t && !form.techStack.includes(t)) setForm(f => ({ ...f, techStack: [...f.techStack, t] }));
    setTechInput("");
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.idea.trim()) return alert("Title and idea are required.");
    setLoading(true);
    try { const { data } = await API.post("/pods", form); onCreate(data); onClose(); }
    catch (e) { alert(e.response?.data?.message || "Failed to create pod."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8 w-full max-w-lg shadow-2xl my-4">
        <h2 className="text-xl font-head font-black uppercase mb-6 text-white italic">Launch New Pod</h2>
        <div className="space-y-5">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
            placeholder="Project Title *" className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent" />
          <textarea value={form.idea} onChange={e => setForm(f => ({...f, idea: e.target.value}))}
            placeholder="What are you building? *" rows={3}
            className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent resize-none" />

          {/* Tech Stack */}
          <div>
            <p className="text-muted text-[10px] font-mono uppercase mb-2 font-bold">Tech Stack</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {TECH_OPTIONS.map(t => (
                <button key={t} type="button" onClick={() => toggleTech(t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${form.techStack.includes(t) ? techColor(t) : 'border-[#2a2a38] text-muted hover:border-accent/30 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
            {/* Custom tech input */}
            <div className="flex gap-2 mt-2">
              <input value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTech())}
                placeholder="Add custom tech... (press Enter)" 
                className="flex-1 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-accent" />
              <button type="button" onClick={addCustomTech} className="px-3 py-2 bg-accent/20 text-accent rounded-xl text-xs font-bold border border-accent/30 hover:bg-accent hover:text-white transition">Add</button>
            </div>
            {/* Selected custom techs */}
            {form.techStack.filter(t => !TECH_OPTIONS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.techStack.filter(t => !TECH_OPTIONS.includes(t)).map(t => (
                  <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border border-accent/30 bg-accent/10 text-accent">
                    {t}
                    <button type="button" onClick={() => toggleTech(t)}><X size={10}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <p className="text-muted text-[10px] font-mono uppercase mb-2 font-bold">Project Tags</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(t => (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${form.tags.includes(t) ? 'border-accent4/40 bg-accent4/10 text-accent4' : 'border-[#2a2a38] text-muted hover:border-accent/30 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Max members */}
          <div>
            <p className="text-muted text-[10px] font-mono uppercase mb-2 font-bold">Max Members</p>
            <input type="number" min={2} max={20} value={form.maxMembers}
              onChange={e => setForm(f => ({...f, maxMembers: Math.max(2, Math.min(20, Number(e.target.value)))}))}
              className="w-28 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2 text-white outline-none focus:border-accent text-sm" />
            <span className="text-muted text-xs ml-2">members (2–20)</span>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 bg-accent text-white rounded-xl font-black uppercase tracking-widest transition disabled:opacity-60">
            {loading ? "Launching..." : "CREATE POD"}
          </button>
          <button onClick={onClose} className="w-full text-muted text-xs font-bold uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Join Modal ───────────────────────────────────────────────────────────────
const JoinModal = ({ pod, onClose, onRequested }) => {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    setLoading(true);
    try { await API.post(`/pods/${pod._id}/request`, { message: msg }); onRequested(); onClose(); }
    catch (e) { alert(e.response?.data?.message || "Request failed."); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-head font-black uppercase mb-2 text-white">Join Request</h2>
        <p className="text-accent text-xs font-mono mb-1 uppercase tracking-widest">{pod.title}</p>
        <p className="text-muted text-xs mb-6">The creator will see your profile before deciding.</p>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Introduce yourself briefly..." rows={3}
          className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent resize-none mb-4" />
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 bg-accent text-white rounded-xl font-black uppercase transition disabled:opacity-60">
          {loading ? "Sending..." : "SEND REQUEST"}
        </button>
        <button onClick={onClose} className="w-full text-muted text-xs font-bold mt-4 uppercase">CANCEL</button>
      </div>
    </div>
  );
};

// ─── Pod Card ─────────────────────────────────────────────────────────────────
const PodCard = ({ pod, myId, onJoin, onEnter, onDismissRejection }) => {
  const isMember = pod.members?.some(m => toStr(m) === toStr(myId));
  const isCreator = toStr(pod.creator) === toStr(myId);
  const isPending = !isMember && !isCreator && pod.pendingRequests?.some(r => toStr(r.user) === toStr(myId));
  const rejection = pod.rejectedUsers?.find(r => toStr(r.user) === toStr(myId));
  const hostName = (pod.creatorEmail || pod.creator?.email || "User").split("@")[0];
  const pendingCount = isCreator ? pod.pendingRequests?.length || 0 : 0;

  return (
    <div className={`bg-[#14141a] border rounded-[2rem] p-6 flex flex-col gap-4 transition-all group relative
      ${isMember || isCreator ? "border-accent/40 bg-accent/5 ring-1 ring-accent/10" : "border-[#2a2a38] hover:border-accent/30"}
      ${rejection ? "border-accent2/30 bg-accent2/5" : ""}`}>

      {/* Pending requests badge */}
      {pendingCount > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent2 rounded-full flex items-center justify-center z-10">
          <span className="text-white text-[10px] font-black">{pendingCount}</span>
        </div>
      )}

      {/* Rejection banner */}
      {rejection && (
        <div className="bg-accent2/10 border border-accent2/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={14} className="text-accent2 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-accent2 font-black text-[10px] uppercase">Request Rejected</p>
            <p className="text-muted text-[10px] font-mono mt-0.5 leading-relaxed">"{rejection.reason || "Not a fit right now."}"</p>
          </div>
          <button onClick={() => onDismissRejection(pod._id)} className="text-muted hover:text-white transition shrink-0"><XCircle size={12}/></button>
        </div>
      )}

      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-mono px-3 py-1 rounded-full border font-bold tracking-widest uppercase
          ${pod.status === 'FULL' ? 'border-accent2/20 bg-accent2/5 text-accent2' : 'border-accent3/20 bg-accent3/5 text-accent3'}`}>
          ● {pod.status}
        </span>
        <div className="flex items-center gap-1 text-muted text-[10px] font-mono">
          <Users size={12}/> {pod.members?.length || 1}/{pod.maxMembers}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-head font-black uppercase tracking-tight text-white mb-0.5 group-hover:text-accent transition-colors">{pod.title}</h3>
        <p className="text-muted text-[10px] font-mono uppercase tracking-widest italic">By {hostName} {isCreator && "(YOU)"}</p>
      </div>

      {/* Tech stack */}
      {pod.techStack?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pod.techStack.slice(0, 4).map(t => (
            <span key={t} className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${techColor(t)}`}>{t}</span>
          ))}
          {pod.techStack.length > 4 && <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#2a2a38] text-muted font-bold">+{pod.techStack.length - 4}</span>}
        </div>
      )}

      {/* Tags */}
      {pod.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pod.tags.map(t => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded-full border border-accent4/20 bg-accent4/5 text-accent4 font-bold">{t}</span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 italic">"{pod.idea}"</p>

      <button
        onClick={() => (isMember || isCreator) ? onEnter(pod._id) : (!isPending && !rejection && pod.status === 'OPEN') ? onJoin(pod) : null}
        disabled={isPending || !!rejection || (pod.status === 'FULL' && !isMember && !isCreator)}
        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-auto
          ${(isMember || isCreator) ? "bg-accent text-white shadow-lg shadow-accent/20"
          : isPending ? "bg-[#1c1c26] text-muted cursor-wait border border-[#2a2a38]"
          : rejection ? "bg-accent2/10 text-accent2 border border-accent2/30 cursor-not-allowed"
          : pod.status === 'FULL' ? "bg-[#1c1c26] text-muted border border-[#2a2a38] cursor-not-allowed"
          : "border-2 border-accent text-accent hover:bg-accent hover:text-white"}`}>
        {(isMember || isCreator) ? <><MessageSquare size={14}/> OPEN CHAT</>
          : isPending ? <><Clock size={14}/> REQUEST PENDING</>
          : rejection ? <><XCircle size={14}/> REQUEST REJECTED</>
          : pod.status === 'FULL' ? <><Users size={14}/> POD FULL</>
          : <><UserPlus size={14}/> REQUEST TO JOIN</>}
      </button>
    </div>
  );
};

// ─── Pod Room ─────────────────────────────────────────────────────────────────
const PodRoom = ({ podId, myId, onBack }) => {
  const [pod, setPod] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState("chat");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [showClose, setShowClose] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [pRes, mRes] = await Promise.all([API.get(`/pods/${podId}`), API.get(`/pods/${podId}/messages`)]);
      setPod(pRes.data); setMessages(mRes.data);
    } catch (e) { console.error(e); }
  }, [podId]);

  useEffect(() => { fetchStatus(); const i = setInterval(fetchStatus, 3000); return () => clearInterval(i); }, [fetchStatus]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try { await API.post(`/pods/${podId}/message`, { content: input.trim() }); setInput(""); fetchStatus(); }
    catch (e) { console.error(e); }
  };
  const handleAccept = async (userObj) => {
    try { await API.post(`/pods/${podId}/accept`, { requestUserId: toStr(userObj) }); fetchStatus(); }
    catch { alert("Accept failed"); }
  };
  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    try { await API.post(`/pods/${podId}/reject`, { requestUserId: toStr(rejectTarget.user), reason }); setRejectTarget(null); fetchStatus(); }
    catch { alert("Reject failed"); }
  };
  const handleLeave = async () => {
    const isCreator = toStr(pod?.creator) === toStr(myId);
    if (isCreator) { setShowClose(true); return; }
    if (!window.confirm("Are you sure you want to leave this pod?")) return;
    try { await API.post(`/pods/${podId}/leave`); onBack(); }
    catch (e) { alert(e.response?.data?.message || "Failed."); }
  };

  if (!pod) return <div className="p-20 text-center font-mono animate-pulse uppercase text-xs tracking-widest text-accent">Syncing Pod Data...</div>;
  const isCreator = toStr(pod.creator) === toStr(myId);
  const pendingCount = pod.pendingRequests?.length || 0;

  return (
    <>
      {rejectTarget && <RejectModal requester={rejectTarget.email} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />}
      {showClose && <ClosePodModal pod={pod} onClose={() => setShowClose(false)} onClosed={onBack} />}

      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#2a2a38]">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-muted hover:text-white transition uppercase font-mono text-[10px]">← Back</button>
            <div className="h-6 w-px bg-[#2a2a38]"/>
            <div>
              <h2 className="text-xl font-head font-black uppercase italic tracking-tighter text-white">{pod.title}</h2>
              <p className="text-accent3 text-[10px] font-mono font-bold uppercase tracking-widest">● {pod.members?.length} Members Active</p>
            </div>
          </div>
          <button onClick={handleLeave}
            className="group flex items-center gap-2 px-5 py-2 rounded-xl border border-accent2/30 text-accent2 text-[10px] font-black uppercase hover:bg-accent2 hover:text-white transition-all">
            <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" />
            {isCreator ? "Close Pod" : "Leave"}
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {["chat", "members", ...(isCreator ? ["requests"] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition
                ${tab === t ? "bg-accent text-white" : "text-muted hover:text-white"}`}>
              {t}
              {t === 'requests' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent2 rounded-full text-[8px] font-black text-white flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#14141a] border border-[#2a2a38] rounded-3xl overflow-hidden flex flex-col p-6 shadow-2xl">
          {tab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                {messages.length === 0 && <div className="text-center text-muted font-mono text-xs uppercase tracking-widest py-10">No messages yet — say hi! 👋</div>}
                {messages.map((m, i) => {
                  const isMe = toStr(m.sender) === toStr(myId);
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${isMe ? "bg-accent text-white rounded-br-none" : "bg-[#1c1c26] border border-[#2a2a38] text-gray-300 rounded-bl-none"}`}>
                        {!isMe && <div className="text-[9px] font-black uppercase text-accent mb-1">{(m.senderEmail || "").split('@')[0]}</div>}
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 bg-[#0c0c0f] p-2 rounded-2xl border border-[#2a2a38]">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Message pod members..." className="flex-1 bg-transparent px-4 py-2 text-white outline-none text-sm" />
                <button onClick={handleSend} className="bg-accent p-3 rounded-xl hover:scale-105 transition"><Send size={18}/></button>
              </div>
            </>
          )}

          {tab === "members" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pod.members?.map(m => (
                <div key={toStr(m)} className="p-4 bg-[#0c0c0f] border border-[#2a2a38] rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center font-black text-accent">{(m.email || "?")[0].toUpperCase()}</div>
                  <div>
                    <div className="font-bold text-white text-sm">{m.email?.split('@')[0] || "User"}</div>
                    <div className="text-[9px] text-muted font-mono uppercase">{toStr(m) === toStr(pod.creator) ? "Creator" : "Developer"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "requests" && isCreator && (
            <div className="space-y-4 overflow-y-auto">
              {pendingCount === 0 && <div className="text-center text-muted font-mono text-xs uppercase tracking-widest py-10">No pending requests</div>}
              {pod.pendingRequests?.map(r => (
                <div key={toStr(r.user)} className="p-6 bg-[#0c0c0f] border border-[#2a2a38] rounded-3xl flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <div className="font-black text-white">{r.email?.split('@')[0]}</div>
                    <p className="text-muted text-xs italic mt-1">"{r.message || 'No intro message'}"</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleAccept(r.user)} className="bg-accent3 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition">Accept</button>
                    <button onClick={() => setRejectTarget({ user: r.user, email: r.email })} className="bg-accent2 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Main Pods Page ───────────────────────────────────────────────────────────
const Pods = () => {
  const [pods, setPods] = useState([]);
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [activePodId, setActivePodId] = useState(null);
  const [searchTech, setSearchTech] = useState("");
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchPods = useCallback(async () => {
    try {
      const [podsRes, userRes] = await Promise.all([API.get("/pods"), API.get("/auth/me")]);
      setPods(podsRes.data); setMyId(userRes.data._id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPods(); const i = setInterval(fetchPods, 4000); return () => clearInterval(i); }, [fetchPods]);

  const handleDismissRejection = async (podId) => {
    try { await API.post(`/pods/${podId}/dismiss-rejection`); fetchPods(); } catch (e) { console.error(e); }
  };

  const toggleTechFilter = (t) => setSelectedTechs(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleTagFilter = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const clearFilters = () => { setSelectedTechs([]); setSelectedTags([]); setSearchTech(""); };
  const hasFilters = selectedTechs.length > 0 || selectedTags.length > 0 || searchTech.trim();

  // Filter pods
  const filterPod = (pod) => {
    const q = searchTech.trim().toLowerCase();
    if (q && !pod.title?.toLowerCase().includes(q) && !pod.techStack?.some(t => t.toLowerCase().includes(q)) && !pod.tags?.some(t => t.toLowerCase().includes(q)) && !pod.idea?.toLowerCase().includes(q)) return false;
    if (selectedTechs.length > 0 && !selectedTechs.every(t => pod.techStack?.includes(t))) return false;
    if (selectedTags.length > 0 && !selectedTags.every(t => pod.tags?.includes(t))) return false;
    return true;
  };

  if (activePodId) return (
    <div className="p-10 max-w-4xl mx-auto">
      <PodRoom podId={activePodId} myId={myId} onBack={() => { setActivePodId(null); fetchPods(); }} />
    </div>
  );

  const myPods = pods.filter(p => p.members?.some(m => toStr(m) === toStr(myId))).filter(filterPod);
  const otherPods = pods.filter(p => !p.members?.some(m => toStr(m) === toStr(myId))).filter(filterPod);
  const allTechsInPods = [...new Set(pods.flatMap(p => p.techStack || []))].sort();
  const allTagsInPods = [...new Set(pods.flatMap(p => p.tags || []))].sort();

  return (
    <div className="p-10 max-w-7xl mx-auto font-body text-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-head font-black italic uppercase tracking-tighter">Study Pods</h1>
          <p className="text-muted text-sm mt-1 uppercase font-mono tracking-widest">Collaborative Coding Units</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-accent px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition shadow-xl shadow-accent/20 flex items-center gap-2">
          <Plus size={18}/> Launch Pod
        </button>
      </header>

      {/* Search & Filter bar */}
      <div className="mb-8 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={searchTech} onChange={e => setSearchTech(e.target.value)}
              placeholder="Search by title, tech, tag, or idea..."
              className="w-full bg-[#14141a] border border-[#2a2a38] rounded-2xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-accent" />
            {searchTech && <button onClick={() => setSearchTech("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"><X size={14}/></button>}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition flex items-center gap-2
              ${showFilters || hasFilters ? "border-accent bg-accent/10 text-accent" : "border-[#2a2a38] text-muted hover:text-white"}`}>
            <Search size={14}/> Filters {hasFilters && `(${selectedTechs.length + selectedTags.length})`}
          </button>
          {hasFilters && <button onClick={clearFilters} className="px-4 py-3 rounded-2xl border border-accent2/30 text-accent2 text-xs font-black uppercase hover:bg-accent2/10 transition">Clear</button>}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-6 space-y-4">
            {allTechsInPods.length > 0 && (
              <div>
                <p className="text-muted text-[10px] font-mono uppercase mb-2 font-bold">Filter by Tech</p>
                <div className="flex flex-wrap gap-2">
                  {allTechsInPods.map(t => (
                    <button key={t} onClick={() => toggleTechFilter(t)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${selectedTechs.includes(t) ? techColor(t) : 'border-[#2a2a38] text-muted hover:border-accent/30 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {allTagsInPods.length > 0 && (
              <div>
                <p className="text-muted text-[10px] font-mono uppercase mb-2 font-bold">Filter by Tag</p>
                <div className="flex flex-wrap gap-2">
                  {allTagsInPods.map(t => (
                    <button key={t} onClick={() => toggleTagFilter(t)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${selectedTags.includes(t) ? 'border-accent4/40 bg-accent4/10 text-accent4' : 'border-[#2a2a38] text-muted hover:border-accent/30 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse font-mono uppercase tracking-[0.5em] text-accent">Searching for active pods...</div>
      ) : (
        <>
          {myPods.length > 0 && (
            <section className="mb-10">
              <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-4 font-bold">My Pods</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
                {myPods.map(pod => (
                  <PodCard key={pod._id} pod={pod} myId={myId} onJoin={setJoinTarget} onEnter={setActivePodId} onDismissRejection={handleDismissRejection} />
                ))}
              </div>
            </section>
          )}
          {otherPods.length > 0 && (
            <section>
              <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-4 font-bold">Active Pods</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
                {otherPods.map(pod => (
                  <PodCard key={pod._id} pod={pod} myId={myId} onJoin={setJoinTarget} onEnter={setActivePodId} onDismissRejection={handleDismissRejection} />
                ))}
              </div>
            </section>
          )}
          {myPods.length === 0 && otherPods.length === 0 && (
            <div className="py-20 text-center font-mono text-muted uppercase tracking-widest text-xs">
              {hasFilters ? "No pods match your filters." : "No active pods — launch one to get started!"}
            </div>
          )}
        </>
      )}

      {showCreate && <CreatePodModal onClose={() => setShowCreate(false)} onCreate={() => { setShowCreate(false); fetchPods(); }} />}
      {joinTarget && <JoinModal pod={joinTarget} onClose={() => setJoinTarget(null)} onRequested={fetchPods} />}
    </div>
  );
};

export default Pods;