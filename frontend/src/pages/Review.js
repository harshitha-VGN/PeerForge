import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Zap, CheckCircle, RotateCcw, ChevronRight, Plus, Trash2, BarChart2, Calendar, X, ExternalLink, Flame } from 'lucide-react';
import API from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffColor = (d) => ({
  Easy: "text-accent3 bg-accent3/10 border-accent3/20",
  Medium: "text-accent4 bg-accent4/10 border-accent4/20",
  Hard: "text-accent2 bg-accent2/10 border-accent2/20",
}[d] || "text-muted bg-surface2 border-border");

const ratingConfig = [
  { rating: 1, label: "AGAIN",  sub: "< 1 min",   color: "bg-accent2/10 border-accent2/40 text-accent2   hover:bg-accent2   hover:text-white", key: "1" },
  { rating: 2, label: "HARD",   sub: "~1 day",     color: "bg-accent4/10 border-accent4/40 text-accent4   hover:bg-accent4   hover:text-black", key: "2" },
  { rating: 3, label: "GOOD",   sub: "few days",   color: "bg-accent/10  border-accent/40  text-accent    hover:bg-accent    hover:text-white", key: "3" },
  { rating: 4, label: "EASY",   sub: "1+ week",    color: "bg-accent3/10 border-accent3/40 text-accent3   hover:bg-accent3   hover:text-black", key: "4" },
];

const formatDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.round((date - today) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `In ${diff} days`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Add Card Modal ───────────────────────────────────────────────────────────
const AddCardModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ problemSlug: "", problemTitle: "", difficulty: "Medium", category: "General" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = ["General", "Arrays", "Strings", "DP", "Graphs", "Stack", "Sliding Window", "Bit Manipulation", "Backtracking", "Binary Search", "Trees"];

  const handleSubmit = async () => {
    if (!form.problemSlug || !form.problemTitle) return setError("Slug and title required.");
    setLoading(true);
    try {
      await API.post("/review/add", form);
      onAdded();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add card.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-head font-black uppercase">Add Problem</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={20}/></button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1 block">Problem Title</label>
            <input value={form.problemTitle} onChange={e => setForm(f => ({...f, problemTitle: e.target.value}))}
              placeholder="e.g. Two Sum" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1 block">LeetCode Slug</label>
            <input value={form.problemSlug} onChange={e => setForm(f => ({...f, problemSlug: e.target.value}))}
              placeholder="e.g. two-sum" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1 block">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent">
                {["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-accent2 text-xs font-mono">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-accent text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.01] transition disabled:opacity-50">
            {loading ? "Adding..." : "ADD TO QUEUE"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Flip Card Component ──────────────────────────────────────────────────────
const FlipCard = ({ card, onRate, onSkip, sessionProgress, sessionTotal }) => {
  const [flipped, setFlipped] = useState(false);
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setFlipped(false); setRating(null); }, [card._id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!flipped) { if (e.key === " " || e.key === "Enter") setFlipped(true); return; }
      const r = parseInt(e.key);
      if (r >= 1 && r <= 4 && !submitting) handleRate(r);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, submitting]);

  const handleRate = async (r) => {
    if (submitting) return;
    setRating(r);
    setSubmitting(true);
    try {
      const res = await API.post("/review/submit", { cardId: card._id, rating: r });
      setTimeout(() => onRate(card, r, res.data), 400);
    } catch (e) {
      console.error("Rate failed:", e);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-[10px] font-mono text-muted uppercase mb-2">
          <span>Progress</span>
          <span>{sessionProgress}/{sessionTotal} reviewed</span>
        </div>
        <div className="w-full h-1 bg-surface2 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${sessionTotal > 0 ? (sessionProgress / sessionTotal) * 100 : 0}%` }} />
        </div>
      </div>

      {/* The card */}
      <div className="w-full" style={{ perspective: "1200px" }}>
        <div
          onClick={() => !flipped && setFlipped(true)}
          className="relative w-full transition-all duration-700 cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "320px",
          }}
        >
          {/* Front — problem name hidden, just category/diff */}
          <div className="absolute inset-0 bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between"
            style={{ backfaceVisibility: "hidden" }}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono px-3 py-1 rounded-lg border font-bold uppercase ${diffColor(card.difficulty)}`}>
                {card.difficulty}
              </span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{card.category}</span>
            </div>

            <div className="text-center py-8">
              <div className="text-muted text-[10px] font-mono uppercase tracking-[0.3em] mb-4">Can you solve this?</div>
              <h2 className="text-3xl font-head font-black uppercase tracking-tight text-white leading-tight">
                {card.problemTitle}
              </h2>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted text-xs font-mono">
              <span className="animate-pulse">SPACE / CLICK to reveal your confidence</span>
            </div>
          </div>

          {/* Back — rating buttons */}
          <div className="absolute inset-0 bg-surface border border-accent/20 rounded-3xl p-8 flex flex-col justify-between"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono px-3 py-1 rounded-lg border font-bold uppercase ${diffColor(card.difficulty)}`}>
                {card.difficulty}
              </span>
              <a href={`https://leetcode.com/problems/${card.problemSlug}/`} target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[10px] font-mono text-muted hover:text-accent flex items-center gap-1 uppercase">
                Open <ExternalLink size={10}/>
              </a>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-head font-black uppercase tracking-tight text-white mb-2">{card.problemTitle}</h2>
              <p className="text-muted text-xs font-mono">How well did you recall the solution approach?</p>
            </div>

            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest text-center mb-3">Rate your recall (keys 1–4)</div>
              <div className="grid grid-cols-4 gap-2">
                {ratingConfig.map(({ rating: r, label, sub, color }) => (
                  <button key={r} onClick={(e) => { e.stopPropagation(); handleRate(r); }}
                    disabled={submitting}
                    className={`border rounded-xl py-3 px-2 font-black text-xs uppercase transition-all ${color} ${rating === r ? "scale-95 opacity-70" : "hover:scale-[1.03]"} disabled:opacity-50`}>
                    <div className="text-sm font-black">{label}</div>
                    <div className="text-[9px] opacity-70 font-normal mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onSkip} className="mt-4 text-[10px] font-mono text-muted hover:text-white uppercase tracking-widest transition">
        Skip for now →
      </button>
    </div>
  );
};

// ─── Session Complete Screen ──────────────────────────────────────────────────
const SessionComplete = ({ results, onDone }) => {
  const counts = ratingConfig.map(({ rating, label, color }) => ({
    label, color, count: results.filter(r => r.rating === rating).length
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
      <div className="text-6xl mb-4">🧠</div>
      <h2 className="text-4xl font-head font-black uppercase tracking-tighter mb-2">Session Done!</h2>
      <p className="text-muted text-sm font-mono mb-8">Your memory schedule has been updated.</p>

      <div className="grid grid-cols-4 gap-3 w-full mb-8">
        {counts.map(({ label, count, color }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{count}</div>
            <div className={`text-[9px] font-mono uppercase mt-1 ${color.includes("accent2") ? "text-accent2" : color.includes("accent4") ? "text-accent4" : color.includes("accent3") ? "text-accent3" : "text-accent"}`}>{label}</div>
          </div>
        ))}
      </div>

      <button onClick={onDone} className="bg-accent px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition">
        Back to Queue
      </button>
    </div>
  );
};

// ─── Main Review Page ─────────────────────────────────────────────────────────
const Review = () => {
  const [view, setView] = useState("queue"); // queue | session | library
  const [dueCards, setDueCards] = useState([]);
  const [upcomingCards, setUpcomingCards] = useState([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Session state
  const [sessionQueue, setSessionQueue] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState([]);
  const [sessionDone, setSessionDone] = useState(false);

  // Library
  const [allCards, setAllCards] = useState([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  const fetchDue = async () => {
    try {
      const { data } = await API.get("/review/due");
      setDueCards(data.dueCards);
      setUpcomingCards(data.upcomingCards);
      setTotalCards(data.totalCards);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLibrary = async () => {
    const { data } = await API.get("/review/all");
    setAllCards(data);
    setLibraryLoaded(true);
  };

  useEffect(() => { fetchDue(); }, []);

  const startSession = () => {
    if (dueCards.length === 0) return;
    setSessionQueue([...dueCards]);
    setSessionIndex(0);
    setSessionResults([]);
    setSessionDone(false);
    setView("session");
  };

  const handleRate = (card, rating, serverRes) => {
    setSessionResults(r => [...r, { card, rating, ...serverRes }]);
    const next = sessionIndex + 1;
    if (next >= sessionQueue.length) setSessionDone(true);
    else setSessionIndex(next);
  };

  const handleSkip = () => {
    const next = sessionIndex + 1;
    if (next >= sessionQueue.length) setSessionDone(true);
    else setSessionIndex(next);
  };

  const handleSessionDone = () => {
    setView("queue");
    fetchDue();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this card?")) return;
    await API.delete(`/review/${id}`);
    setAllCards(c => c.filter(x => x._id !== id));
    fetchDue();
  };

  // ── Queue View ──────────────────────────────────────────────────────────────
  const QueueView = () => (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Due Today", value: dueCards.length, icon: <Zap size={16}/>, color: dueCards.length > 0 ? "text-accent2" : "text-accent3" },
          { label: "Upcoming (7d)", value: upcomingCards.length, icon: <Calendar size={16}/>, color: "text-accent4" },
          { label: "Total Cards", value: totalCards, icon: <BarChart2 size={16}/>, color: "text-accent" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`${color}`}>{icon}</div>
            <div>
              <div className={`text-2xl font-head font-black ${color}`}>{value}</div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Start session CTA */}
      {dueCards.length > 0 ? (
        <div className="bg-surface border border-accent/20 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-head font-black uppercase">
              {dueCards.length} card{dueCards.length !== 1 ? "s" : ""} need review
            </h2>
            <p className="text-muted text-sm mt-1 font-mono">Rate each card to update your memory schedule.</p>
          </div>
          <button onClick={startSession}
            className="bg-accent px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition flex items-center gap-2 whitespace-nowrap">
            <Zap size={16} fill="currentColor"/> START SESSION
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-3xl p-10 mb-8 text-center">
          <CheckCircle className="mx-auto text-accent3 mb-3" size={40}/>
          <h3 className="text-xl font-bold mb-1">You're all caught up!</h3>
          <p className="text-muted text-sm font-mono">
            {upcomingCards.length > 0
              ? `Next review: ${formatDate(upcomingCards[0]?.nextReviewDate)}`
              : "Add problems to start building your schedule."}
          </p>
        </div>
      )}

      {/* Due cards preview */}
      {dueCards.length > 0 && (
        <div className="mb-8">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted mb-3 font-bold">Due Now</h3>
          <div className="flex flex-col gap-2">
            {dueCards.map(card => (
              <div key={card._id} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${diffColor(card.difficulty)}`}>{card.difficulty}</span>
                  <span className="font-bold text-sm">{card.problemTitle}</span>
                  <span className="text-[10px] text-muted font-mono hidden md:block">{card.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  {card.streak > 0 && (
                    <span className="text-accent4 text-[10px] font-mono flex items-center gap-1">
                      <Flame size={10}/> {card.streak}
                    </span>
                  )}
                  <span className="text-accent2 text-[10px] font-mono uppercase">Overdue</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming forecast */}
      {upcomingCards.length > 0 && (
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted mb-3 font-bold">Upcoming</h3>
          <div className="flex flex-col gap-2">
            {upcomingCards.slice(0, 5).map(card => (
              <div key={card._id} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${diffColor(card.difficulty)}`}>{card.difficulty}</span>
                  <span className="font-bold text-sm">{card.problemTitle}</span>
                </div>
                <span className="text-muted text-[10px] font-mono">{formatDate(card.nextReviewDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Library View ────────────────────────────────────────────────────────────
  const LibraryView = () => {
    useEffect(() => { if (!libraryLoaded) fetchLibrary(); }, []);
    return (
      <div>
        <div className="flex flex-col gap-2">
          {allCards.length === 0 && (
            <div className="text-center py-16 text-muted font-mono text-sm">No cards yet. Add some!</div>
          )}
        {allCards.map(card => (
          <div key={card._id} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${diffColor(card.difficulty)}`}>
                {card.difficulty}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{card.problemTitle}</span>
                  <a href={`https://leetcode.com/problems/${card.problemSlug}/`} 
                    target="_blank" rel="noreferrer"
                    className="text-muted hover:text-accent transition">
                    <ExternalLink size={12}/>
                  </a>
                </div>
                <div className="text-[10px] text-muted font-mono">
                  {card.category} · {card.totalReviews} reviews · ease {card.easeFactor.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted">{formatDate(card.nextReviewDate)}</span>
              <button onClick={() => handleDelete(card._id)}
                className="text-muted hover:text-accent2 transition p-1">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 max-w-4xl mx-auto font-body text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-head font-black uppercase">REVISION QUEUE</h1>
          <p className="text-muted text-sm mt-1">SM-2 spaced repetition — the same algorithm as Anki.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 border border-border px-5 py-2.5 rounded-xl text-sm font-bold hover:border-accent transition uppercase tracking-wide">
            <Plus size={14}/> Add Problem
          </button>
        </div>
      </div>

      {/* Tabs — only show when not in session */}
      {view !== "session" && (
        <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1 mb-8 w-fit">
          {[
            { id: "queue", label: "Queue", icon: <Clock size={13}/> },
            { id: "library", label: "Library", icon: <BookOpen size={13}/> },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition uppercase tracking-wide ${view === id ? "bg-accent text-white" : "text-muted hover:text-white"}`}>
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-muted font-mono animate-pulse text-xs uppercase">Loading your cards...</div>
      ) : view === "session" ? (
        sessionDone ? (
          <SessionComplete results={sessionResults} onDone={handleSessionDone} />
        ) : (
          <div>
            <button onClick={() => setView("queue")}
              className="text-[10px] font-mono text-muted hover:text-white uppercase tracking-widest mb-8 flex items-center gap-1 transition">
              ← Back to Queue
            </button>
            <FlipCard
              card={sessionQueue[sessionIndex]}
              onRate={handleRate}
              onSkip={handleSkip}
              sessionProgress={sessionResults.length}
              sessionTotal={sessionQueue.length}
            />
          </div>
        )
      ) : view === "queue" ? (
        <QueueView />
      ) : (
        <LibraryView />
      )}

      {showAddModal && (
        <AddCardModal onClose={() => setShowAddModal(false)} onAdded={() => { fetchDue(); setLibraryLoaded(false); }} />
      )}
    </div>
  );
};

export default Review;