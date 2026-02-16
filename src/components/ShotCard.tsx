// src/components/ShotCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Video, Type, Music, Trash2, Sparkles, Camera, SunMedium, Copy, Check, Image as ImageIcon, Film, GripVertical, Loader2, UploadCloud } from 'lucide-react';
import type { Shot } from '../types';
import { useStoryboardStore } from '../store/useStoryboardStore';

interface ShotCardProps {
  shot: Shot;
  provided?: any;
}

export const ShotCard: React.FC<ShotCardProps> = ({ shot, provided }) => {
  const { deleteShot, updateShot, regenerateShot, isRegeneratingShot } = useStoryboardStore();
  const [copiedT2I, setCopiedT2I] = useState(false);
  const [copiedI2V, setCopiedI2V] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isRegenerating = isRegeneratingShot === shot.id;

  const handleCopy = (text: string, type: 't2i' | 'i2v') => {
    navigator.clipboard.writeText(text);
    if (type === 't2i') { setCopiedT2I(true); setTimeout(() => setCopiedT2I(false), 2000); } 
    else { setCopiedI2V(true); setTimeout(() => setCopiedI2V(false), 2000); }
  };

  // 处理图片转 Base64 存储
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateShot(shot.id, { imageUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleImageFile(e.target.files[0]);
  };

  // 监听 Ctrl+V 粘贴图片事件 (只在当前卡片聚焦/悬停时生效)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!cardRef.current?.matches(':hover')) return; // 只有鼠标放在这张卡片上时粘贴才生效
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleImageFile(file);
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div 
      ref={(node) => {
        cardRef.current = node;
        if (provided?.innerRef) provided.innerRef(node);
      }}
      {...provided?.draggableProps}
      className={`print-card bg-[#1a1a1a] border border-white/10 rounded-xl p-5 shadow-lg hover:border-white/20 transition-all duration-300 group flex flex-col gap-4 relative ${isRegenerating ? 'overflow-hidden' : ''}`}
    >
      {isRegenerating && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-blue-400 no-print">
          <Loader2 size={32} className="animate-spin mb-2" />
          <span className="text-sm font-medium tracking-wide">AI 正在重新构思此镜头...</span>
        </div>
      )}

      <div {...provided?.dragHandleProps} className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing no-print">
        <GripVertical size={20} />
      </div>

      <div className="flex justify-between items-center border-b border-white/5 pb-3 print-border">
        <div className="flex items-center gap-3">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md text-sm font-bold font-mono print-text-dark">
            Shot {String(shot.shotNumber).padStart(2, '0')}
          </span>
          <span className="text-gray-400 text-sm flex items-center gap-1 print-text-dark"><Video size={14} /> {shot.duration}s</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
          <button onClick={() => regenerateShot(shot.id)} disabled={isRegenerating} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors" title="AI 重新构思此镜头"><Sparkles size={16} /></button>
          <button onClick={() => deleteShot(shot.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors" title="删除镜头"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* 核心排版：左右分栏结构 */}
      <div className="flex gap-5">
        {/* 左侧：视觉图片资产回填区 */}
        <div 
          className="w-48 h-[108px] shrink-0 bg-[#111] border border-dashed border-white/10 hover:border-blue-500/50 rounded-lg overflow-hidden relative group/img cursor-pointer transition-colors flex flex-col items-center justify-center print-border"
          onClick={() => fileInputRef.current?.click()}
          title="点击上传，或鼠标悬停时按 Ctrl+V 粘贴图片"
        >
          {shot.imageUrl ? (
            <>
              <img src={shot.imageUrl} alt="Storyboard Visual" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center no-print">
                <span className="text-xs text-white flex items-center gap-1"><UploadCloud size={14}/> 更换画面</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-600 group-hover/img:text-blue-400 transition-colors no-print">
              <ImageIcon size={24} />
              <span className="text-[10px] text-center px-2">点击或在此处<br/>Ctrl+V 粘贴图片</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>

        {/* 右侧：剧本细节 */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="bg-[#111] border border-white/10 text-gray-300 px-2 py-1 rounded text-xs print-text-dark print-border">景别: {shot.type}</span>
            <span className="bg-[#111] border border-white/10 text-gray-300 px-2 py-1 rounded text-xs flex items-center gap-1 print-text-dark print-border"><Camera size={12}/> {shot.angle}</span>
            <span className="bg-[#111] border border-white/10 text-gray-300 px-2 py-1 rounded text-xs flex items-center gap-1 print-text-dark print-border"><Video size={12}/> {shot.movement}</span>
            <span className="bg-[#111] border border-white/10 text-gray-300 px-2 py-1 rounded text-xs flex items-center gap-1 print-text-dark print-border"><SunMedium size={12}/> {shot.lighting}</span>
          </div>
          <textarea value={shot.description} onChange={(e) => updateShot(shot.id, { description: e.target.value })} className="w-full bg-transparent text-gray-200 print-text-dark text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded p-1 -ml-1 min-h-[50px]" placeholder="画面描述..." />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1 print-hide-prompt">
        <div className="bg-[#111] rounded-lg border border-indigo-500/20 relative group/prompt">
          <div className="absolute top-0 left-0 bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-br-lg rounded-tl-lg font-mono font-bold flex items-center gap-1"><ImageIcon size={10} /> T2I 静态生图</div>
          <textarea value={shot.t2iPrompt} onChange={(e) => updateShot(shot.id, { t2iPrompt: e.target.value })} className="w-full bg-transparent text-indigo-300/80 font-mono text-xs resize-none focus:outline-none p-4 pt-7 min-h-[60px]" />
          <button onClick={() => handleCopy(shot.t2iPrompt, 't2i')} className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md transition-all opacity-0 group-hover/prompt:opacity-100">{copiedT2I ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}</button>
        </div>
        <div className="bg-[#111] rounded-lg border border-teal-500/20 relative group/prompt">
          <div className="absolute top-0 left-0 bg-teal-500/20 text-teal-400 text-[10px] px-2 py-0.5 rounded-br-lg rounded-tl-lg font-mono font-bold flex items-center gap-1"><Film size={10} /> I2V 图生视频</div>
          <textarea value={shot.i2vPrompt} onChange={(e) => updateShot(shot.id, { i2vPrompt: e.target.value })} className="w-full bg-transparent text-teal-300/80 font-mono text-xs resize-none focus:outline-none p-4 pt-7 min-h-[60px]" />
          <button onClick={() => handleCopy(shot.i2vPrompt, 'i2v')} className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md transition-all opacity-0 group-hover/prompt:opacity-100">{copiedI2V ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 print-border">
        <div className="flex items-start gap-2 bg-[#111] print-card p-3 rounded-lg border border-white/5 print-border"><Type size={14} className="text-gray-500 mt-0.5" /><textarea value={shot.dialogue} onChange={(e) => updateShot(shot.id, { dialogue: e.target.value })} className="w-full bg-transparent text-gray-300 print-text-dark text-xs resize-none focus:outline-none h-12" placeholder="台词/旁白..." /></div>
        <div className="flex items-start gap-2 bg-[#111] print-card p-3 rounded-lg border border-white/5 print-border"><Music size={14} className="text-gray-500 mt-0.5" /><textarea value={shot.audio} onChange={(e) => updateShot(shot.id, { audio: e.target.value })} className="w-full bg-transparent text-gray-400 print-text-dark text-xs resize-none focus:outline-none h-12 italic" placeholder="背景音乐/音效..." /></div>
      </div>
    </div>
  );
};