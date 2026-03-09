import React, { useState } from 'react';
import { Bot, Sparkles, Send } from 'lucide-react';
import API from '../api';

const AICompanion = ({ problemId, problemTitle }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm your DSA Buddy. Want to understand the patterns behind "${problemTitle}"?` }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!input) return;
    setLoading(true);
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);

    try {
      // This calls your RAG endpoint (Week 3/9)
      const { data } = await API.post('/ai/explain', { 
        problemId, 
        question: input 
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI." }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="bg-[#1c1c26] border border-[#2a2a38] rounded-xl p-4 flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-4 border-b border-[#2a2a38] pb-2 text-purple-400">
        <Bot size={20} />
        <span className="font-bold uppercase text-xs tracking-widest">RAG Pattern Explainer</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-purple-600' : 'bg-[#2a2a38]'}`}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-gray-500 italic text-xs">AI is thinking...</div>}
      </div>

      <div className="flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sliding window, DP..."
          className="flex-1 bg-[#0c0c0f] border border-[#2a2a38] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
        />
        <button onClick={handleAskAI} className="bg-purple-600 p-2 rounded-md hover:bg-purple-700 transition">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AICompanion;