// src/components/InputPanel.tsx
import React, { useRef, useState } from 'react';
import { Sparkles, Paperclip, FileText, X, Film, ChevronLeft, UserPlus, Users } from 'lucide-react';
import { useStoryboardStore } from '../store/useStoryboardStore';
import { useNavigate } from 'react-router-dom';

export const InputPanel: React.FC = () => {
  const navigate = useNavigate();
  const { projects, activeProjectId, updateActiveProjectText, addCharacter, updateCharacter, deleteCharacter, generateStoryboard, isGenerating } = useStoryboardStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'characters'>('script'); // 多 Tab 切换
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProject = projects.find(p => p.id === activeProjectId);
  const inputText = currentProject?.originalText || '';
  const characters = currentProject?.characters || [];

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) setAttachedFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) setAttachedFile(e.target.files[0]); };
  const removeFile = () => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleAddCharacter = () => {
    addCharacter({ id: Math.random().toString(36).substring(2, 9), name: '', visualPrompt: '' });
  };

  return (
    <aside className="w-[420px] bg-[#0f0f0f] border-r border-white/10 flex flex-col h-screen shrink-0">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film size={20} className="text-blue-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">LensCore 引擎</h1>
        </div>
        <button onClick={() => navigate('/')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><ChevronLeft size={18} /></button>
      </div>

      <div className="flex px-6 pt-4 gap-4 border-b border-white/10">
        <button onClick={() => setActiveTab('script')} className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'script' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>剧本文案</button>
        <button onClick={() => setActiveTab('characters')} className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'characters' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          <Users size={14} /> 角色资产 ({characters.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {activeTab === 'script' ? (
          <div className="flex flex-col flex-1 gap-2 h-full">
            <div 
              className={`relative flex flex-col flex-1 bg-[#1a1a1a] border rounded-xl overflow-hidden transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 focus-within:border-blue-500/50'}`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              {isDragging && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a1a1a]/80 border-2 border-dashed border-blue-500"><Sparkles size={18} className="text-blue-400"/></div>}
              <textarea value={inputText} onChange={(e) => updateActiveProjectText(e.target.value)} placeholder="在此输入文案或大纲..." className="flex-1 w-full bg-transparent p-4 text-sm text-gray-200 resize-none focus:outline-none leading-relaxed" />
              {attachedFile && (
                <div className="px-4 pb-2">
                  <div className="flex items-center justify-between bg-[#222] border border-white/5 rounded-lg p-2 pr-3">
                    <span className="text-xs text-gray-300 truncate"><FileText size={14} className="inline mr-2 text-blue-400"/>{attachedFile.name}</span>
                    <button onClick={removeFile} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-3 border-t border-white/5 bg-[#141414]">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400"><Paperclip size={14} /> 挂载文件</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              提前锁定角色的视觉特征（如：1boy, white hair, ancient chinese clothes...）。<br/>生成分镜时，引擎会自动将特征词缝合进对应镜头的 T2I Prompt 中。
            </p>
            {characters.map((char) => (
              <div key={char.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 flex flex-col gap-2 relative group">
                <button onClick={() => deleteCharacter(char.id)} className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                <input value={char.name} onChange={(e) => updateCharacter(char.id, { name: e.target.value })} placeholder="角色名 (如: 林渊)" className="bg-transparent text-sm font-semibold text-gray-200 border-b border-white/10 pb-1 focus:outline-none focus:border-indigo-500 w-[90%]" />
                <textarea value={char.visualPrompt} onChange={(e) => updateCharacter(char.id, { visualPrompt: e.target.value })} placeholder="英文视觉特征词 (如: 1boy, handsome, ancient chinese clothes...)" className="bg-black/20 text-xs font-mono text-indigo-300/80 rounded p-2 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 mt-1" />
              </div>
            ))}
            <button onClick={handleAddCharacter} className="py-3 border-2 border-dashed border-indigo-500/30 text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
              <UserPlus size={16} /> 添加角色资产
            </button>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-[#0f0f0f] shrink-0">
        <button onClick={generateStoryboard} disabled={isGenerating || !inputText.trim()} className={`w-full font-medium py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-blue-800 text-blue-300' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:bg-gray-700'}`}>
          {isGenerating ? "引擎正运算镜头轨迹..." : <><Sparkles size={18} /> 执行机位拆解</>}
        </button>
      </div>
    </aside>
  );
};