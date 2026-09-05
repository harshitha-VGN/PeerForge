import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, Zap, CheckCircle, RotateCcw, Plus, Trash2, BarChart2, Calendar, X, ExternalLink, Flame, ChevronDown, Sparkles } from 'lucide-react';
import API from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffColor = (d) => ({
  Easy: "text-accent3 bg-accent3/10 border-accent3/20",
  Medium: "text-accent4 bg-accent4/10 border-accent4/20",
  Hard: "text-accent2 bg-accent2/10 border-accent2/20",
}[d] || "text-gray-400 bg-gray-800/40 border-gray-700");

const ratingConfig = [
  { rating: 1, label: "Again",  sub: "< 1 min",   color: "bg-accent2/10 border-accent2/40 text-accent2 hover:bg-accent2 hover:text-white", key: "1" },
  { rating: 2, label: "Hard",   sub: "~1 day",     color: "bg-accent4/10 border-accent4/40 text-accent4 hover:bg-accent4 hover:text-black", key: "2" },
  { rating: 3, label: "Good",   sub: "Few days",   color: "bg-accent/10 border-accent/40 text-accent hover:bg-accent hover:text-white", key: "3" },
  { rating: 4, label: "Easy",   sub: "1+ week",    color: "bg-accent3/10 border-accent3/40 text-accent3 hover:bg-accent3 hover:text-black", key: "4" },
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
    if (!form.problemSlug || !form.problemTitle) return setError("Slug and title are required.");
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a2a38]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Add Problem to Review</h2>
              <p className="text-xs text-gray-400">SM-2 Spaced Repetition Queue</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
            <X size={18}/>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Problem Title</label>
            <input 
              value={form.problemTitle} 
              onChange={e => setForm(f => ({...f, problemTitle: e.target.value}))}
              placeholder="e.g. Two Sum" 
              className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent transition" 
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">
              LeetCode Problem Slug
            </label>
            <input 
              value={form.problemSlug} 
              onChange={e => setForm(f => ({...f, problemSlug: e.target.value}))}
              placeholder="two-sum" 
              className="w-full bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent transition font-mono" 
            />
            <p className="text-[11px] text-gray-500 mt-1">
              From URL: leetcode.com/problems/<span className="text-accent font-semibold">two-sum</span>/
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Difficulty</label>
              <div className="relative">
                <select 
                  value={form.difficulty} 
                  onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}
                  className="w-full appearance-none bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent pr-10 cursor-pointer transition"
                >
                  {["Easy","Medium","Hard"].map(d => <option key={d} value={d} className="bg-[#14141a] text-white">{d}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Category</label>
              <div className="relative">
                <select 
                  value={form.category} 
                  onChange={e => setForm(f => ({...f, category: e.target.value}))}
                  className="w-full appearance-none bg-[#0c0c0f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent pr-10 cursor-pointer transition"
                >
                  {categories.map(c => <option key={c} value={c} className="bg-[#14141a] text-white">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {error && <p className="text-accent2 text-xs font-medium">{error}</p>}

          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full mt-2 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Review Queue"}
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

  const handleRate = useCallback(async (r) => {
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
  }, [card, onRate, submitting]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === " " || e.key === "Enter") {
        setFlipped(!flipped);
        return;
      }
      if (flipped) {
        const r = parseInt(e.key);
        if (r >= 1 && r <= 4 && !submitting) handleRate(r);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, submitting, handleRate]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
          <span>Active Review Session</span>
          <span className="text-white">{sessionProgress} of {sessionTotal} reviewed</span>
        </div>
        <div className="w-full h-2 bg-[#14141a] border border-[#2a2a38] rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500 shadow-md shadow-accent/30"
            style={{ width: `${sessionTotal > 0 ? (sessionProgress / sessionTotal) * 100 : 0}%` }} 
          />
        </div>
      </div>

      {/* The card */}
      <div className="w-full" style={{ perspective: "1500px" }}>
        <div
          className="relative w-full transition-all duration-700 ease-in-out cursor-default"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "400px",
          }}
        >
          {/* FRONT SIDE */}
          <div 
            onClick={() => setFlipped(true)}
            className="absolute inset-0 bg-[#14141a] border border-[#2a2a38] rounded-2xl p-8 sm:p-10 flex flex-col justify-between shadow-2xl cursor-pointer hover:border-[#3a3a4c] transition"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs px-3 py-1 rounded-lg border font-semibold ${diffColor(card.difficulty)}`}>
                {card.difficulty}
              </span>
              <span className="text-xs font-semibold text-gray-400">{card.category}</span>
            </div>

            <div className="text-center py-6">
              <div className="text-accent text-xs font-semibold mb-3 flex items-center justify-center gap-1.5">
                <Sparkles size={14} /> Ready to Recall
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                {card.problemTitle}
              </h2>
            </div>

            <div className="text-center">
              <span className="text-xs text-gray-400 bg-[#0c0c0f] border border-[#2a2a38] px-4 py-2 rounded-xl inline-block">
                Click anywhere on the card to flip & check
              </span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div 
            className="absolute inset-0 bg-[#14141a] border border-accent/40 rounded-2xl p-8 sm:p-10 flex flex-col justify-between shadow-2xl"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs px-3 py-1 rounded-lg border font-semibold ${diffColor(card.difficulty)}`}>
                {card.difficulty}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 bg-[#0c0c0f] border border-[#2a2a38] px-3 py-1.5 rounded-xl transition"
              >
                <RotateCcw size={12}/> Flip Front
              </button>
            </div>

            <div className="text-center my-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">{card.problemTitle}</h2>
              <a 
                href={`https://leetcode.com/problems/${card.problemSlug}/`} 
                target="_blank" 
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition shadow-lg"
              >
                <span>Open on LeetCode</span>
                <ExternalLink size={14}/>
              </a>
            </div>

            <div className="bg-[#0c0c0f] p-4 sm:p-5 rounded-2xl border border-[#2a2a38]">
              <div className="text-xs font-semibold text-gray-400 text-center mb-3">Rate your recall accuracy (SM-2 Interval)</div>
              <div className="grid grid-cols-4 gap-2">
                {ratingConfig.map(({ rating: r, label, sub, color }) => (
                  <button 
                    key={r} 
                    onClick={(e) => { e.stopPropagation(); handleRate(r); }}
                    disabled={submitting}
                    className={`border rounded-xl py-3 px-2 font-bold text-xs transition ${color} ${rating === r ? "ring-2 ring-white" : ""} disabled:opacity-50 flex flex-col items-center justify-center`}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] opacity-70 font-normal mt-0.5">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={onSkip} 
        className="mt-6 text-xs font-semibold text-gray-500 hover:text-gray-300 transition"
      >
        Skip this card for now →
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
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto py-8">
      <div className="w-16 h-16 rounded-2xl bg-accent3/10 border border-accent3/20 flex items-center justify-center text-accent3 mb-4 shadow-lg">
        <CheckCircle size={36} />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Session Complete!</h2>
      <p className="text-gray-400 text-xs mb-8">Your spaced repetition schedule and intervals have been saved.</p>

      <div className="grid grid-cols-4 gap-3 w-full mb-8">
        {counts.map(({ label, count }) => (
          <div key={label} className="bg-[#14141a] border border-[#2a2a38] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{count}</div>
            <div className="text-xs text-gray-400 font-semibold mt-1">{label}</div>
          </div>
        ))}
      </div>

      <button 
        onClick={onDone} 
        className="bg-accent text-white px-8 py-3 rounded-xl font-semibold text-xs hover:bg-accent/90 transition shadow-lg shadow-accent/20"
      >
        Return to Review Queue
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
    if (!window.confirm("Remove this problem card from your spaced repetition schedule?")) return;
    await API.delete(`/review/${id}`);
    setAllCards(c => c.filter(x => x._id !== id));
    fetchDue();
  };

  // ── Queue View ──────────────────────────────────────────────────────────────
  const QueueView = () => (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Due Today", value: dueCards.length, icon: <Zap size={18}/>, color: dueCards.length > 0 ? "text-accent2 bg-accent2/10 border-accent2/20" : "text-accent3 bg-accent3/10 border-accent3/20" },
          { label: "Upcoming (7d)", value: upcomingCards.length, icon: <Calendar size={18}/>, color: "text-accent4 bg-accent4/10 border-accent4/20" },
          { label: "Total Cards", value: totalCards, icon: <BarChart2 size={18}/>, color: "text-accent bg-accent/10 border-accent/20" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
              <div className="text-xs text-gray-400 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Start session CTA */}
      {dueCards.length > 0 ? (
        <div className="bg-[#14141a] border border-accent/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">
              {dueCards.length} problem{dueCards.length !== 1 ? "s" : ""} due for review
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              Reinforce your memory with the SuperMemo-2 (SM-2) recall algorithm.
            </p>
          </div>
          <button 
            onClick={startSession}
            className="bg-accent text-white px-6 py-3 rounded-xl font-semibold text-xs hover:bg-accent/90 transition shadow-lg shadow-accent/20 flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <Zap size={16} fill="currentColor"/> 
            <span>Start Review Session</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-8 sm:p-10 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-accent3/10 border border-accent3/20 flex items-center justify-center text-accent3 mx-auto mb-3">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">You're all caught up!</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            {upcomingCards.length > 0
              ? `Next scheduled review: ${formatDate(upcomingCards[0]?.nextReviewDate)}`
              : "Add problems from LeetCode to build your spaced repetition schedule."}
          </p>
        </div>
      )}

      {/* Due cards preview */}
      {dueCards.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 mb-3 px-1">Due for Recall</h3>
          <div className="space-y-2.5">
            {dueCards.map(card => (
              <div 
                key={card._id} 
                className="bg-[#14141a] border border-[#2a2a38] rounded-xl px-5 py-3.5 flex items-center justify-between transition hover:border-[#3a3a4c]"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${diffColor(card.difficulty)}`}>
                    {card.difficulty}
                  </span>
                  <span className="font-semibold text-sm text-white">{card.problemTitle}</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">{card.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  {card.streak > 0 && (
                    <span className="text-orange-400 text-xs font-semibold flex items-center gap-1">
                      <Flame size={12}/> {card.streak}
                    </span>
                  )}
                  <span className="text-accent2 text-xs font-semibold bg-accent2/10 px-2.5 py-0.5 rounded-md border border-accent2/20">
                    Overdue
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming forecast */}
      {upcomingCards.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 mb-3 px-1">Upcoming Forecast</h3>
          <div className="space-y-2.5">
            {upcomingCards.slice(0, 5).map(card => (
              <div 
                key={card._id} 
                className="bg-[#14141a]/60 border border-[#2a2a38] rounded-xl px-5 py-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${diffColor(card.difficulty)}`}>
                    {card.difficulty}
                  </span>
                  <span className="font-semibold text-sm text-gray-300">{card.problemTitle}</span>
                </div>
                <span className="text-gray-400 text-xs font-medium">{formatDate(card.nextReviewDate)}</span>
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
        <div className="space-y-2.5">
          {allCards.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-xs bg-[#14141a] border border-[#2a2a38] rounded-2xl">
              No problem cards in library. Click "Add Problem" to get started!
            </div>
          )}
          {allCards.map(card => (
            <div 
              key={card._id} 
              className="bg-[#14141a] border border-[#2a2a38] rounded-xl px-5 py-4 flex items-center justify-between transition hover:border-[#3a3a4c]"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${diffColor(card.difficulty)}`}>
                  {card.difficulty}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{card.problemTitle}</span>
                    <a 
                      href={`https://leetcode.com/problems/${card.problemSlug}/`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-gray-500 hover:text-accent transition p-0.5"
                    >
                      <ExternalLink size={13}/>
                    </a>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {card.category} · {card.totalReviews} reviews · Ease {card.easeFactor?.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">{formatDate(card.nextReviewDate)}</span>
                <button 
                  onClick={() => handleDelete(card._id)}
                  className="text-gray-500 hover:text-accent2 transition p-1.5 rounded-lg hover:bg-white/5"
                  title="Delete Card"
                >
                  <Trash2 size={15}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-3">
              <Clock size={14} />
              <span>Spaced Repetition System</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Revision Queue</h1>
            <p className="text-sm text-gray-400 mt-1">
              Retain algorithm solutions long-term using active recall.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20"
            >
              <Plus size={15}/> 
              <span>Add Problem</span>
            </button>
          </div>
        </div>

        {/* Tabs — only show when not in session */}
        {view !== "session" && (
          <div className="flex bg-[#14141a] border border-[#2a2a38] rounded-xl p-1 mb-8 w-fit">
            {[
              { id: "queue", label: "Due Queue", icon: <Clock size={14}/> },
              { id: "library", label: "All Problems", icon: <BookOpen size={14}/> },
            ].map(({ id, label, icon }) => (
              <button 
                key={id} 
                onClick={() => setView(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  view === id ? "bg-accent text-white shadow-md shadow-accent/20" : "text-gray-400 hover:text-white"
                }`}
              >
                {icon} <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-accent text-sm font-semibold animate-pulse">Loading review cards...</div>
        ) : view === "session" ? (
          sessionDone ? (
            <SessionComplete results={sessionResults} onDone={handleSessionDone} />
          ) : (
            <div>
              <button 
                onClick={() => setView("queue")}
                className="text-xs font-semibold text-gray-400 hover:text-white mb-6 flex items-center gap-1.5 transition"
              >
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
    </div>
  );
};

export default Review;