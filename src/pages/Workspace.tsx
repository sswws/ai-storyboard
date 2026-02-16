// src/pages/Workspace.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { InputPanel } from '../components/InputPanel';
import { ShotCard } from '../components/ShotCard';
import { useStoryboardStore } from '../store/useStoryboardStore';
import { Download, Clapperboard, Loader2, Copy, Check, PenLine, Scissors, Save, X, Home, CloudLightning, FileArchive, Printer, ChevronRight, HardDriveDownload } from 'lucide-react';

export const Workspace: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, activeProjectId, setActiveProject, updateProjectTitle, addShot, reorderShots, isGenerating } = useStoryboardStore();
  
  const [copiedAll, setCopiedAll] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  useEffect(() => { 
    if (id && id !== activeProjectId) setActiveProject(id); 
  }, [id, activeProjectId, setActiveProject]);
  
  const currentProject = projects.find(p => p.id === id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentProject) {
          setSaveTitle(currentProject.title);
          setIsSaveModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  if (!currentProject) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">项目加载中...</div>;

  const shots = currentProject.shots;

  const handleConfirmSave = () => {
    if (saveTitle.trim()) updateProjectTitle(currentProject.id, saveTitle.trim());
    setIsSaveModalOpen(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    reorderShots(result.source.index, result.destination.index);
  };

  const handleExportCSV = () => {
    if (!shots.length) return;
    const headers = ['镜号', '预估时长(秒)', '景别', '摄影机角度', '运镜', '光影设计', '画面描述', 'T2I生图提示词', 'I2V视频动态提示词', '台词/旁白', '背景音乐'];
    const rows = shots.map(s => [ s.shotNumber, s.duration, s.type, s.angle, s.movement, s.lighting, `"${s.description.replace(/"/g, '""')}"`, `"${s.t2iPrompt.replace(/"/g, '""')}"`, `"${s.i2vPrompt.replace(/"/g, '""')}"`, `"${s.dialogue.replace(/"/g, '""')}"`, `"${s.audio.replace(/"/g, '""')}"` ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `${currentProject.title}_分镜表.csv`;
    link.click();
  };

  const handleExportEDL = () => {
    if (!shots.length) return;
    const fps = 25; 
    let currentFrame = 0;
    const framesToTimecode = (totalFrames: number) => {
      const h = Math.floor(totalFrames / (3600 * fps));
      const m = Math.floor((totalFrames % (3600 * fps)) / (60 * fps));
      const s = Math.floor((totalFrames % (60 * fps)) / fps);
      const f = totalFrames % fps;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    };

    let edlContent = `TITLE: ${currentProject.title.toUpperCase()}\nFCM: NON-DROP FRAME\n\n`;
    shots.forEach((shot, index) => {
      const durationFrames = shot.duration * fps;
      const startTC = framesToTimecode(currentFrame);
      const endTC = framesToTimecode(currentFrame + durationFrames);
      const eventNum = String(index + 1).padStart(3, '0');
      edlContent += `${eventNum}  AX       V     C        00:00:00:00 00:00:${String(shot.duration).padStart(2, '0')}:00 ${startTC} ${endTC}\n`;
      edlContent += `* FROM CLIP NAME: Shot ${shot.shotNumber} - ${shot.type}\n`;
      edlContent += `* COMMENT: ${shot.description.substring(0, 50).replace(/\n/g, ' ')}...\n\n`;
      currentFrame += durationFrames;
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([edlContent], { type: 'text/plain;charset=utf-8;' }));
    link.download = `${currentProject.title}_剪辑序列.edl`;
    link.click();
  };

  const handleCopyAllPrompts = () => {
    if (!shots.length) return;
    const allPrompts = shots.map(s => `【镜头 ${s.shotNumber}】\n[生图]: ${s.t2iPrompt}\n[动态]: ${s.i2vPrompt}\n`).join('\n');
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true); setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleExportProjectFile = () => {
    const jsonString = JSON.stringify(currentProject, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json;charset=utf-8;' }));
    link.download = `${currentProject.title}.lenscore`;
    link.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // 样式预设
  const btnBase = "px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none";
  const btnGhost = `${btnBase} text-gray-400 hover:text-white hover:bg-white/10`;
  const btnPrimaryLight = (color: string) => `${btnBase} bg-${color}-500/10 text-${color}-400 hover:bg-${color}-500/20 hover:text-${color}-300`;

  return (
    <div className="h-screen bg-[#0a0a0a] text-gray-100 flex overflow-hidden font-sans relative">
      
      {/* 弹窗遮罩层：保存项目 */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-[#141414] border border-white/10 p-6 rounded-2xl shadow-2xl w-[400px] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><Save size={18} className="text-blue-400" /> 保存 / 重命名工程</h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">项目名称</label>
              <input autoFocus value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()} className="w-full bg-[#0a0a0a] border border-white/10 focus:border-blue-500 rounded-xl p-3 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all" placeholder="给这个草稿起个名字吧..." />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">取消</button>
              <button onClick={handleConfirmSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20">确认保存</button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print h-full"><InputPanel /></div>
      
      <main className="flex-1 h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] to-[#111111] overflow-hidden">
        
        {/* === 顶部双层工具栏 === */}
        <div className="flex flex-col border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl z-10 shrink-0 no-print">
          
          {/* 第一排：项目层控制 (导航、标题、工程文件) */}
          <header className="h-[60px] px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all text-sm font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg group">
                <Home size={15} /> 
                <span>控制台</span>
              </button>
              <ChevronRight size={14} className="text-gray-700" />
              
              <div className="flex items-center gap-3 ml-1">
                {isEditingTitle ? (
                  <input autoFocus value={currentProject.title} onChange={(e) => updateProjectTitle(currentProject.id, e.target.value)} onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)} className="bg-transparent text-lg font-bold text-white border-b-2 border-blue-500 focus:outline-none w-64 py-0.5" />
                ) : (
                  <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2 cursor-text hover:text-white transition-colors" onClick={() => setIsEditingTitle(true)}>
                    {currentProject.title} 
                    <PenLine size={14} className="text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </h2>
                )}
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CloudLightning size={12} /> 实时同步
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => { setSaveTitle(currentProject.title); setIsSaveModalOpen(true); }} className={btnGhost} title="重命名草稿 (Ctrl+S)">
                <Save size={15} /> 重命名
              </button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={handleExportProjectFile} className={btnGhost} title="打包为独立文件，便于传输或备份">
                <FileArchive size={15} className="text-purple-400" /> 导出工程 (.lenscore)
              </button>
            </div>
          </header>

          {/* 第二排：资产层控制 (数据统计、渲染交付物导出) */}
          <div className="h-[52px] px-8 flex justify-between items-center bg-white/[0.01] border-t border-white/5">
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <div className="flex items-center gap-1.5 bg-[#111] px-3 py-1.5 rounded-md border border-white/5">
                <Clapperboard size={13} className="text-gray-400" />
                共 {shots.length} 镜
              </div>
              <div className="flex items-center gap-1.5 bg-[#111] px-3 py-1.5 rounded-md border border-white/5">
                <Loader2 size={13} className="text-gray-400" />
                预估总长 {shots.reduce((a, c) => a + c.duration, 0)} 秒
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 mr-2 font-medium">交付导出：</span>
              
              <button onClick={handleCopyAllPrompts} disabled={!shots.length} className={btnPrimaryLight('blue')}>
                {copiedAll ? <Check size={14} /> : <Copy size={14} />} {copiedAll ? "已复制" : "一键提取 Prompt"}
              </button>
              
              <button onClick={handleExportCSV} disabled={!shots.length} className={btnGhost}>
                <Download size={14} /> CSV 表格
              </button>
              
              <button onClick={handleExportEDL} disabled={!shots.length} className={btnPrimaryLight('indigo')} title="可直接拖入 Pr/达芬奇 生成空轨">
                <Scissors size={14} /> EDL 剪辑序列
              </button>
              
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              
              <button onClick={handlePrintPDF} disabled={!shots.length} className="px-3.5 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none shadow-sm">
                <Printer size={14} /> 打印 PDF 报表
              </button>
            </div>
          </div>

        </div>
        {/* === 双层工具栏 结束 === */}

        <div className="flex-1 overflow-y-auto p-10 pl-16 pb-32">
          {/* PDF 打印时专属的标题展示 */}
          <div className="hidden print:block mb-8 text-black border-b border-gray-300 pb-4">
            <h1 className="text-3xl font-bold">{currentProject.title}</h1>
            <p className="text-sm text-gray-600 mt-2">共 {shots.length} 镜 · 预估总时长 {shots.reduce((a, c) => a + c.duration, 0)} 秒</p>
          </div>

          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {isGenerating && (
              <div className="flex flex-col items-center py-32 text-blue-400 opacity-80 no-print"><Loader2 size={48} className="animate-spin mb-4" /><p className="text-lg font-medium">引擎正在运算视觉轨迹...</p></div>
            )}
            {!isGenerating && !shots.length && (
              <div className="flex flex-col items-center py-32 text-gray-600 no-print"><Clapperboard size={64} className="mb-4 opacity-20" /><h3 className="text-xl font-semibold text-gray-400">项目渲染队列为空</h3></div>
            )}
            
            {!isGenerating && shots.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="board">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-6">
                      {shots.map((shot, index) => (
                        <Draggable key={shot.id} draggableId={shot.id} index={index}>
                          {(provided) => (
                            <ShotCard shot={shot} provided={provided} />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {!isGenerating && shots.length > 0 && (
              <button onClick={() => addShot({ id: Math.random().toString(36).substring(2, 9), shotNumber: shots.length + 1, duration: 3, type: '中景', angle: '平视', movement: '固定', lighting: '自然光', description: '', t2iPrompt: '', i2vPrompt: '', dialogue: '', audio: '' })} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-gray-500 hover:text-gray-300 hover:border-blue-500/50 hover:bg-white/5 transition-all text-sm font-medium no-print">
                + 插入空白机位 (手动编辑)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};