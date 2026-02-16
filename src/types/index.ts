// src/types/index.ts
export interface Shot {
  id: string;
  shotNumber: number;
  duration: number;    
  type: string;        
  angle: string;       
  movement: string;    
  lighting: string;    
  description: string; 
  t2iPrompt: string;   
  i2vPrompt: string;   
  dialogue: string;    
  audio: string;  
  imageUrl?: string;   // 新增：用于存储本地回填的视觉草图/效果图 (Base64)     
}

export interface Character {
  id: string;
  name: string;
  visualPrompt: string; 
}

export interface Project {
  id: string;
  title: string;
  originalText: string; 
  characters: Character[]; 
  shots: Shot[];
  updatedAt: number;    
}

export interface GenerationParams {
  text: string;
  characters: Character[];
}