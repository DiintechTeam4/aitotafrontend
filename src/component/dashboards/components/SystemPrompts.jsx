import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';

const SystemPrompts = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');

  const loadItems = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/admin/system-prompts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.success) setItems(data.data || []);
    } catch (_) {}
  };

  useEffect(() => { loadItems(); }, []);

  const createItem = async () => {
    if (!title.trim() || !promptText.trim()) return alert('Title and Prompt are required');
    setLoading(true);
    try {
      if (editingId) {
        const resp = await fetch(`${API_BASE_URL}/admin/system-prompts/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, promptText, isDefault }),
        });
        const data = await resp.json();
        if (!data.success) return alert(data.message || 'Failed to update');
      } else {
        const resp = await fetch(`${API_BASE_URL}/admin/system-prompts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, promptText, isDefault }),
        });
        const data = await resp.json();
        if (!data.success) return alert(data.message || 'Failed to create');
      }
      setTitle('');
      setPromptText('');
      setIsDefault(false);
      setEditingId(null);
      loadItems();
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (id) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/admin/system-prompts/${id}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.success) loadItems();
    } catch (_) {}
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this system prompt?')) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/admin/system-prompts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.success) loadItems();
    } catch (_) {}
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title || '');
    setPromptText(item.promptText || '');
    setIsDefault(!!item.isDefault);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setPromptText('');
    setIsDefault(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard?tab=AI%20Agent')} className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50">Back</button>
          <h2 className="text-2xl font-bold text-gray-900">System Prompts</h2>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 max-w-md">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by title or text..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Short name"/>
          </div>
          <div className="flex items-center gap-2 mt-6 md:mt-0">
            <input id="isDefault" type="checkbox" checked={isDefault} onChange={(e)=>setIsDefault(e.target.checked)} />
            <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default</label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
            <textarea value={promptText} onChange={(e)=>setPromptText(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter full system prompt..."/>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <button onClick={cancelEdit} disabled={loading} className="px-4 py-2 border rounded-md disabled:opacity-50">Cancel</button>
          )}
          <button onClick={createItem} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">{loading? 'Saving...' : editingId ? 'Update Prompt' : 'Add Prompt'}</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.filter(it => {
              const q = (search || '').toLowerCase();
              if (!q) return true;
              return (
                (it.title || '').toLowerCase().includes(q) ||
                (it.promptText || '').toLowerCase().includes(q)
              );
            }).map(it => (
              <tr key={it._id}>
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{it.title}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{it.promptText}</div>
                </td>
                <td className="px-6 py-3">
                  {it.isDefault ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">Default</span>
                  ) : (
                    <button onClick={()=>setDefault(it._id)} className="px-2 py-1 text-xs border rounded">Set Default</button>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={()=>startEdit(it)} className="px-3 py-1 mr-2 text-sm text-gray-700 hover:bg-gray-50 rounded">Edit</button>
                  <button onClick={()=>removeItem(it._id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-6 text-center text-gray-500">No prompts yet. Create one above.</div>
        )}
      </div>
    </div>
  );
};

export default SystemPrompts;


