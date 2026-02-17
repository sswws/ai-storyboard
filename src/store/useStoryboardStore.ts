// src/store/useStoryboardStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shot, Project, Character } from '../types';

interface StoryboardState {
  projects: Project[];
  activeProjectId: string | null;
  isGenerating: boolean;
  isRegeneratingShot: string | null; 
  
  createProject: () => string;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  updateProjectTitle: (id: string, title: string) => void;
  updateActiveProjectText: (text: string) => void;
  importProject: (project: Project) => void; // 新增：导入外部工程

  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updatedData: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  addShot: (shot: Shot) => void;
  updateShot: (id: string, updatedData: Partial<Shot>) => void;
  deleteShot: (id: string) => void;
  reorderShots: (startIndex: number, endIndex: number) => void;
  
  generateStoryboard: () => Promise<void>;
  regenerateShot: (shotId: string) => Promise<void>; 
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStoryboardStore = create<StoryboardState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isGenerating: false,
      isRegeneratingShot: null,

      createProject: () => {
        const newProject: Project = { id: generateId(), title: '未命名草稿', originalText: '', characters: [], shots: [], updatedAt: Date.now() };
        set((state) => ({ projects: [newProject, ...state.projects], activeProjectId: newProject.id }));
        return newProject.id;
      },
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter(p => p.id !== id), activeProjectId: state.activeProjectId === id ? null : state.activeProjectId })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      updateProjectTitle: (id, title) => set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, title, updatedAt: Date.now() } : p) })),
      updateActiveProjectText: (text) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, originalText: text, updatedAt: Date.now() } : p) })),
      
      // 新增：处理外部工程文件的导入
      importProject: (project) => set((state) => {
        // 如果 ID 冲突，生成新 ID 避免覆盖
        const exists = state.projects.find(p => p.id === project.id);
        const finalProject = exists ? { ...project, id: generateId(), title: `${project.title} (导入副本)` } : project;
        return {
          projects: [finalProject, ...state.projects],
          activeProjectId: finalProject.id
        };
      }),

      addCharacter: (char) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, characters: [...p.characters, char], updatedAt: Date.now() } : p) })),
      updateCharacter: (id, data) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, characters: p.characters.map(c => c.id === id ? { ...c, ...data } : c), updatedAt: Date.now() } : p) })),
      deleteCharacter: (id) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, characters: p.characters.filter(c => c.id !== id), updatedAt: Date.now() } : p) })),
      addShot: (shot) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, shots: [...p.shots, shot], updatedAt: Date.now() } : p) })),
      updateShot: (id, updatedData) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, shots: p.shots.map(shot => shot.id === id ? { ...shot, ...updatedData } : shot), updatedAt: Date.now() } : p) })),
      deleteShot: (id) => set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, shots: p.shots.filter(shot => shot.id !== id).map((s, idx) => ({ ...s, shotNumber: idx + 1 })), updatedAt: Date.now() } : p) })),
      reorderShots: (startIndex, endIndex) => set((state) => ({
        projects: state.projects.map(p => {
          if (p.id !== state.activeProjectId) return p;
          const result = Array.from(p.shots);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { ...p, shots: result.map((s, index) => ({ ...s, shotNumber: index + 1 })), updatedAt: Date.now() };
        })
      })),

      generateStoryboard: async () => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const currentProject = projects.find(p => p.id === activeProjectId);
        if (!currentProject || !currentProject.originalText.trim()) return alert("请输入文案内容！");

        set({ isGenerating: true });
        try {
          const response = await fetch('/api/generate-storyboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentProject.originalText, characters: currentProject.characters })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || `请求失败`);
          
          const finalShots: Shot[] = data.shots.map((shot: any) => ({ ...shot, id: generateId() }));
          set((state) => ({ projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, shots: finalShots, updatedAt: Date.now() } : p) }));
        } catch (error: any) { alert(`生成失败: ${error.message}`); } 
        finally { set({ isGenerating: false }); }
      },

      regenerateShot: async (shotId: string) => {
        const { activeProjectId, projects, updateShot } = get();
        if (!activeProjectId) return;
        const currentProject = projects.find(p => p.id === activeProjectId);
        if (!currentProject) return;
        
        const targetShot = currentProject.shots.find(s => s.id === shotId);
        if (!targetShot) return;

        set({ isRegeneratingShot: shotId });
        try {
          const response = await fetch('/api/regenerate-shot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: currentProject.originalText, characters: currentProject.characters, shotData: targetShot })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || `请求失败`);
          updateShot(shotId, data);
        } catch (error: any) { alert(`重写失败: ${error.message}`); } 
        finally { set({ isRegeneratingShot: null }); }
      }
    }),
    { name: 'lenscore-storage' }
  )
);