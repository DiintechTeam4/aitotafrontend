import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';

const STT = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('');
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [viewCard, setViewCard] = useState({ open: false, title: '', content: '' });
  const [viewAsChat, setViewAsChat] = useState(false);
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

  const downloadTextAsPdf = (filename, text) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    let cursorY = margin;

    const safe = sanitizeText(text);
    const lines = doc.splitTextToSize(safe, usableWidth);
    lines.forEach((line) => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
    doc.save(filename);
  };

  const sanitizeText = (raw) => {
    if (!raw) return '';
    // Normalize Unicode to compose characters properly for Indic scripts
    let s = String(raw).normalize('NFC');
    // Replace any characters outside permitted ranges with a space.
    // Allowed: tabs/newlines, Basic Latin, Latin-1, General Punctuation, Devanagari, Devanagari Extended
    s = s.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2000-\u206F\u0900-\u097F\uA8E0-\uA8FF]/g, ' ');
    // Remove remaining C0/C1 controls (except \n, \r, \t which we already kept)
    s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ');
    // Collapse excessive whitespace
    s = s.replace(/[\t\f\v]+/g, ' ')
         .replace(/\s{2,}/g, ' ')
         .replace(/ *(\n|\r\n) */g, '$1')
         .trim();
    return s;
  };

  const downloadModalAsPdf = async (title) => {
    try {
      const el = document.getElementById('stt-modal-content');
      if (!el) return;
      const opt = {
        margin:       10,
        filename:     `${String(title || 'content').toLowerCase().replace(/\s+/g,'-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  {
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc) => {
            const node = clonedDoc.getElementById('stt-modal-content');
            if (!node) return;
            // 1) Strip external stylesheets and style tags to avoid unsupported CSS like oklch()
            const links = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"], style'));
            links.forEach(l => l.parentNode && l.parentNode.removeChild(l));
            // 2) Apply safe font for Hindi and multilingual text
            node.style.fontFamily = "'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', Arial, sans-serif";
            // 3) Force safe inline styles for all descendants (colors, borders, shadows)
            const all = node.querySelectorAll('*');
            all.forEach((n) => {
              const cn = n.className || '';
              // Text color
              n.style.color = '#111111';
              // Backgrounds
              if (typeof cn === 'string' && cn.includes('bg-indigo-600')) {
                n.style.backgroundColor = '#4f46e5';
                n.style.color = '#ffffff';
              } else if (typeof cn === 'string' && cn.includes('bg-white')) {
                n.style.backgroundColor = '#ffffff';
              } else if (typeof cn === 'string' && cn.includes('bg-gray-50')) {
                n.style.backgroundColor = '#f9fafb';
              } else if (!n.style.backgroundColor) {
                n.style.backgroundColor = 'transparent';
              }
              // Borders and outlines
              n.style.borderColor = n.style.borderColor || '#e5e7eb';
              n.style.outlineColor = '#e5e7eb';
              // Remove box-shadows that might use unsupported color functions
              n.style.boxShadow = 'none';
            });
          }
        },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().from(el).set(opt).save();
    } catch (e) {
      alert(e.message || 'Failed to generate PDF');
    }
  };

  const downloadTranscriptPdf = async (itemId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
      const json = await resp.json();
      if (json?.success && json.url) {
        const r = await fetch(json.url);
        const text = await r.text();
        downloadTextAsPdf('transcript.pdf', text);
      } else {
        alert(json?.message || 'Transcript not ready');
      }
    } catch (e) {
      alert(e.message || 'Failed to download PDF');
    }
  };

  const downloadQAPdf = async (itemId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/qa-url`);
      const json = await resp.json();
      if (json?.success && json.url) {
        const r = await fetch(json.url);
        const text = await r.text();
        downloadTextAsPdf('qa.pdf', text);
      } else {
        alert(json?.message || 'Q&A not ready');
      }
    } catch (e) {
      alert(e.message || 'Failed to download PDF');
    }
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
          setViewAsChat(true);
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
          setViewAsChat(false);
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

  const splitIntoChatTurns = (raw) => {
    const text = sanitizeText(raw);
    if (!text) return [];
    // Split into sentences on ., ?, !, Hindi danda ।
    const sentences = text
      .split(/(?<=[\.\?\!\u0964])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    const turns = [];
    let buffer = [];
    let speakerIndex = 0; // 0 -> Speaker A, 1 -> Speaker B
    sentences.forEach((s, idx) => {
      buffer.push(s);
      const isBoundary = buffer.length >= 2 || /[\?\!\u0964]$/.test(s);
      if (isBoundary || idx === sentences.length - 1) {
        turns.push({ speaker: speakerIndex % 2 === 0 ? 'Speaker A' : 'Speaker B', text: buffer.join(' ') });
        buffer = [];
        speakerIndex++;
      }
    });
    return turns;
  };

  const parseQAPairs = (raw) => {
    if (!raw) return [];
    const text = String(raw);
    const regex = /Q\s*:\s*([\s\S]*?)\s*A\s*:\s*([\s\S]*?)(?=(?:\n|\r|\s)*Q\s*:|$)/gi;
    const pairs = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const q = sanitizeText(match[1] || '');
      const a = sanitizeText(match[2] || '');
      if (q || a) pairs.push({ q, a });
    }
    // Fallback: if no pairs matched but we still have Q:/A: tokens, try a simpler split
    if (pairs.length === 0 && /Q\s*:/i.test(text)) {
      const rough = text.split(/Q\s*:/i).map(s => s.trim()).filter(Boolean);
      rough.forEach(chunk => {
        const parts = chunk.split(/A\s*:/i);
        const q = sanitizeText(parts[0] || '');
        const a = sanitizeText((parts[1] || '').replace(/\n+$/g, ''));
        if (q || a) pairs.push({ q, a });
      });
    }
    return pairs;
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

  const downloadBulkTranscriptsPdf = async () => {
    if (selectedItems.size === 0) return;
    try {
      const sections = [];
      for (const itemId of selectedItems) {
        const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
        const json = await resp.json();
        if (json?.success && json.url) {
          const response = await fetch(json.url);
          const text = await response.text();
          const item = selectedProject.items.find(i => i._id === itemId);
          sections.push({ title: item?.originalFilename || String(itemId), text: sanitizeText(text) });
        }
      }
      await exportSectionsAsPdf(`transcripts-${Date.now()}.pdf`, sections);
    } catch (e) {
      alert('Failed to download transcripts PDF: ' + e.message);
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

  const downloadBulkQAPdf = async () => {
    if (selectedItems.size === 0) return;
    try {
      const sections = [];
      for (const itemId of selectedItems) {
        const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/qa-url`);
        const json = await resp.json();
        if (json?.success && json.url) {
          const response = await fetch(json.url);
          const text = await response.text();
          const item = selectedProject.items.find(i => i._id === itemId);
          sections.push({ title: item?.originalFilename || String(itemId), text: sanitizeText(text) });
        }
      }
      await exportSectionsAsPdf(`qa-${Date.now()}.pdf`, sections);
    } catch (e) {
      alert('Failed to download Q&A PDF: ' + e.message);
    }
  };

  const exportSectionsAsPdf = async (filename, sections) => {
    if (!Array.isArray(sections) || sections.length === 0) return;
    // Build a temporary DOM container per section
    const container = document.createElement('div');
    container.id = 'stt-bulk-export';
    container.style.padding = '24px';
    container.style.border = '8px solid #e5e7eb';
    container.style.borderRadius = '8px';
    container.style.fontFamily = "'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', Arial, sans-serif";
    sections.forEach((sec, idx) => {
      const block = document.createElement('div');
      block.style.marginBottom = '20px';
      block.style.padding = '12px';
      block.style.border = '1px solid #e5e7eb';
      block.style.borderRadius = '6px';
      block.style.backgroundColor = '#ffffff';
      const h = document.createElement('h3');
      h.textContent = sec.title;
      h.style.fontSize = '15px';
      h.style.margin = '0 0 10px 0';
      h.style.color = '#111111';
      block.appendChild(h);
      const looksLikeQA = /^Q\s*:/i.test(sec.text) || /\nQ\s*:/i.test(sec.text);
      if (looksLikeQA) {
        // Render as Q&A boxes with better spacing
        const pairs = parseQAPairs(sec.text);
        pairs.forEach((p) => {
          const qa = document.createElement('div');
          qa.style.marginBottom = '10px';
          qa.style.padding = '10px';
          qa.style.border = '1px solid #e5e7eb';
          qa.style.borderRadius = '6px';
          qa.style.backgroundColor = '#ffffff';
          if (p.q) {
            const q = document.createElement('div');
            q.style.marginBottom = '6px';
            const qLabel = document.createElement('span');
            qLabel.textContent = 'Q:';
            qLabel.style.fontSize = '11px';
            qLabel.style.fontWeight = '700';
            qLabel.style.color = '#4338ca';
            q.appendChild(qLabel);
            const qText = document.createElement('span');
            qText.textContent = ' ' + p.q;
            qText.style.whiteSpace = 'pre-wrap';
            qText.style.fontSize = '12px';
            qText.style.color = '#111111';
            q.appendChild(qText);
            qa.appendChild(q);
          }
          if (p.a) {
            const a = document.createElement('div');
            const aLabel = document.createElement('span');
            aLabel.textContent = 'A:';
            aLabel.style.fontSize = '11px';
            aLabel.style.fontWeight = '700';
            aLabel.style.color = '#047857';
            a.appendChild(aLabel);
            const aText = document.createElement('span');
            aText.textContent = ' ' + p.a;
            aText.style.whiteSpace = 'pre-wrap';
            aText.style.fontSize = '12px';
            aText.style.color = '#111111';
            a.appendChild(aText);
            qa.appendChild(a);
          }
          block.appendChild(qa);
        });
      } else {
        const pre = document.createElement('div');
        pre.textContent = sec.text || '';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontSize = '12px';
        pre.style.color = '#111111';
        pre.style.backgroundColor = '#ffffff';
        pre.style.border = '1px solid #e5e7eb';
        pre.style.borderRadius = '6px';
        pre.style.padding = '8px';
        block.appendChild(pre);
      }
      container.appendChild(block);
    });
    document.body.appendChild(container);
    try {
      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc) => {
            // Remove styles to avoid oklch()
            const links = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"], style'));
            links.forEach(l => l.parentNode && l.parentNode.removeChild(l));
            const node = clonedDoc.getElementById('stt-bulk-export');
            if (!node) return;
            node.style.fontFamily = "'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', Arial, sans-serif";
            const all = node.querySelectorAll('*');
            all.forEach((n) => {
              n.style.boxShadow = 'none';
              if (!n.style.color) n.style.color = '#111111';
              if (!n.style.backgroundColor) n.style.backgroundColor = '#ffffff';
              if (!n.style.borderColor) n.style.borderColor = '#e5e7eb';
            });
          }
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().from(container).set(opt).save();
    } finally {
      container.remove();
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
                    onClick={downloadBulkTranscriptsPdf}
                    className="px-3 py-1 text-sm bg-blue-700 text-white rounded hover:bg-blue-800"
                  >
                    Download All Transcripts (PDF)
                  </button>
                  <button 
                    onClick={downloadBulkQA}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Download All Q&A
                  </button>
                  <button 
                    onClick={downloadBulkQAPdf}
                    className="px-3 py-1 text-sm bg-purple-700 text-white rounded hover:bg-purple-800"
                  >
                    Download All Q&A (PDF)
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
              <div className="flex items-center gap-2">
                {viewCard.title === 'Transcript' && (
                  <>
                    <label className="text-xs text-gray-600 flex items-center gap-1">
                      <input type="checkbox" className="rounded" checked={viewAsChat} onChange={(e) => setViewAsChat(e.target.checked)} />
                      Chat view
                    </label>
                  </>
                )}
                <button className="px-2 py-1 text-xs border rounded" onClick={() => downloadModalAsPdf(viewCard.title)}>
                  Download PDF
                </button>
                <button className="text-gray-500" onClick={() => setViewCard({ open: false, title: '', content: '' })}>✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto text-sm border rounded p-3 bg-gray-50">
              <div id="stt-modal-content">
                {viewAsChat && viewCard.title === 'Transcript' ? (
                  <div className="space-y-2">
                    {splitIntoChatTurns(viewCard.content).map((t, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded ${i % 2 === 0 ? 'bg-white border' : 'bg-indigo-600 text-white'}`}>
                          <div className="text-xs font-medium mb-0.5 opacity-70">{t.speaker}</div>
                          <div className="whitespace-pre-wrap">{sanitizeText(t.text)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  viewCard.title === 'Q&A' ? (
                    <div className="space-y-2">
                      {parseQAPairs(viewCard.content).map((p, i) => (
                        <div key={i} className="border rounded p-2 bg-white">
                          {p.q ? (
                            <div className="mb-1">
                              <span className="text-xs font-semibold text-indigo-700 mr-1">Q:</span>
                              <span className="whitespace-pre-wrap">{p.q}</span>
                            </div>
                          ) : null}
                          {p.a ? (
                            <div>
                              <span className="text-xs font-semibold text-green-700 mr-1">A:</span>
                              <span className="whitespace-pre-wrap">{p.a}</span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{sanitizeText(viewCard.content) || 'No content'}</div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default STT;


