// src/pages/Dashboard.tsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryboardStore } from '../store/useStoryboardStore';
import { Film, Plus, Clock, Trash2, FolderOpen } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setActiveProject, importProject } = useStoryboardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    const newId = createProject();
    navigate(`/workspace/${newId}`);
  };

  const handleOpenProject = (id: string) => {
    setActiveProject(id);
    navigate(`/workspace/${id}`);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 处理项目文件导入
  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // 简单的格式校验
        if (json && json.title && Array.isArray(json.shots)) {
          importProject(json);
          // 导入后直接跳转进去
          navigate(`/workspace/${json.id}`);
        } else {
          alert("文件格式不正确，无法解析为 LensCore 工程文件。");
        }
      } catch (error) {
        alert("读取文件失败，文件可能已损坏。");
      }
    };
    reader.readAsText(file);
    // 清空 input 缓存
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-10 font-sans flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 rounded-xl"><Film size={28} className="text-blue-400" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">LensCore 控制台</h1>
            <p className="text-sm text-gray-500 mt-1">管理您的 AI 影视工业资产</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-gray-300 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
          >
            <FolderOpen size={18} /> 导入工程
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportProject} 
            accept=".lenscore,.json" 
            className="hidden" 
          />
          <button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(59,130,246,0.2)]"
          >
            <Plus size={18} /> 新建工程
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map(project => (
          <div 
            key={project.id} 
            className="bg-[#141414] border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all group hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] relative"
            onClick={() => handleOpenProject(project.id)}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
              className="absolute top-4 right-4 p-2 bg-black/50 text-gray-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              title="删除工程"
            >
              <Trash2 size={16} />
            </button>

            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-2">
              <Film size={20} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-200 truncate pr-8">{project.title}</h3>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <Clock size={12} /> 更新于 {formatDate(project.updatedAt)}
              </p>
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-1 rounded">
                共 {project.shots.length} 镜
              </span>
              <span className="text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                进入工作台 &rarr;
              </span>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-3xl">
            <Film size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">还没有任何工程项目</p>
            <p className="text-sm mt-1">点击右上角新建，或者导入本地的 .lenscore 工程文件</p>
          </div>
        )}
      </main>
    </div>
  );
};