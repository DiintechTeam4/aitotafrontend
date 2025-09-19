import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';

const STT = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('');
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [viewCard, setViewCard] = useState({ open: false, title: '', content: '' });
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');

  const fetchProjects = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await resp.json();
      setProjects(json?.success ? (json.data || []) : []);
    } catch {
      setProjects([]);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      setCreating(true);
      const resp = await fetch(`${API_BASE_URL}/stt/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          name: newProjectName.trim(),
          description: newProjectDescription.trim(),
          category: newProjectCategory.trim()
        }),
      });
      const json = await resp.json();
      if (json?.success) {
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectCategory('');
        setShowCreateCard(false);
        await fetchProjects();
      } else {
        alert(json?.message || 'Failed to create project');
      }
    } catch (e) {
      alert(e.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const refreshSelected = async () => {
    if (!selectedProject?._id) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/projects/${selectedProject._id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await resp.json();
      if (json?.success) setSelectedProject(json.data);
    } catch {}
  };

  const handleUpload = async (file) => {
    if (!selectedProject?._id || !file) return;
    try {
      setUploading(true);
      const presign = await fetch(`${API_BASE_URL}/stt/projects/${selectedProject._id}/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'audio/wav' }),
      }).then(r => r.json());
      if (!presign?.success) throw new Error(presign?.message || 'Presign failed');
      const { key, url } = presign.data;
      await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type || 'audio/wav' }, body: file });
      const reg = await fetch(`${API_BASE_URL}/stt/projects/${selectedProject._id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ s3Key: key, filename: file.name, contentType: file.type || 'audio/wav' }),
      }).then(r => r.json());
      if (!reg?.success) throw new Error(reg?.message || 'Register failed');
      await refreshSelected();
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadByUrl = async (url, fallbackName) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {}
  };

  const getTranscript = async (itemId) => {
    const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
    const json = await resp.json();
    if (json?.success && json.url) downloadByUrl(json.url, 'transcript.txt');
    else alert(json?.message || 'Transcript not ready');
  };

  const getQA = async (itemId) => {
    const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/qa-url`);
    const json = await resp.json();
    if (json?.success && json.url) downloadByUrl(json.url, 'qa.txt');
    else alert(json?.message || 'Q&A not ready');
  };

  // Open transcript in a modal card for viewing
  const viewTranscript = async (itemId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
      const json = await resp.json();
      if (json?.success && json.url) {
        try {
          const r = await fetch(json.url);
          const text = await r.text();
          setViewCard({ open: true, title: 'Transcript', content: text });
        } catch {
          window.open(json.url, '_blank', 'noopener,noreferrer');
        }
      } else {
        alert(json?.message || 'Transcript not ready');
      }
    } catch (e) {
      alert(e.message || 'Failed to open transcript');
    }
  };

  // Open Q&A in a modal card for viewing
  const viewQA = async (itemId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/qa-url`);
      const json = await resp.json();
      if (json?.success && json.url) {
        try {
          const r = await fetch(json.url);
          const text = await r.text();
          setViewCard({ open: true, title: 'Q&A', content: text });
        } catch {
          window.open(json.url, '_blank', 'noopener,noreferrer');
        }
      } else {
        alert(json?.message || 'Q&A not ready');
      }
    } catch (e) {
      alert(e.message || 'Failed to open Q&A');
    }
  };

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === (selectedProject?.items || []).length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set((selectedProject?.items || []).map(item => item._id)));
    }
  };

  const downloadBulkTranscripts = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const transcripts = [];
      for (const itemId of selectedItems) {
        const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
        const json = await resp.json();
        if (json?.success && json.url) {
          const response = await fetch(json.url);
          const text = await response.text();
          const item = selectedProject.items.find(i => i._id === itemId);
          transcripts.push(`=== ${item?.originalFilename || itemId} ===\n${text}\n\n`);
        }
      }
      
      if (transcripts.length > 0) {
        const mergedContent = transcripts.join('');
        const blob = new Blob([mergedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcripts-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert('Failed to download transcripts: ' + e.message);
    }
  };

  const downloadBulkQA = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const qaContents = [];
      for (const itemId of selectedItems) {
        const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/qa-url`);
        const json = await resp.json();
        if (json?.success && json.url) {
          const response = await fetch(json.url);
          const text = await response.text();
          const item = selectedProject.items.find(i => i._id === itemId);
          qaContents.push(`=== ${item?.originalFilename || itemId} ===\n${text}\n\n`);
        }
      }
      
      if (qaContents.length > 0) {
        const mergedContent = qaContents.join('');
        const blob = new Blob([mergedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert('Failed to download Q&A: ' + e.message);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    if (!autoRefresh || !selectedProject?._id) return;
    const id = setInterval(() => {
      refreshSelected();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, selectedProject?._id]);

  // Clear selected items when project changes
  useEffect(() => {
    setSelectedItems(new Set());
  }, [selectedProject?._id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-3 py-2 text-sm bg-gray-100 border rounded hover:bg-gray-200">← Back</button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateCard(true)} className="px-3 py-2 text-sm bg-blue-600 text-white rounded">Create Project</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 border rounded p-3">
          <div className="font-semibold mb-2">Projects</div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {projects.map((p) => (
              <div key={p._id} className={`p-2 border rounded cursor-pointer ${selectedProject?._id === p._id ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'}`} onClick={async () => { setSelectedProject(p); }}>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {projects.length === 0 && <div className="text-sm text-gray-500">No projects yet</div>}
          </div>
        </div>

        <div className="md:col-span-2 border rounded p-3">
          {!selectedProject ? (
            <div className="text-gray-500 text-sm">Select a project to manage uploads</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{selectedProject.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={refreshSelected} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">Refresh</button>
                  <button onClick={() => setAutoRefresh(v => !v)} className={`px-3 py-2 text-sm border rounded ${autoRefresh ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'}`}>{autoRefresh ? 'Auto Refresh: On' : 'Auto Refresh: Off'}</button>
                  <label className="px-3 py-2 text-sm bg-green-600 text-white rounded cursor-pointer">
                    {uploading ? 'Uploading...' : 'Upload Audio'}
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && handleUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>

              {/* Bulk Download Buttons */}
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedItems.size} file{selectedItems.size > 1 ? 's' : ''} selected
                  </span>
                  <button 
                    onClick={downloadBulkTranscripts}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Download All Transcripts
                  </button>
                  <button 
                    onClick={downloadBulkQA}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Download All Q&A
                  </button>
                </div>
              )}
              <div className="border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === (selectedProject?.items || []).length && (selectedProject?.items || []).length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left">File</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedProject.items || []).slice().reverse().map((it) => (
                      <tr key={it._id} className={selectedItems.has(it._id) ? 'bg-blue-50' : ''}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(it._id)}
                            onChange={() => handleItemSelect(it._id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2">{it.originalFilename || it.s3Key.split('/').pop()}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${it.status === 'completed' ? 'bg-green-100 text-green-700' : it.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{it.status}</span>
                        </td>
                        <td className="px-3 py-2 space-x-2">
                          <button
                            className="px-2 py-1 border rounded text-xs"
                            onClick={() => viewTranscript(it._id)}
                            disabled={it.status !== 'completed'}
                          >
                            View Transcript
                          </button>
                          <button
                            className="px-2 py-1 border rounded text-xs"
                            onClick={() => viewQA(it._id)}
                            disabled={it.status !== 'completed'}
                          >
                            View Q&A
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(selectedProject.items || []).length === 0 && (
                      <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={4}>No audio uploaded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Create Project Card */}
      {showCreateCard && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Create Project</div>
              <button className="text-gray-500" onClick={() => setShowCreateCard(false)}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Project Name</label>
                <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Enter project name" />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} className="w-full px-3 py-2 border rounded" rows={3} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm mb-1">Category</label>
                <input value={newProjectCategory} onChange={(e) => setNewProjectCategory(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Optional category" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="px-3 py-2 text-sm border rounded" onClick={() => setShowCreateCard(false)}>Cancel</button>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-60" disabled={creating} onClick={createProject}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Card for Transcript / Q&A */}
      {viewCard.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded shadow-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{viewCard.title}</div>
              <button className="text-gray-500" onClick={() => setViewCard({ open: false, title: '', content: '' })}>✕</button>
            </div>
            <div className="flex-1 overflow-auto whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50">
              {viewCard.content || 'No content'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default STT;


