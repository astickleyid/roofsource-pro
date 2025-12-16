import React, { useState } from 'react';
import { Plus, FolderOpen, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const ProjectList = () => {
  const navigate = useNavigate();
  const [projects] = useState([]);

  const handleCreateProject = () => {
    const name = prompt('Enter project name:');
    if (name) {
      const loc = prompt('Enter location:');
      navigate(`/project/new?name=${encodeURIComponent(name)}&loc=${encodeURIComponent(loc || '')}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage your roofing sourcing projects</p>
          </div>
          <Button onClick={handleCreateProject} icon={Plus}>
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <FolderOpen size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    {project.loc}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    {project.createdAt.toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{project.itemCount}</strong> items
                  </span>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{project.vendorCount}</strong> vendors
                  </span>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl flex items-center justify-between group-hover:bg-blue-50 transition-colors">
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  Open Project
                </span>
                <ArrowRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20">
            <FolderOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first sourcing project to get started</p>
            <Button onClick={handleCreateProject} icon={Plus}>
              Create Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
