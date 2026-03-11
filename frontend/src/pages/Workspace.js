import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProblemDetails } from '../services/problemService';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Play, CheckCircle } from 'lucide-react';

const Workspace = () => {
  const { titleSlug } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('// Your solution here...');

  useEffect(() => {
    const loadProblem = async () => {
      const data = await fetchProblemDetails(titleSlug);
      setProblem(data);
    };
    loadProblem();
  }, [titleSlug]);

  if (!problem) return <div className="p-10 text-accent font-mono">Loading problem from LeetCode...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Description */}
        <div className="w-1/3 border-r border-border overflow-y-auto p-6 bg-surface">
          <h1 className="font-head text-2xl font-bold mb-4">{problem.questionTitle}</h1>
          <div className="flex gap-2 mb-6">
            <span className="bg-accent4/10 text-accent4 px-3 py-1 rounded-full text-xs font-bold uppercase">{problem.difficulty}</span>
          </div>
          <div 
  className="text-sm text-gray-300 leading-relaxed space-y-4 problem-description"
  dangerouslySetInnerHTML={{ __html: problem.question }}
/>
          
        </div>

        {/* Right: Code Editor */}
        <div className="flex-1 flex flex-col bg-[#0a0a0d]">
          <div className="p-2 border-b border-border flex justify-between bg-surface/50">
            <span className="text-xs font-mono text-muted p-2">index.js</span>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-1.5 bg-surface2 rounded-lg text-xs font-bold hover:bg-surface3 transition border border-border">
                <Play size={14} /> Run
              </button>
              <button className="flex items-center gap-2 px-4 py-1.5 bg-accent rounded-lg text-xs font-bold hover:opacity-90 transition shadow-lg shadow-accent/20">
                <CheckCircle size={14} /> Submit
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <CodeMirror
              value={code}
              height="100%"
              theme="dark"
              extensions={[javascript()]}
              onChange={(value) => setCode(value)}
              className="text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;