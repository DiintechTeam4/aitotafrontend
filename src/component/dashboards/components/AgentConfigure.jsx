import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';

const AgentConfigure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const agentId = params.get('agentId');

  const [loading, setLoading] = useState(false);
  const [agentMeta, setAgentMeta] = useState({ agentName: '', didNumbers: [''] });
  const [items, setItems] = useState([{ n: 1, g: 1, rSec: 5 }]);
  const [mode, setMode] = useState('serial');
  const gOptions = useMemo(() => [1,2,3,4,5], []);
  const rOptions = useMemo(() => [5,10,20,30,60], []);
  const [docId, setDocId] = useState(null);

  useEffect(() => {
    if (!agentId) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken') || sessionStorage.getItem('clienttoken');
        const metaResp = await fetch(`${API_BASE_URL}/admin/all-agents`, { headers: { Authorization: `Bearer ${token}` }});
        const metaJson = await metaResp.json().catch(() => ({}));
        if (metaJson?.success && Array.isArray(metaJson.data)) {
          const a = metaJson.data.find(x => String(x._id) === String(agentId));
          if (a) {
            const didNumbers = a.didNumber ? [a.didNumber] : [''];
            setAgentMeta({ agentName: a.agentName || '', didNumbers });
          }
        }
        const resp = await fetch(`${API_BASE_URL}/admin/agent-config?agentId=${agentId}`);
        const json = await resp.json().catch(() => ({}));
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const row = json.data[0];
          setDocId(row._id);
          if (row.mode === 'serial' || row.mode === 'parallel') setMode(row.mode);
          const didNumbers = row.didNumbers && Array.isArray(row.didNumbers) && row.didNumbers.length 
            ? row.didNumbers 
            : (row.didNumber ? [row.didNumber] : agentMeta.didNumbers);
          setAgentMeta({ 
            agentName: row.agentName || agentMeta.agentName, 
            didNumbers 
          });
          setItems(Array.isArray(row.items) && row.items.length ? row.items : [{ n: 1, g: 1, rSec: 5 }]);
        }
      } catch {}
      setLoading(false);
    })();
  }, [agentId]);

  const addItem = () => setItems(prev => [...prev, { n: 1, g: 1, rSec: 5, isDefault: prev.length === 0 }]);
  const updateItem = (idx, field, value) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const setDefault = (idx) => setItems(prev => prev.map((it, i) => ({ ...it, isDefault: i === idx })));

  const addDidNumber = () => setAgentMeta(prev => ({ ...prev, didNumbers: [...prev.didNumbers, ''] }));
  const updateDidNumber = (idx, value) => setAgentMeta(prev => ({
    ...prev,
    didNumbers: prev.didNumbers.map((num, i) => i === idx ? value : num)
  }));
  const removeDidNumber = (idx) => {
    if (agentMeta.didNumbers.length > 1) {
      setAgentMeta(prev => ({ ...prev, didNumbers: prev.didNumbers.filter((_, i) => i !== idx) }));
    }
  };

  const save = async () => {
    if (!agentId) return;
    const payload = { 
      agentId, 
      items: items.map(it => ({ n: 1, g: Number(it.g)||1, rSec: Number(it.rSec)||5 })),
      mode: mode === 'serial' ? 'serial' : 'parallel',
      didNumbers: agentMeta.didNumbers.filter(num => num.trim() !== '')
    };
    const method = docId ? 'PUT' : 'POST';
    const url = docId ? `${API_BASE_URL}/admin/agent-config/${docId}` : `${API_BASE_URL}/admin/agent-config`;
    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await resp.json().catch(() => ({}));
    if (json?.success) {
      alert('Saved');
      if (!docId && json.data?._id) setDocId(json.data._id);
    } else {
      alert(json?.message || 'Save failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Go Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campaign Configuration</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage your agent campaign settings</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading configuration...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Agent Info Card - Side by Side Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                Agent Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Agent Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Agent Name
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-base font-medium text-gray-900">
                        {agentMeta.agentName || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Execution Mode
                    </label>
                    <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                        mode === 'serial'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>
                        <input 
                          type="radio" 
                          name="mode" 
                          checked={mode === 'serial'} 
                          onChange={() => setMode('serial')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">Mode-S</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                        mode === 'parallel'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>
                        <input 
                          type="radio" 
                          name="mode" 
                          checked={mode === 'parallel'} 
                          onChange={() => setMode('parallel')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">Mode-P</span>
                      </label>
                      
                    </div>
                  </div>
                </div>

                {/* Right Column - DID Numbers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      DID Numbers
                    </label>
                    <button 
                      onClick={addDidNumber}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add DID
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {agentMeta.didNumbers.map((did, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={did}
                          onChange={(e) => updateDidNumber(idx, e.target.value)}
                          placeholder="Enter DID number"
                          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                        {agentMeta.didNumbers.length > 1 && (
                          <button
                            onClick={() => removeDidNumber(idx)}
                            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuration Items</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="font-medium">N:</span> Calls at a time • 
                    <span className="font-medium"> G:</span> Gap • 
                    <span className="font-medium"> R:</span> Rest time
                  </p>
                </div>
                <button 
                  onClick={addItem} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((it, idx) => (
                  <div 
                    key={idx} 
                    className={`relative rounded-lg p-5 transition-all ${
                      it.isDefault 
                        ? 'bg-green-50 border-2 border-green-500' 
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {it.isDefault && (
                      <div className="absolute -top-3 right-4 flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        DEFAULT
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      {/* N field - 2 columns */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          N (Calls)
                        </label>
                        <input 
                          value={1} 
                          readOnly 
                          className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 font-medium cursor-not-allowed"
                        />
                      </div>
                      
                      {/* G field - 3 columns */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          G (Gap)
                        </label>
                        <select 
                          value={it.g} 
                          onChange={e => updateItem(idx, 'g', Number(e.target.value))} 
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                          {gOptions.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      
                      {/* R field - 3 columns */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          R (Rest Time)
                        </label>
                        <select 
                          value={it.rSec} 
                          onChange={e => updateItem(idx, 'rSec', Number(e.target.value))} 
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                          {rOptions.map(v => <option key={v} value={v}>{v}s</option>)}
                        </select>
                      </div>
                      
                      {/* Actions - 4 columns */}
                      <div className="md:col-span-4 flex gap-2">
                        <button
                          onClick={() => setDefault(idx)}
                          disabled={it.isDefault}
                          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                            it.isDefault
                              ? 'bg-green-600 text-white cursor-default'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {it.isDefault ? 'Default' : 'Set Default'}
                        </button>
                        <button 
                          onClick={() => removeItem(idx)} 
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button 
                onClick={save}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Configuration
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentConfigure;