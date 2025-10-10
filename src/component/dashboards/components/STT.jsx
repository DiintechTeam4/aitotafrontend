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
  const [chatPage, setChatPage] = useState(1);
  const conversationsPerPage = 10;

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
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
      const json = await resp.json();
      if (json?.success && json.url) {
        const response = await fetch(json.url);
        const text = await response.text();
        
        // Convert to conversation format
        const conversations = splitIntoChatTurns(text);
        let conversationText = '';
        
        if (conversations.length > 0) {
          conversations.forEach((conversation) => {
            conversationText += `${conversation.speaker}: ${conversation.text}\n\n`;
          });
        } else {
          // Fallback to regular text if no conversations found
          conversationText = sanitizeText(text);
        }
        
        // Create and download the text file
        const blob = new Blob([conversationText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcript.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        alert(json?.message || 'Transcript not ready');
      }
    } catch (e) {
      alert('Failed to download transcript: ' + e.message);
    }
  };

  // Fixed sanitizeText function - more conservative approach
  const sanitizeText = (raw) => {
    if (!raw) return '';
    
    // Convert to string and normalize Unicode
    let text = String(raw).normalize('NFC');
    
    // Only remove actual control characters that cause issues, keep everything else
    // Remove only: NULL, SOH-STX, EOT-ENQ, ACK-BEL, VT, FF, SO-SI, DEL, and C1 controls
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Clean up whitespace but preserve structure
    text = text.replace(/\r\n/g, '\n')  // Normalize line endings
             .replace(/\r/g, '\n')      // Convert remaining \r to \n
             .replace(/[ \t]+/g, ' ')   // Collapse spaces and tabs
             .replace(/\n[ \t]+/g, '\n') // Remove spaces after newlines
             .replace(/[ \t]+\n/g, '\n') // Remove spaces before newlines
             .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
             .trim();
    
    return text;
  };

  // Fixed splitIntoChatTurns function
  const splitIntoChatTurns = (raw) => {
    const text = sanitizeText(raw);
    if (!text) return [];
    
    // Clean up any duplicate speaker names that might be in the text
    let cleanText = text.replace(/(Speaker [AB]:?\s*)+/gi, '');
    
    // Split into sentences on ., ?, !, Hindi danda à¥¤
    const sentences = cleanText
      .split(/(?<=[\.\?\!\u0964])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    
    const turns = [];
    let buffer = [];
    let speakerIndex = 0; // 0 -> Speaker A, 1 -> Speaker B
    
    if (sentences.length > 0) {
      // Use sentence-based approach
      sentences.forEach((s, idx) => {
        buffer.push(s);
        const isBoundary = buffer.length >= 2 || /[\?\!\u0964]$/.test(s);
        if (isBoundary || idx === sentences.length - 1) {
          turns.push({ speaker: speakerIndex % 2 === 0 ? 'Speaker A' : 'Speaker B', text: buffer.join(' ') });
          buffer = [];
          speakerIndex++;
        }
      });
    } else {
      // Fallback: split by line breaks if no sentences found
      const lines = cleanText.split(/\n+/).map(s => s.trim()).filter(Boolean);
      if (lines.length > 0) {
        lines.forEach((line, idx) => {
          turns.push({ 
            speaker: idx % 2 === 0 ? 'Speaker A' : 'Speaker B', 
            text: line 
          });
        });
      } else {
        // Last resort: create a single conversation
        turns.push({ speaker: 'Speaker A', text: cleanText });
      }
    }
    
    return turns;
  };

  // Improved PDF generation with better text handling
  const downloadTextAsPdf = (filename, text, isChatView = false) => {
    // Create a temporary HTML element for better Unicode support
    const container = document.createElement('div');
    container.id = 'temp-pdf-content';
    container.style.padding = '10px';
    container.style.fontFamily = "'Noto Sans Devanagari', 'Noto Sans', 'Mangal', 'Arial Unicode MS', 'DejaVu Sans', Arial, sans-serif";
    container.style.fontSize = '14px';
    container.style.lineHeight = '1.4';
    container.style.color = '#000000';
    container.style.backgroundColor = '#ffffff';
    
    // Add CSS for page headers with logo
    const style = document.createElement('style');
    style.textContent = `
      @page {
        margin: 0.5in;
        @top-right {
          content: url('/AitotaLogo.png');
          width: 60px;
          height: 30px;
          object-fit: contain;
        }
      }
      .page-header {
        position: fixed;
        top: 0.5in;
        right: 0.5in;
        width: 60px;
        height: 30px;
        z-index: 1000;
      }
      .page-header img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    `;
    container.appendChild(style);
    
    // Add page header div for logo on every page
    const pageHeader = document.createElement('div');
    pageHeader.className = 'page-header';
    const headerLogo = document.createElement('img');
    headerLogo.src = '/AitotaLogo.png';
    headerLogo.alt = 'Aitota Logo';
    pageHeader.appendChild(headerLogo);
    container.appendChild(pageHeader);
    
    if (isChatView) {
      const conversations = splitIntoChatTurns(text);
      
      if (conversations.length === 0) {
        // Fallback to regular text
        const cleanText = sanitizeText(text);
        const pre = document.createElement('div');
        pre.textContent = cleanText;
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontSize = '16px';
        pre.style.lineHeight = '1.8';
        pre.style.padding = '10px';
        pre.style.border = '1px solid #e5e7eb';
        pre.style.borderRadius = '6px';
        container.appendChild(pre);
      } else {
        // Render conversations as chat bubbles
        conversations.forEach((conversation, index) => {
          const isLeft = index % 2 === 0;
          
          const chatDiv = document.createElement('div');
          chatDiv.style.marginBottom = '12px';
          chatDiv.style.display = 'flex';
          chatDiv.style.justifyContent = isLeft ? 'flex-start' : 'flex-end';
          
          const bubble = document.createElement('div');
          bubble.style.maxWidth = '75%';
          bubble.style.padding = '8px 12px';
          bubble.style.borderRadius = '8px';
          bubble.style.backgroundColor = isLeft ? '#f8f9fa' : '#e3f2fd';
          bubble.style.color = '#000000';
          bubble.style.border = isLeft ? '1px solid #dee2e6' : '1px solid #bbdefb';
          bubble.style.fontSize = '14px';
          bubble.style.lineHeight = '1.4';
          bubble.style.marginBottom = '8px';
          
          const speaker = document.createElement('div');
          speaker.textContent = conversation.speaker;
          speaker.style.fontSize = '11px';
          speaker.style.fontWeight = '500';
          speaker.style.marginBottom = '3px';
          speaker.style.color = '#6c757d';
          bubble.appendChild(speaker);
          
          const textDiv = document.createElement('div');
          textDiv.textContent = conversation.text;
          textDiv.style.whiteSpace = 'pre-wrap';
          bubble.appendChild(textDiv);
          
          chatDiv.appendChild(bubble);
          container.appendChild(chatDiv);
        });
      }
    } else {
      // Regular text PDF
      const cleanText = sanitizeText(text);
      const pre = document.createElement('div');
      pre.textContent = cleanText;
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.fontSize = '16px';
      pre.style.lineHeight = '1.8';
      pre.style.padding = '10px';
      pre.style.border = '1px solid #e5e7eb';
      pre.style.borderRadius = '6px';
      container.appendChild(pre);
    }
    
    // Add to DOM temporarily
    document.body.appendChild(container);
    
    // Generate PDF using html2pdf with simplified configuration
    const opt = {
      margin: [1.0, 0.5, 0.5, 0.5], // top, right, bottom, left - more top margin for header
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };
    
    // Generate and save PDF
    html2pdf().from(container).set(opt).save().finally(() => {
      // Clean up
      container.remove();
    });
  };

  // Fixed modal PDF download
  const downloadModalAsPdf = async (title) => {
    try {
      // For transcript in chat view, use text-based PDF generation
      if (title === 'Transcript' && viewAsChat) {
        downloadTextAsPdf(`${title.toLowerCase()}.pdf`, viewCard.content, true);
        return;
      }
      
      // For other content, use the existing HTML-based approach
      const el = document.getElementById('stt-modal-content');
      if (!el) return;
      
      const opt = {
        margin: [40, 40, 40, 40],
        filename: `${String(title).toLowerCase().replace(/\s+/g,'-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          onclone: (clonedDoc) => {
            const node = clonedDoc.getElementById('stt-modal-content');
            if (!node) return;
            
            // Apply safe styling
            node.style.fontFamily = 'Arial, sans-serif';
            node.style.fontSize = '14px';
            node.style.lineHeight = '1.5';
            node.style.color = '#000000';
            node.style.backgroundColor = '#ffffff';
            
            // Remove any problematic styling from descendants
            const all = node.querySelectorAll('*');
            all.forEach((n) => {
              n.style.boxShadow = 'none';
              n.style.textShadow = 'none';
              if (!n.style.color) n.style.color = '#000000';
              if (!n.style.backgroundColor) n.style.backgroundColor = 'transparent';
            });
          }
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(el).set(opt).save();
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  const downloadTranscriptPdf = async (itemId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
      const json = await resp.json();
      if (json?.success && json.url) {
        const r = await fetch(json.url);
        const text = await r.text();
        downloadTextAsPdf('transcript.pdf', text, true);
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
          setChatPage(1);
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

  const parseQAPairs = (raw) => {
    if (!raw) return [];
    const text = sanitizeText(raw);
    const regex = /Q\s*:\s*([\s\S]*?)\s*A\s*:\s*([\s\S]*?)(?=(?:\n|\r|\s)*Q\s*:|$)/gi;
    const pairs = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const q = match[1]?.trim() || '';
      const a = match[2]?.trim() || '';
      if (q || a) pairs.push({ q, a });
    }
    
    if (pairs.length === 0 && /Q\s*:/i.test(text)) {
      const rough = text.split(/Q\s*:/i).map(s => s.trim()).filter(Boolean);
      rough.forEach(chunk => {
        const parts = chunk.split(/A\s*:/i);
        const q = parts[0]?.trim() || '';
        const a = parts[1]?.trim().replace(/\n+$/g, '') || '';
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
          
          // Convert to conversation format
          const conversations = splitIntoChatTurns(text);
          let conversationText = '';
          
          if (conversations.length > 0) {
            conversations.forEach((conversation) => {
              conversationText += `${conversation.speaker}: ${conversation.text}\n\n`;
            });
          } else {
            // Fallback to regular text if no conversations found
            conversationText = sanitizeText(text);
          }
          
          transcripts.push(`=== ${item?.originalFilename || itemId} ===\n${conversationText}\n\n`);
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

  // Create consistent header function for both transcript and Q&A PDFs
  const createPageHeader = (title = '', includeTitle = true) => {
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.justifyContent = includeTitle ? 'space-between' : 'flex-end';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.marginBottom = '15px';
    headerDiv.style.paddingBottom = '10px';
    headerDiv.style.borderBottom = '2px solid #e5e7eb';
    headerDiv.style.width = '100%';
    
    if (includeTitle && title) {
      const titleElement = document.createElement('h2');
      titleElement.textContent = title;
      titleElement.style.fontSize = '16px';
      titleElement.style.fontWeight = '600';
      titleElement.style.color = '#2d3748';
      titleElement.style.margin = '0';
      titleElement.style.flex = '1';
      headerDiv.appendChild(titleElement);
    }
    
    const logoContainer = document.createElement('div');
    logoContainer.style.width = '60px';
    logoContainer.style.height = '30px';
    logoContainer.style.display = 'flex';
    logoContainer.style.alignItems = 'center';
    logoContainer.style.justifyContent = 'flex-end';
    
    const logo = document.createElement('img');
    logo.src = '/AitotaLogo.png';
    logo.style.maxWidth = '100%';
    logo.style.maxHeight = '100%';
    logo.style.objectFit = 'contain';
    logoContainer.appendChild(logo);
    
    headerDiv.appendChild(logoContainer);
    return headerDiv;
  };

  // Fixed bulk transcript PDF download with consistent header on every page
  const downloadBulkTranscriptsPdf = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      // Create a temporary HTML element for better Unicode support
      const container = document.createElement('div');
      container.id = 'bulk-pdf-content';
      container.style.padding = '10px';
      container.style.fontFamily = "'Noto Sans Devanagari', 'Noto Sans', 'Mangal', 'Arial Unicode MS', 'DejaVu Sans', Arial, sans-serif";
      container.style.fontSize = '14px';
      container.style.lineHeight = '1.4';
      container.style.color = '#000000';
      container.style.backgroundColor = '#ffffff';

      for (const itemId of selectedItems) {
        const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/transcript-url`);
        const json = await resp.json();
        
        if (json?.success && json.url) {
          const response = await fetch(json.url);
          const text = await response.text();
          const item = selectedProject.items.find(i => i._id === itemId);
          
          // Create file section with page break
          const fileSection = document.createElement('div');
          fileSection.style.marginBottom = '30px';
          
          // Add page break before each file (except first)
          if (container.children.length > 0) {
            fileSection.style.pageBreakBefore = 'always';
          }
          
          // Add consistent header with logo and horizontal line for each file
          const fileHeader = createPageHeader(item?.originalFilename || itemId, true);
          fileSection.appendChild(fileHeader);
          
          // Process conversations
          const conversations = splitIntoChatTurns(text);
          
          if (conversations.length === 0) {
            // Fallback to regular text
            const cleanText = sanitizeText(text);
            const pre = document.createElement('div');
            pre.textContent = cleanText;
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.fontSize = '16px';
            pre.style.lineHeight = '1.8';
            pre.style.padding = '15px';
            pre.style.border = '1px solid #e5e7eb';
            pre.style.borderRadius = '8px';
            pre.style.backgroundColor = '#f9fafb';
            fileSection.appendChild(pre);
          } else {
            // Render conversations with page break handling and consistent header on each page
            const conversationsPerPage = 5; // Reduced to leave space for header
            
            conversations.forEach((conversation, index) => {
              const isLeft = index % 2 === 0;
              
              // Add page break and header every N conversations
              if (index > 0 && index % conversationsPerPage === 0) {
                const pageBreak = document.createElement('div');
                pageBreak.style.pageBreakBefore = 'always';
                pageBreak.style.paddingTop = '10px';
                
                // Add consistent header to new page
                const pageHeader = createPageHeader('', false);
                pageBreak.appendChild(pageHeader);
                
                fileSection.appendChild(pageBreak);
              }
              
              const chatDiv = document.createElement('div');
              chatDiv.style.marginBottom = '12px';
              chatDiv.style.display = 'flex';
              chatDiv.style.justifyContent = isLeft ? 'flex-start' : 'flex-end';
              
              const bubble = document.createElement('div');
              bubble.style.maxWidth = '75%';
              bubble.style.padding = '8px 12px';
              bubble.style.borderRadius = '8px';
              bubble.style.backgroundColor = isLeft ? '#f8f9fa' : '#e3f2fd';
              bubble.style.color = '#000000';
              bubble.style.border = isLeft ? '1px solid #dee2e6' : '1px solid #bbdefb';
              bubble.style.fontSize = '14px';
              bubble.style.lineHeight = '1.4';
              bubble.style.marginBottom = '8px';
              
              const speaker = document.createElement('div');
              speaker.textContent = conversation.speaker;
              speaker.style.fontSize = '11px';
              speaker.style.fontWeight = '500';
              speaker.style.marginBottom = '3px';
              speaker.style.color = '#6c757d';
              bubble.appendChild(speaker);
              
              const textDiv = document.createElement('div');
              textDiv.textContent = conversation.text;
              textDiv.style.whiteSpace = 'pre-wrap';
              bubble.appendChild(textDiv);
              
              chatDiv.appendChild(bubble);
              fileSection.appendChild(chatDiv);
            });
          }
          
          container.appendChild(fileSection);
        }
      }
      
      // Add to DOM temporarily
      document.body.appendChild(container);
      
      // Generate PDF using html2pdf with custom header configuration
      const opt = {
        margin: [1.0, 0.5, 0.5, 0.5], // top, right, bottom, left - more top margin for header
        filename: `transcripts-bulk-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      // Generate and save PDF
      await html2pdf().from(container).set(opt).save();
      
      // Clean up
      container.remove();
    } catch (e) {
      console.error('Bulk PDF error:', e);
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

  // Fixed bulk Q&A PDF download with consistent header on every page
  const downloadBulkQAPdf = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      // Create a temporary HTML element for better Unicode support
      const container = document.createElement('div');
      container.id = 'bulk-qa-pdf-content';
      container.style.padding = '10px';
      container.style.fontFamily = "'Noto Sans Devanagari', 'Noto Sans', 'Mangal', 'Arial Unicode MS', 'DejaVu Sans', Arial, sans-serif";
      container.style.fontSize = '14px';
      container.style.lineHeight = '1.4';
      container.style.color = '#000000';
      container.style.backgroundColor = '#ffffff';

      for (const itemId of selectedItems) {
        const resp = await fetch(`${API_BASE_URL}/stt/items/${itemId}/qa-url`);
        const json = await resp.json();
        
        if (json?.success && json.url) {
          const response = await fetch(json.url);
          const text = await response.text();
          const item = selectedProject.items.find(i => i._id === itemId);
          
          // Create file section with page break
          const fileSection = document.createElement('div');
          fileSection.style.marginBottom = '30px';
          
          // Add page break before each file (except first)
          if (container.children.length > 0) {
            fileSection.style.pageBreakBefore = 'always';
          }
          
          // Add consistent header with logo and horizontal line for each file
          const fileHeader = createPageHeader(item?.originalFilename || itemId, true);
          fileSection.appendChild(fileHeader);
          
          // Process Q&A pairs
          const pairs = parseQAPairs(text);
          
          if (pairs.length === 0) {
            // Fallback to regular text
            const cleanText = sanitizeText(text);
            const pre = document.createElement('div');
            pre.textContent = cleanText;
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.fontSize = '16px';
            pre.style.lineHeight = '1.8';
            pre.style.padding = '15px';
            pre.style.border = '1px solid #e5e7eb';
            pre.style.borderRadius = '8px';
            pre.style.backgroundColor = '#f9fafb';
            fileSection.appendChild(pre);
          } else {
            // Render Q&A pairs with page break handling and consistent header
            const pairsPerPage = 9; // Reduced to leave space for header
            
            pairs.forEach((pair, index) => {
              // Add page break and header every N Q&A pairs
              if (index > 0 && index % pairsPerPage === 0) {
                const pageBreak = document.createElement('div');
                pageBreak.style.pageBreakBefore = 'always';
                pageBreak.style.paddingTop = '10px';
                
                // Add consistent header to new page
                const pageHeader = createPageHeader('', false);
                pageBreak.appendChild(pageHeader);
                
                fileSection.appendChild(pageBreak);
              }
              
              const qaDiv = document.createElement('div');
              qaDiv.style.marginBottom = '12px';
              qaDiv.style.padding = '12px';
              qaDiv.style.border = '1px solid #e2e8f0';
              qaDiv.style.borderRadius = '6px';
              qaDiv.style.backgroundColor = '#f8f9fa';
              
              if (pair.q) {
                const questionDiv = document.createElement('div');
                questionDiv.style.marginBottom = '10px';
                
                const qLabel = document.createElement('span');
                qLabel.textContent = 'Q:';
                qLabel.style.fontSize = '12px';
                qLabel.style.fontWeight = '600';
                qLabel.style.color = '#2563eb';
                qLabel.style.marginRight = '6px';
                questionDiv.appendChild(qLabel);
                
                const qText = document.createElement('span');
                qText.textContent = pair.q;
                qText.style.whiteSpace = 'pre-wrap';
                qText.style.fontSize = '14px';
                qText.style.color = '#000000';
                qText.style.lineHeight = '1.4';
                questionDiv.appendChild(qText);
                
                qaDiv.appendChild(questionDiv);
              }
              
              if (pair.a) {
                const answerDiv = document.createElement('div');
                
                const aLabel = document.createElement('span');
                aLabel.textContent = 'A:';
                aLabel.style.fontSize = '12px';
                aLabel.style.fontWeight = '600';
                aLabel.style.color = '#059669';
                aLabel.style.marginRight = '6px';
                answerDiv.appendChild(aLabel);
                
                const aText = document.createElement('span');
                aText.textContent = pair.a;
                aText.style.whiteSpace = 'pre-wrap';
                aText.style.fontSize = '14px';
                aText.style.color = '#000000';
                aText.style.lineHeight = '1.4';
                answerDiv.appendChild(aText);
                
                qaDiv.appendChild(answerDiv);
              }
              
              fileSection.appendChild(qaDiv);
            });
          }
          
          container.appendChild(fileSection);
        }
      }
      
      // Add to DOM temporarily
      document.body.appendChild(container);
      
      // Generate PDF using html2pdf with custom header configuration
      const opt = {
        margin: [1.0, 0.5, 0.5, 0.5], // top, right, bottom, left - more top margin for header
        filename: `qa-bulk-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      // Generate and save PDF
      await html2pdf().from(container).set(opt).save();
      
      // Clean up
      container.remove();
    } catch (e) {
      console.error('Bulk Q&A PDF error:', e);
      alert('Failed to download Q&A PDF: ' + e.message);
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
                      <input type="checkbox" className="rounded" checked={viewAsChat} onChange={(e) => { setViewAsChat(e.target.checked); setChatPage(1); }} />
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