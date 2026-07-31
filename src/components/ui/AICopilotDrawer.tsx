import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, Code, MapPin, Zap } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const AICopilotDrawer: React.FC = () => {
  const isAICopilotOpen = useAtlasStore((s) => s.isAICopilotOpen);
  const toggleAICopilot = useAtlasStore((s) => s.toggleAICopilot);
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const buildings = useAtlasStore((s) => s.buildings);

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'ai'; text: string; graphNodes?: string[]; codeSnippet?: string }[]
  >([
    {
      sender: 'ai',
      text: "Hello! I am the Atlas X AI reasoning engine. I have parsed your Neo4j code graph, OTel traces, and ASTs. Ask me about your system's architecture, bottlenecks, or technical debt.",
    },
  ]);

  if (!isAICopilotOpen) return null;

  const handleSend = () => {
    if (!inputQuery.trim()) return;
    const userText = inputQuery;
    setInputQuery('');

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    // Simulate Neo4j Graph-RAG response with visual graph nodes
    setTimeout(() => {
      let aiReply = "Analyzing code graph topology...";
      let nodes: string[] = [];

      if (userText.toLowerCase().includes('checkout') || userText.toLowerCase().includes('order')) {
        aiReply =
          "The Checkout flow involves 3 microservices and 2 databases. High P99 latency (145ms) originates in checkout.controller.ts during synchronous Stripe SDK calls.";
        nodes = ['checkout.controller.ts', 'stripe.processor.ts', 'PostgreSQL Orders DB'];
      } else if (userText.toLowerCase().includes('auth') || userText.toLowerCase().includes('token')) {
        aiReply =
          "Authentication flows through auth.service.ts. It executes 1,200 req/s with 94% cache hits on Redis L2 Cluster.";
        nodes = ['auth.service.ts', 'jwt.strategy.ts', 'Redis L2 Cluster'];
      } else {
        aiReply =
          "I have traced your query across the repository knowledge graph. The selected building relies on 2 upstream handlers and 1 persistent cache.";
        nodes = [buildings.find((b) => b.id === selectedBuildingId)?.name || 'router.ts'];
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          graphNodes: nodes,
        },
      ]);
    }, 800);
  };

  return (
    <div className="absolute top-20 left-6 w-[420px] h-[calc(100vh-120px)] glass-panel rounded-2xl border border-purple-500/30 z-40 p-4 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              AI Graph Copilot
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </h3>
            <p className="text-[10px] text-purple-300 font-mono">Graph-RAG Engine Active</p>
          </div>
        </div>
        <button onClick={toggleAICopilot} className="text-slate-400 hover:text-white p-1 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1.5 ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`p-3 rounded-xl text-xs max-w-[90%] ${
                m.sender === 'user'
                  ? 'bg-purple-600/30 text-purple-100 border border-purple-500/40'
                  : 'bg-surface/90 text-slate-200 border border-slate-700/80'
              }`}
            >
              {m.text}
            </div>

            {/* Spatial Graph Nodes Highlight Pills */}
            {m.graphNodes && m.graphNodes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 pl-1">
                {m.graphNodes.map((n, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800 flex items-center gap-1"
                  >
                    <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preset Query Prompt Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 text-[10px] font-mono">
        <button
          onClick={() => setInputQuery('Explain checkout flow and latency bottlenecks')}
          className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-500 whitespace-nowrap"
        >
          Checkout Bottlenecks
        </button>
        <button
          onClick={() => setInputQuery('Where is technical debt highest?')}
          className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 hover:border-purple-500 whitespace-nowrap"
        >
          Technical Debt
        </button>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          placeholder="Ask AI about architecture or code..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="w-full pl-3 pr-10 py-2 rounded-xl bg-surface border border-purple-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={handleSend}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
