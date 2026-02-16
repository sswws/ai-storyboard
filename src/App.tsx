// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 控制台首页 */}
        <Route path="/" element={<Dashboard />} />
        
        {/* 具体项目工作台 */}
        <Route path="/workspace/:id" element={<Workspace />} />
        
        {/* 404 跳转回首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}