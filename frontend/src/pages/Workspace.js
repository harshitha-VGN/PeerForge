import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProblemDetails } from '../services/problemService';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Play, CheckCircle, Code2, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Workspace = () => {
  const { titleSlug } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('// Your solution here...\n\nfunction solution() {\n  \n}\n');

  useEffect(() => {
    const loadProblem = async () => {
      const data = await fetchProblemDetails(titleSlug);
      setProblem(data);
    };
    loadProblem();
  }, [titleSlug]);

  if (!problem) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#0c0c0f] text-accent gap-3">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-sm font-semibold">Loading problem workspace...</span>
      </div>
    );
  }

  const diffBadgeClass = 
    problem.difficulty === 'Easy' ? 'bg-accent3/10 text-accent3 border-accent3/20' :
    problem.difficulty === 'Medium' ? 'bg-accent4/10 text-accent4 border-accent4/20' :
    'bg-accent2/10 text-accent2 border-accent2/20';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0c0c0f] overflow-hidden text-white">
      {/* Top action bar */}
      <div className="h-14 bg-[#14141a] border-b border-[#2a2a38] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="h-4 w-px bg-[#2a2a38]" />
          <h1 className="text-sm font-bold text-white tracking-tight">{problem.questionTitle}</h1>
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${diffBadgeClass}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:border-[#3a3a4c] transition">
            <Play size={14} className="text-accent4" /> Run
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white rounded-xl text-xs font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20">
            <CheckCircle size={14} /> Submit
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Description */}
        <div className="w-2/5 border-r border-[#2a2a38] overflow-y-auto p-6 bg-[#14141a]/60">
          <div 
            className="text-sm text-gray-300 leading-relaxed space-y-4 problem-description"
            dangerouslySetInnerHTML={{ __html: problem.question }}
          />
        </div>

        {/* Right: Code Editor */}
        <div className="flex-1 flex flex-col bg-[#0c0c0f]">
          <div className="px-4 py-2 border-b border-[#2a2a38] flex justify-between items-center bg-[#14141a]">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-2">
              <Code2 size={14} className="text-accent" /> Solution.js
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-[#0c0c0f]">
            <CodeMirror
              value={code}
              height="100%"
              theme="dark"
              extensions={[javascript()]}
              onChange={(value) => setCode(value)}
              className="text-sm font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;