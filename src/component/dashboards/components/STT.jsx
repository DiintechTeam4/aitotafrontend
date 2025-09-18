import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';

const STT = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

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
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      const json = await resp.json();
      if (json?.success) {
        setNewProjectName('');
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

  const viewLogs = async (itemId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/logs`);
      const json = await resp.json();
      if (json?.success) {
        const lines = (json.data || []).map(l => `${new Date(l.at).toLocaleString()} [${l.level}] ${l.message}${l.meta ? ' ' + JSON.stringify(l.meta) : ''}`);
        alert(lines.length ? lines.join('\n') : 'No logs');
      } else {
        alert(json?.message || 'No logs');
      }
    } catch (e) {
      alert(e.message || 'Failed to fetch logs');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-3 py-2 text-sm bg-gray-100 border rounded hover:bg-gray-200">← Back</button>
        <div className="flex items-center gap-2">
          <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name" className="px-3 py-2 border rounded" />
          <button disabled={creating} onClick={createProject} className="px-3 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-60">Create Project</button>
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
              <div className="border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">File</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedProject.items || []).slice().reverse().map((it) => (
                      <tr key={it._id}>
                        <td className="px-3 py-2">{it.originalFilename || it.s3Key.split('/').pop()}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${it.status === 'completed' ? 'bg-green-100 text-green-700' : it.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{it.status}</span>
                        </td>
                        <td className="px-3 py-2 space-x-2">
                          <button className="px-2 py-1 border rounded text-xs" onClick={() => getTranscript(it._id)} disabled={it.status !== 'completed'}>Transcript</button>
                          <button className="px-2 py-1 border rounded text-xs" onClick={() => getQA(it._id)} disabled={it.status !== 'completed'}>Q&A</button>
                          <button className="px-2 py-1 border rounded text-xs" onClick={() => viewLogs(it._id)}>View Logs</button>
                        </td>
                      </tr>
                    ))}
                    {(selectedProject.items || []).length === 0 && (
                      <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={3}>No audio uploaded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Activity Log */}
              <div className="border rounded mt-3">
                <div className="px-3 py-2 bg-gray-50 text-sm font-medium">Activity</div>
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">File</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedProject.items || []).slice().sort((a,b)=> new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt)).map((it) => (
                      <tr key={`log-${it._id}`}>
                        <td className="px-3 py-2">{new Date(it.updatedAt || it.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">{it.originalFilename || it.s3Key.split('/').pop()}</td>
                        <td className="px-3 py-2">{it.status}</td>
                        <td className="px-3 py-2 text-red-600">{it.error ? it.error : '-'}</td>
                      </tr>
                    ))}
                    {(selectedProject.items || []).length === 0 && (
                      <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={4}>No activity yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default STT;


