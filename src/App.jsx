import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
import { ProjectList } from './components/features/ProjectList';
import RoofSourceProContent from './RoofSourceAI_RFQ_Manager_Refactored';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route
          path="/project/:id"
          element={
            <ProjectProvider>
              <RoofSourceProContent />
            </ProjectProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
