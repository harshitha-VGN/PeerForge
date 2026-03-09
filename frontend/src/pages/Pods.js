import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Send, Users, LogOut, Check, 
  Layers, Zap, MessageSquare, UserPlus, Clock, ExternalLink 
} from 'lucide-react';
import API from '../api';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const toStr = (id) => (id?._id || id)?.toString();

const TECH_COLORS = {
  "React": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Node.js": "bg-green-500/10 text-green-400 border-green-500/20",
  "Python": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "MongoDB": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "TypeScript": "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const techColor = (t) => TECH_COLORS[t] || "bg-accent/10 text-accent border-accent/20";

// ─── Create Pod Modal ─────────────────────────────────────────────────────────
const CreatePodModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ title: "", idea: "", techStack: [], maxMembers: 4 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.idea.trim()) return alert("Title and idea are required.");
    setLoading(true);
    try {
      const { data } = await API.post("/pods", form);
      onCreate(data);
      onClose();
    } catch (e) { alert(e.response?.data?.message || "Failed to create pod."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8 w-full max-lg shadow-2xl">
        <h2 className="text-xl font-head font-black uppercase mb-6 text-white italic">Launch New Pod</h2>
        <div className="space-y-4">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Project Title" className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent" />
          <textarea value={form.idea} onChange={e => setForm(f => ({...f, idea: e.target.value}))} placeholder="What are you building?" rows={4} className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent resize-none" />
          <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-accent text-white rounded-xl font-black uppercase tracking-widest transition">
            {loading ? "Launching..." : "CREATE POD"}
          </button>
          <button onClick={onClose} className="w-full text-muted text-xs font-bold uppercase mt-2">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Join Request Modal ───────────────────────────────────────────────────────
const JoinModal = ({ pod, onClose, onRequested }) => {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await API.post(`/pods/${pod._id}/request`, { message: msg });
      onRequested();
      onClose();
    } catch (e) { alert("Request failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-head font-black uppercase mb-2 text-white">Join Request</h2>
        <p className="text-accent text-xs font-mono mb-6 uppercase tracking-widest">Project: {pod.title}</p>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Introduce yourself..." rows={3} className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-3 text-white outline-none focus:border-accent resize-none mb-4" />
        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-accent text-white rounded-xl font-black uppercase transition">
          {loading ? "Sending..." : "SEND REQUEST"}
        </button>
        <button onClick={onClose} className="w-full text-muted text-xs font-bold mt-4">CANCEL</button>
      </div>
    </div>
  );
};

// ─── Pod Card ─────────────────────────────────────────────────────────────────
const PodCard = ({ pod, myId, onJoin, onEnter }) => {
  const isMember = pod.members?.some(m => toStr(m) === toStr(myId));
  const isCreator = toStr(pod.creator) === toStr(myId);
  const isPending = !isMember && !isCreator && pod.pendingRequests?.some(r => toStr(r.user) === toStr(myId));

  const hostName = (pod.creatorEmail || pod.creator?.email || "User").split("@")[0];

  return (
    <div className={`bg-[#14141a] border rounded-[2rem] p-8 flex flex-col gap-5 transition-all group relative overflow-hidden h-full
      ${isMember || isCreator ? "border-accent/40 bg-accent/5 ring-1 ring-accent/10" : "border-[#2a2a38] hover:border-accent/30"}`}>
      
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono px-3 py-1 rounded-full border border-accent3/20 bg-accent3/5 text-accent3 uppercase font-bold tracking-widest">
          ● {pod.status}
        </span>
        <div className="flex items-center gap-1 text-muted text-[10px] font-mono">
          <Users size={12}/> {pod.members?.length || 1}/{pod.maxMembers}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-head font-black uppercase tracking-tight text-white mb-1 group-hover:text-accent transition-colors">
            {pod.title || "Untitled Project"}
        </h3>
        <p className="text-muted text-[10px] font-mono uppercase tracking-widest italic">By {hostName} {isCreator && "(YOU)"}</p>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 h-[60px] italic">"{pod.idea}"</p>

      <button
        onClick={() => (isMember || isCreator) ? onEnter(pod._id) : !isPending && onJoin(pod)}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
          ${(isMember || isCreator)
            ? "bg-accent text-white shadow-lg shadow-accent/20"
            : isPending 
            ? "bg-[#1c1c26] text-muted cursor-wait border border-[#2a2a38]"
            : "border-2 border-accent text-accent hover:bg-accent hover:text-white"}`}
      >
        {isMember || isCreator ? (<><MessageSquare size={14}/> OPEN CHAT</>)
          : isPending ? (<><Clock size={14}/> REQUEST PENDING</>)
          : (<><UserPlus size={14}/> REQUEST TO JOIN</>)}
      </button>
    </div>
  );
};

// ─── Pod Room (Chat) ──────────────────────────────────────────────────────────
const PodRoom = ({ podId, myId, onBack }) => {
  const [pod, setPod] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState("chat");
  const messagesEndRef = useRef(null);

  const handleLeave = async () => {
    // Check if the user is the creator (isCreator is usually defined below)
    const isCreator = (pod?.creator?._id || pod?.creator)?.toString() === myId?.toString();
    
    const confirmMsg = isCreator 
      ? "Close this pod? It will be deleted for everyone." 
      : "Are you sure you want to leave this pod?";

    if (!window.confirm(confirmMsg)) return;

    try {
      // Calls the /api/pods/:id/leave route we created in the backend
      await API.post(`/pods/${podId}/leave`);
      
      // ✅ Go back to the Lobby
      onBack(); 
    } catch (e) {
      alert(e.response?.data?.message || "Failed to leave pod.");
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const [pRes, mRes] = await Promise.all([ API.get(`/pods/${podId}`), API.get(`/pods/${podId}/messages`) ]);
      setPod(pRes.data);
      setMessages(mRes.data);
    } catch (e) { console.error(e); }
  }, [podId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await API.post(`/pods/${podId}/message`, { content: input.trim() });
      setInput("");
      fetchStatus();
    } catch (e) { console.error(e); }
  };

  const handleAction = async (action, userObj) => {
    const targetId = toStr(userObj);
    try {
      await API.post(`/pods/${podId}/${action}`, { requestUserId: targetId });
      fetchStatus();
    } catch (e) { alert("Action failed"); }
  };

  if (!pod) return <div className="p-20 text-center font-mono animate-pulse uppercase text-xs tracking-widest text-accent">Syncing Pod Data...</div>;

  const isCreator = toStr(pod.creator) === toStr(myId);

  return (
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
        <button 
          onClick={handleLeave} 
          className="group flex items-center gap-2 px-5 py-2 rounded-xl border border-accent2/30 text-accent2 text-[10px] font-black uppercase hover:bg-accent2 hover:text-white transition-all duration-300"
        >
          <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" />
          <span>{isCreator ? "Close Pod" : "Leave"}</span>
        </button>
        
      </div>

      <div className="flex gap-2 mb-6">
        {["chat", "members", "requests"].map(t => (
          (t !== 'requests' || isCreator) && (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition
              ${tab === t ? "bg-accent text-white" : "text-muted hover:text-white"}`}>
              {t} {t === 'requests' && pod.pendingRequests?.length > 0 && `(${pod.pendingRequests.length})`}
            </button>
          )
        ))}
      </div>

      <div className="flex-1 bg-[#14141a] border border-[#2a2a38] rounded-3xl overflow-hidden flex flex-col p-6 shadow-2xl">
        {tab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
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
                   <div className="text-[9px] text-muted font-mono uppercase">Developer</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-4">
            {pod.pendingRequests?.map(r => (
              <div key={toStr(r.user)} className="p-6 bg-[#0c0c0f] border border-[#2a2a38] rounded-3xl flex justify-between items-center">
                <div>
                  <div className="font-black text-white">{r.email?.split('@')[0]}</div>
                  <p className="text-muted text-xs italic mt-1">"{r.message || 'No intro message'}"</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('accept', r.user)} className="bg-accent3 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Accept</button>
                  <button onClick={() => handleAction('reject', r.user)} className="bg-accent2 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

  const fetchPods = useCallback(async () => {
    try {
      const [podsRes, userRes] = await Promise.all([
        API.get("/pods"), 
        API.get("/auth/me")
      ]);
      setPods(podsRes.data);
      setMyId(userRes.data._id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPods();
    // ✅ FIX: ADD LOBBY POLLING
    // This refreshes the "Join" button to "Open Chat" automatically
    const interval = setInterval(fetchPods, 4000); 
    return () => clearInterval(interval);
  }, [fetchPods]);

  if (activePodId) return (
    <div className="p-10 max-w-4xl mx-auto">
      <PodRoom 
        podId={activePodId} 
        myId={myId} 
        onBack={() => { setActivePodId(null); fetchPods(); }} 
      />
    </div>
  );

  return (
  
    <div className="p-10 max-w-7xl mx-auto font-body text-white">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-head font-black italic uppercase tracking-tighter">Study Pods</h1>
          <p className="text-muted text-sm mt-1 uppercase font-mono tracking-widest">Collaborative Coding Units</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-accent px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition shadow-xl shadow-accent/20 flex items-center gap-2">
          <Plus size={18}/> Launch Pod
        </button>
      </header>

      {loading ? (
        <div className="py-20 text-center animate-pulse font-mono uppercase tracking-[0.5em] text-accent">Searching for active pods...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pods.map(pod => (
            <PodCard key={pod._id} pod={pod} myId={myId} onJoin={setJoinTarget} onEnter={setActivePodId} />
          ))}
        </div>
      )}

      {showCreate && <CreatePodModal onClose={() => setShowCreate(false)} onCreate={fetchPods} />}
      {joinTarget && <JoinModal pod={joinTarget} onClose={() => setJoinTarget(null)} onRequested={fetchPods} />}
    </div>
  );
};

export default Pods;