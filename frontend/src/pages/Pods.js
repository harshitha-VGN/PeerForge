import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, Users, LogOut, MessageSquare, UserPlus, Clock, AlertTriangle, XCircle, Search, X, Layers } from 'lucide-react';
import API from '../api';
import socket from '../socket';

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
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Decline Join Request</h2>
        <p className="text-gray-400 text-xs mb-4">Applicant: <span className="text-accent font-semibold">{requester?.split('@')[0]}</span></p>
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)}
          placeholder="Provide a constructive reason for the applicant..."
          rows={3} 
          className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent resize-none mb-4 text-sm" 
        />
        <div className="flex gap-3">
          <button 
            onClick={() => onConfirm(reason)} 
            className="flex-1 py-2.5 bg-accent2 text-white rounded-xl font-semibold text-xs hover:bg-accent2/90 transition shadow-lg shadow-accent2/20"
          >
            Decline Request
          </button>
          <button 
            onClick={onCancel} 
            className="flex-1 py-2.5 border border-[#2a2a38] text-gray-400 rounded-xl font-semibold text-xs hover:text-white hover:border-gray-600 transition"
          >
            Cancel
          </button>
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
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-3">
          🏆
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Complete & Close Pod</h2>
        <p className="text-gray-400 text-xs mb-5">
          Mark this project as finished to immortalize it in the <span className="text-accent font-semibold">Pods Hall of Fame</span>.
        </p>
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Project Link (Optional)</label>
          <input 
            value={link} 
            onChange={e => setLink(e.target.value)}
            placeholder="https://github.com/org/repo or Live Demo URL"
            className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent mb-5 text-sm transition" 
          />
        </div>
        <div className="flex gap-3">
          <button 
            disabled={loading} 
            onClick={async () => {
              setLoading(true);
              try { 
                await API.post(`/pods/${pod._id}/close`, { projectLink: link }); 
                onClosed(); 
                onClose(); 
              }
              catch (e) { alert(e.response?.data?.message || "Failed to close pod."); }
              finally { setLoading(false); }
            }} 
            className="flex-1 py-2.5 bg-accent text-white rounded-xl font-semibold text-xs hover:bg-accent/90 transition shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {loading ? "Closing Pod..." : "Finish & Enshrine"}
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 border border-[#2a2a38] text-gray-400 rounded-xl font-semibold text-xs hover:text-white transition"
          >
            Cancel
          </button>
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
    if (!form.title.trim() || !form.idea.trim()) return alert("Title and project idea are required.");
    setLoading(true);
    try { 
      const { data } = await API.post("/pods", form); 
      onCreate(data); 
      onClose(); 
    }
    catch (e) { alert(e.response?.data?.message || "Failed to launch pod."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl my-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a38] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Launch Study Pod</h2>
              <p className="text-xs text-gray-400">Assemble a team to build and study together</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Project Title *</label>
            <input 
              value={form.title} 
              onChange={e => setForm(f => ({...f, title: e.target.value}))}
              placeholder="e.g. Distributed Task Queue in Go" 
              className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent text-sm transition" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">What are you building? *</label>
            <textarea 
              value={form.idea} 
              onChange={e => setForm(f => ({...f, idea: e.target.value}))}
              placeholder="Describe the project goal, scope, and what skills members will gain..." 
              rows={3}
              className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent resize-none text-sm transition" 
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Tech Stack</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TECH_OPTIONS.map(t => (
                <button 
                  key={t} 
                  type="button" 
                  onClick={() => toggleTech(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    form.techStack.includes(t) 
                      ? techColor(t) 
                      : 'border-[#2a2a38] bg-[#0c0c0f] text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Custom tech input */}
            <div className="flex gap-2 mt-2">
              <input 
                value={techInput} 
                onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTech())}
                placeholder="Add other tech..." 
                className="flex-1 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-accent transition" 
              />
              <button 
                type="button" 
                onClick={addCustomTech} 
                className="px-4 py-2 bg-accent/15 text-accent rounded-xl text-xs font-semibold border border-accent/30 hover:bg-accent hover:text-white transition"
              >
                Add
              </button>
            </div>
            
            {form.techStack.filter(t => !TECH_OPTIONS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.techStack.filter(t => !TECH_OPTIONS.includes(t)).map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-accent/30 bg-accent/10 text-accent">
                    {t}
                    <button type="button" onClick={() => toggleTech(t)}><X size={12}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Project Category Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map(t => (
                <button 
                  key={t} 
                  type="button" 
                  onClick={() => toggleTag(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    form.tags.includes(t) 
                      ? 'border-accent4/40 bg-accent4/10 text-accent4 font-semibold' 
                      : 'border-[#2a2a38] bg-[#0c0c0f] text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Max members */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Team Size Limit</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                min={2} 
                max={20} 
                value={form.maxMembers}
                onChange={e => setForm(f => ({...f, maxMembers: Math.max(2, Math.min(20, Number(e.target.value)))}))}
                className="w-24 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-3 py-2 text-white outline-none focus:border-accent text-sm" 
              />
              <span className="text-gray-400 text-xs">Maximum developers (2–20 members)</span>
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full mt-4 py-3 bg-accent text-white rounded-xl font-semibold text-xs hover:bg-accent/90 transition shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {loading ? "Launching Pod..." : "Create & Open Pod"}
          </button>
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
    try { 
      await API.post(`/pods/${pod._id}/request`, { message: msg }); 
      onRequested(); 
      onClose(); 
    }
    catch (e) { alert(e.response?.data?.message || "Request failed."); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Request to Join Pod</h2>
        <p className="text-accent text-xs font-semibold mb-4">{pod.title}</p>
        <p className="text-gray-400 text-xs mb-4">
          The pod host will review your request and profile.
        </p>
        <textarea 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          placeholder="Introduce yourself and share what you'd like to contribute..." 
          rows={3}
          className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent resize-none mb-4 text-sm transition" 
        />
        <div className="flex gap-3">
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl font-semibold text-xs hover:bg-accent/90 transition shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Submit Request"}
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 border border-[#2a2a38] text-gray-400 rounded-xl font-semibold text-xs hover:text-white transition"
          >
            Cancel
          </button>
        </div>
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
    <div className={`bg-[#14141a] border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-200 group relative
      ${isMember || isCreator ? "border-accent/40 hover:border-accent" : "border-[#2a2a38] hover:border-[#3a3a4c]"}
      ${rejection ? "border-accent2/30" : ""}`}>

      {/* Pending requests badge */}
      {pendingCount > 0 && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent2 text-white rounded-full text-[10px] font-bold shadow-md">
          {pendingCount} new {pendingCount === 1 ? 'request' : 'requests'}
        </div>
      )}

      <div>
        {/* Rejection banner */}
        {rejection && (
          <div className="mb-4 bg-accent2/10 border border-accent2/20 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-accent2 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-accent2 font-semibold text-xs">Request Declined</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">"{rejection.reason || "Not a match currently."}"</p>
            </div>
            <button onClick={() => onDismissRejection(pod._id)} className="text-gray-500 hover:text-white transition shrink-0 p-0.5">
              <XCircle size={14}/>
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <span className={`text-xs px-2.5 py-0.5 rounded-lg border font-semibold ${
            pod.status === 'FULL' 
              ? 'border-accent2/20 bg-accent2/10 text-accent2' 
              : 'border-accent3/20 bg-accent3/10 text-accent3'
          }`}>
            ● {pod.status}
          </span>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
            <Users size={14}/> <span>{pod.members?.length || 1}/{pod.maxMembers}</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-1 group-hover:text-accent transition">
          {pod.title}
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Host: <span className="text-gray-300 font-medium">{hostName}</span> {isCreator && "(You)"}
        </p>

        {/* Tech stack */}
        {pod.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pod.techStack.slice(0, 4).map(t => (
              <span key={t} className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${techColor(t)}`}>{t}</span>
            ))}
            {pod.techStack.length > 4 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md border border-[#2a2a38] bg-[#0c0c0f] text-gray-400 font-medium">
                +{pod.techStack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {pod.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pod.tags.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-md border border-accent4/20 bg-accent4/10 text-accent4 font-medium">
                {t}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 italic mb-5">
          "{pod.idea}"
        </p>
      </div>

      <button
        onClick={() => (isMember || isCreator) ? onEnter(pod._id) : (!isPending && !rejection && pod.status === 'OPEN') ? onJoin(pod) : null}
        disabled={isPending || !!rejection || (pod.status === 'FULL' && !isMember && !isCreator)}
        className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2
          ${(isMember || isCreator) ? "bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent/90"
          : isPending ? "bg-[#0c0c0f] text-gray-400 border border-[#2a2a38] cursor-wait"
          : rejection ? "bg-accent2/10 text-accent2 border border-accent2/20 cursor-not-allowed"
          : pod.status === 'FULL' ? "bg-[#0c0c0f] text-gray-500 border border-[#2a2a38] cursor-not-allowed"
          : "bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-white"}`}>
        {(isMember || isCreator) ? <><MessageSquare size={14}/> Enter Pod Room</>
          : isPending ? <><Clock size={14}/> Request Pending</>
          : rejection ? <><XCircle size={14}/> Request Declined</>
          : pod.status === 'FULL' ? <><Users size={14}/> Pod Full</>
          : <><UserPlus size={14}/> Request to Join</>}
      </button>
    </div>
  );
};

// ─── Pod Room (Live Sockets) ──────────────────────────────────────────────────
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

  useEffect(() => {
    fetchStatus();

    socket.emit("join_pod", podId);

    const handleReceiveMessage = (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id && newMsg._id && m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    };

    const handlePodUpdated = (updatedPod) => {
      setPod(updatedPod);
    };

    const handlePodRequestReceived = () => {
      fetchStatus();
    };

    const handlePodClosed = () => {
      alert("This pod has been completed and closed.");
      onBack();
    };

    socket.on("receive_pod_message", handleReceiveMessage);
    socket.on("pod_updated", handlePodUpdated);
    socket.on("pod_request_received", handlePodRequestReceived);
    socket.on("pod_closed", handlePodClosed);

    return () => {
      socket.emit("leave_pod", podId);
      socket.off("receive_pod_message", handleReceiveMessage);
      socket.off("pod_updated", handlePodUpdated);
      socket.off("pod_request_received", handlePodRequestReceived);
      socket.off("pod_closed", handlePodClosed);
    };
  }, [podId, fetchStatus, onBack]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    try {
      const { data } = await API.post(`/pods/${podId}/message`, { content });
      if (data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id && data.data._id && m._id === data.data._id)) return prev;
          return [...prev, data.data];
        });
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to send message.");
    }
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

  if (!pod) return <div className="p-20 text-center font-semibold text-sm text-accent animate-pulse">Connecting to Pod Room...</div>;
  const isCreator = toStr(pod.creator) === toStr(myId);
  const pendingCount = pod.pendingRequests?.length || 0;

  return (
    <>
      {rejectTarget && <RejectModal requester={rejectTarget.email} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />}
      {showClose && <ClosePodModal pod={pod} onClose={() => setShowClose(false)} onClosed={onBack} />}

      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#2a2a38]">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="text-gray-400 hover:text-white transition text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/5 border border-[#2a2a38]"
            >
              ← Back to Pods
            </button>
            <div className="h-6 w-px bg-[#2a2a38]"/>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{pod.title}</h2>
              <p className="text-accent3 text-xs font-medium">● {pod.members?.length} Members Active · Real-time Chat</p>
            </div>
          </div>
          <button 
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-accent2/30 text-accent2 text-xs font-semibold hover:bg-accent2 hover:text-white transition"
          >
            <LogOut size={14} />
            <span>{isCreator ? "Close & Complete" : "Leave Pod"}</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {["chat", "members", ...(isCreator ? ["requests"] : [])].map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              className={`relative px-5 py-2 rounded-xl text-xs font-semibold transition capitalize ${
                tab === t 
                  ? "bg-accent text-white shadow-md shadow-accent/20" 
                  : "bg-[#14141a] text-gray-400 border border-[#2a2a38] hover:text-white"
              }`}
            >
              {t === 'chat' ? 'Pod Chat' : t === 'members' ? 'Team Members' : 'Join Requests'}
              {t === 'requests' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent2 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#14141a] border border-[#2a2a38] rounded-2xl overflow-hidden flex flex-col p-6 shadow-xl">
          {tab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-12">
                    No messages yet — start the conversation! 👋
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMe = toStr(m.sender) === toStr(myId);
                  return (
                    <div key={m._id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm shadow-md ${
                        isMe 
                          ? "bg-accent text-white rounded-br-none" 
                          : "bg-[#0c0c0f] border border-[#2a2a38] text-gray-200 rounded-bl-none"
                      }`}>
                        {!isMe && (
                          <div className="text-xs font-semibold text-accent mb-1">
                            {(m.senderEmail || "").split('@')[0]}
                          </div>
                        )}
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 bg-[#0c0c0f] p-2 rounded-xl border border-[#2a2a38]">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Message pod members..." 
                  className="flex-1 bg-transparent px-4 py-2 text-white outline-none text-sm placeholder-gray-500 font-normal" 
                />
                <button 
                  onClick={handleSend} 
                  className="bg-accent text-white p-2.5 rounded-lg hover:bg-accent/90 transition shadow-md shadow-accent/20"
                >
                  <Send size={16}/>
                </button>
              </div>
            </>
          )}

          {tab === "members" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pod.members?.map(m => (
                <div key={toStr(m)} className="p-4 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center font-bold text-accent">
                    {(m.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{m.email?.split('@')[0] || "User"}</div>
                    <div className="text-xs text-gray-400">
                      {toStr(m) === toStr(pod.creator) ? "Pod Host / Creator" : "Collaborator"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "requests" && isCreator && (
            <div className="space-y-3 overflow-y-auto">
              {pendingCount === 0 && (
                <div className="text-center text-gray-400 text-xs py-12">
                  No pending join requests
                </div>
              )}
              {pod.pendingRequests?.map(r => (
                <div key={toStr(r.user)} className="p-5 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-sm">{r.email?.split('@')[0]}</div>
                    <p className="text-gray-400 text-xs italic mt-1">"{r.message || 'No introduction provided'}"</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleAccept(r.user)} 
                      className="bg-accent3 text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent3/90 transition"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => setRejectTarget({ user: r.user, email: r.email })} 
                      className="border border-accent2/40 text-accent2 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent2/10 transition"
                    >
                      Decline
                    </button>
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

  useEffect(() => {
    fetchPods();

    socket.emit("join_lobby");

    const handlePodCreated = (newPod) => {
      setPods((prev) => [newPod, ...prev.filter((p) => p._id !== newPod._id)]);
    };

    const handlePodLobbyUpdated = (updatedPod) => {
      setPods((prev) => prev.map((p) => (p._id === updatedPod._id ? updatedPod : p)));
    };

    socket.on("pod_created", handlePodCreated);
    socket.on("pod_lobby_updated", handlePodLobbyUpdated);

    return () => {
      socket.emit("leave_lobby");
      socket.off("pod_created", handlePodCreated);
      socket.off("pod_lobby_updated", handlePodLobbyUpdated);
    };
  }, [fetchPods]);

  const handleDismissRejection = async (podId) => {
    try { await API.post(`/pods/${podId}/dismiss-rejection`); fetchPods(); } catch (e) { console.error(e); }
  };

  const toggleTechFilter = (t) => setSelectedTechs(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleTagFilter = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const clearFilters = () => { setSelectedTechs([]); setSelectedTags([]); setSearchTech(""); };
  const hasFilters = selectedTechs.length > 0 || selectedTags.length > 0 || searchTech.trim();

  const filterPod = (pod) => {
    const q = searchTech.trim().toLowerCase();
    if (q && !pod.title?.toLowerCase().includes(q) && !pod.techStack?.some(t => t.toLowerCase().includes(q)) && !pod.tags?.some(t => t.toLowerCase().includes(q)) && !pod.idea?.toLowerCase().includes(q)) return false;
    if (selectedTechs.length > 0 && !selectedTechs.every(t => pod.techStack?.includes(t))) return false;
    if (selectedTags.length > 0 && !selectedTags.every(t => pod.tags?.includes(t))) return false;
    return true;
  };

  if (activePodId) return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
      <PodRoom podId={activePodId} myId={myId} onBack={() => { setActivePodId(null); fetchPods(); }} />
    </div>
  );

  const myPods = pods.filter(p => p.members?.some(m => toStr(m) === toStr(myId))).filter(filterPod);
  const otherPods = pods.filter(p => !p.members?.some(m => toStr(m) === toStr(myId))).filter(filterPod);
  const allTechsInPods = [...new Set(pods.flatMap(p => p.techStack || []))].sort();
  const allTagsInPods = [...new Set(pods.flatMap(p => p.tags || []))].sort();

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-3">
              <Layers size={14} />
              <span>Collaborative Pods</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Study & Project Pods</h1>
            <p className="text-sm text-gray-400 mt-1">
              Build projects with peers, review code together, and ship to the Hall of Fame.
            </p>
          </div>

          <button 
            onClick={() => setShowCreate(true)}
            className="self-start sm:self-auto bg-accent text-white px-5 py-3 rounded-xl font-semibold text-xs hover:bg-accent/90 transition shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <Plus size={16}/> 
            <span>Launch New Pod</span>
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                value={searchTech} 
                onChange={e => setSearchTech(e.target.value)}
                placeholder="Search by title, tech stack, tag, or keywords..."
                className="w-full bg-[#14141a] border border-[#2a2a38] rounded-xl pl-11 pr-10 py-3 text-white text-sm outline-none focus:border-accent transition" 
              />
              {searchTech && (
                <button onClick={() => setSearchTech("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1">
                  <X size={14}/>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(f => !f)}
                className={`px-4 py-3 rounded-xl border text-xs font-semibold transition flex items-center gap-2 ${
                  showFilters || hasFilters 
                    ? "border-accent bg-accent/10 text-accent" 
                    : "border-[#2a2a38] bg-[#14141a] text-gray-400 hover:text-white"
                }`}
              >
                <Search size={14}/> 
                <span>Filters {hasFilters && `(${selectedTechs.length + selectedTags.length})`}</span>
              </button>
              {hasFilters && (
                <button 
                  onClick={clearFilters} 
                  className="px-4 py-3 rounded-xl border border-accent2/30 text-accent2 text-xs font-semibold hover:bg-accent2/10 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 space-y-4 shadow-xl">
              {allTechsInPods.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-2 block">Filter by Tech Stack</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTechsInPods.map(t => (
                      <button 
                        key={t} 
                        onClick={() => toggleTechFilter(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                          selectedTechs.includes(t) 
                            ? techColor(t) 
                            : 'border-[#2a2a38] bg-[#0c0c0f] text-gray-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {allTagsInPods.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-2 block">Filter by Tag</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTagsInPods.map(t => (
                      <button 
                        key={t} 
                        onClick={() => toggleTagFilter(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                          selectedTags.includes(t) 
                            ? 'border-accent4/40 bg-accent4/10 text-accent4 font-semibold' 
                            : 'border-[#2a2a38] bg-[#0c0c0f] text-gray-400 hover:text-white'
                        }`}
                      >
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
          <div className="py-24 text-center text-accent font-semibold text-sm animate-pulse">Loading pods...</div>
        ) : (
          <div className="space-y-10">
            {myPods.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">
                  My Active Pods ({myPods.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPods.map(pod => (
                    <PodCard key={pod._id} pod={pod} myId={myId} onJoin={setJoinTarget} onEnter={setActivePodId} onDismissRejection={handleDismissRejection} />
                  ))}
                </div>
              </section>
            )}

            {otherPods.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">
                  Discover Pods ({otherPods.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherPods.map(pod => (
                    <PodCard key={pod._id} pod={pod} myId={myId} onJoin={setJoinTarget} onEnter={setActivePodId} onDismissRejection={handleDismissRejection} />
                  ))}
                </div>
              </section>
            )}

            {myPods.length === 0 && otherPods.length === 0 && (
              <div className="py-20 text-center text-gray-400 text-xs bg-[#14141a] border border-[#2a2a38] rounded-2xl p-12">
                {hasFilters ? "No pods found matching your current filter criteria." : "No active pods right now. Be the first to launch one!"}
              </div>
            )}
          </div>
        )}

        {showCreate && <CreatePodModal onClose={() => setShowCreate(false)} onCreate={() => { setShowCreate(false); fetchPods(); }} />}
        {joinTarget && <JoinModal pod={joinTarget} onClose={() => setJoinTarget(null)} onRequested={fetchPods} />}
      </div>
    </div>
  );
};

export default Pods;