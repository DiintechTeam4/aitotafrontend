import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config";
import STT from "./STT";

const ToolsManagement = () => {
  // Tools/Templates state
  const [activeTool, setActiveTool] = useState(null); // 'whatsapp' | 'telegram' | 'email' | 'sms'
  const [templates, setTemplates] = useState([]);
  const [externalTemplates, setExternalTemplates] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [assignAgentId, setAssignAgentId] = useState("");
  const [accessRequests, setAccessRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [openMenuTemplateId, setOpenMenuTemplateId] = useState(null);
  
  // New state for WhatsApp specific functionality
  const [whatsappPage, setWhatsappPage] = useState(false);
  const [loadingWhatsappTemplates, setLoadingWhatsappTemplates] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [clientTemplates, setClientTemplates] = useState([]);
  const [loadingClientTemplates, setLoadingClientTemplates] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Search and filter state
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  
  // Cache for agent names resolved by ID
  const [agentNameCache, setAgentNameCache] = useState({});

  // Helper: shorten long names with ellipsis
  const getShortName = (name, maxLength = 24) => {
    try {
      const str = String(name || '').trim();
      if (!str) return '';
      return str.length > maxLength ? str.slice(0, maxLength - 1) + '…' : str;
    } catch {
      return '';
    }
  }

  // When selectedClient changes, default select first agent if present
  useEffect(() => {
    if (selectedClient && Array.isArray(selectedClient.agents) && selectedClient.agents.length > 0) {
      setSelectedAgentId(selectedClient.agents[0].id);
    } else {
      setSelectedAgentId('');
    }
  }, [selectedClient]);

  const fetchTemplates = async (platform) => {
    try {
      // For WhatsApp, load from external service provided
      if (platform === 'whatsapp') {
        setLoadingWhatsappTemplates(true);
        const resp = await fetch('https://whatsapp-template-module.onrender.com/api/whatsapp/get-templates');
        const json = await resp.json();
        const arr = Array.isArray(json?.templates) ? json.templates : [];
        // Normalize into a common shape used by the grid
        const normalized = arr.map(t => {
          const bodyComponent = (t.components || []).find(c => c.type === 'BODY');
          const buttonsComp = (t.components || []).find(c => c.type === 'BUTTONS');
          const firstUrl = buttonsComp && Array.isArray(buttonsComp.buttons) && buttonsComp.buttons[0]?.url;
          const headerComp = (t.components || []).find(c => c.type === 'HEADER');
          return {
            _id: t.id || t.name,
            name: t.name,
            url: firstUrl || '',
            imageUrl: headerComp?.format === 'IMAGE' ? headerComp.example?.header_handle?.[0] : '',
            description: bodyComponent?.text || '',
            language: t.language,
            status: t.status,
            category: t.category,
            sub_category: t.sub_category,
            parameter_format: t.parameter_format,
            components: t.components
          };
        });
        setTemplates(normalized);
        setExternalTemplates(true);
        setLoadingWhatsappTemplates(false);
      } else {
        const resp = await fetch(`${API_BASE_URL}/templates?platform=${platform}`);
        const json = await resp.json();
        setTemplates(json?.success ? json.data || [] : []);
        setExternalTemplates(false);
      }
      setSelectedTemplateIds([]);
    } catch (e) {
      setTemplates([]);
      setSelectedTemplateIds([]);
      setExternalTemplates(false);
      setLoadingWhatsappTemplates(false);
    }
  };

    // Fetch clients with pending WhatsApp requests
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      // Instead of fetching all clients, fetch only those with pending WhatsApp requests
      const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
      const response = await fetch(`${API_BASE_URL}/agent-access/requests?status=pending&platform=whatsapp`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        // Extract unique clients and agents from the requests
        const clientMap = new Map();
        const agentMap = new Map();
        
        // First pass: collect all unique client and agent IDs
        data.data.forEach(request => {
          const clientId = typeof request.clientId === 'object' ? request.clientId._id : request.clientId;
          const agentId = typeof request.agentId === 'object' ? request.agentId._id : request.agentId;
          
          if (clientId && !clientMap.has(clientId)) {
            clientMap.set(clientId, {
              _id: clientId,
              name: 'Loading...',
              businessName: 'Loading...',
              email: 'Loading...',
              requestCount: 0,
              agents: []
            });
          }
          
          if (agentId && !agentMap.has(agentId)) {
            // Seed with cache if available
            const cachedName = agentNameCache[agentId];
            agentMap.set(agentId, {
              _id: agentId,
              name: cachedName || 'Loading...',
              clientId: clientId
            });
          }
        });
        
        // Second pass: count requests and associate agents with clients
        data.data.forEach(request => {
          const clientId = typeof request.clientId === 'object' ? request.clientId._id : request.clientId;
          const agentId = typeof request.agentId === 'object' ? request.agentId._id : request.agentId;
          
          if (clientId && agentId) {
            const client = clientMap.get(clientId);
            const agent = agentMap.get(agentId);
            
            if (client && agent) {
              client.requestCount++;
              
              // Add agent to client if not already present
              const agentExists = client.agents.some(a => a.id === agentId);
              if (!agentExists) {
                client.agents.push({
                  id: agentId,
                  name: agent.name
                });
              }
            }
          }
        });
        
        // Fetch full client details
        const clientIds = Array.from(clientMap.keys());
        if (clientIds.length > 0) {
          try {
            const clientsResponse = await fetch(`${API_BASE_URL}/admin/getclients`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const clientsData = await clientsResponse.json();
            
            if (clientsData.success) {
              clientsData.data.forEach(client => {
                if (clientMap.has(client._id)) {
                  const existingClient = clientMap.get(client._id);
                  existingClient.name = client.name || `Client ${client._id.slice(-6)}`;
                  existingClient.businessName = client.businessName || '';
                  existingClient.email = client.email || '';
                }
              });
            }
          } catch (error) {
            console.error('Error fetching client details:', error);
            // Set fallback names for clients
            clientMap.forEach((client, clientId) => {
              if (client.name === 'Loading...') {
                client.name = `Client ${clientId.slice(-6)}`;
              }
            });
          }
        }
        
        // Fetch full agent details (bulk)
        const agentIds = Array.from(agentMap.keys());
        if (agentIds.length > 0) {
          try {
            const agentsResponse = await fetch(`${API_BASE_URL}/client/agents/admin`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const agentsData = await agentsResponse.json();
            
            if (agentsData.success) {
              agentsData.data.forEach(agent => {
                if (agentMap.has(agent._id)) {
                  const existingAgent = agentMap.get(agent._id);
                  existingAgent.name = agent.agentName || agent.name || `Agent ${agent._id.slice(-6)}`;
                }
              });
            }
          } catch (error) {
            console.error('Error fetching agent details:', error);
            // leave to per-id resolution below
          }
        }

        // Per-ID resolution for any unresolved agent names
        const unresolvedAgentIds = Array.from(agentMap.keys()).filter(id => {
          const a = agentMap.get(id);
          return !a || !a.name || a.name === 'Loading...' || a.name.startsWith('Agent ');
        });

        if (unresolvedAgentIds.length > 0) {
          try {
            const results = await Promise.all(unresolvedAgentIds.map(async (id) => {
              try {
                const r = await fetch(`${API_BASE_URL}/client/agents/${id}/name`);
                const j = await r.json();
                const payload = j?.agent || j?.data || j;
                const resolvedName = payload?.agentName || payload?.name || payload?.fullName || payload?.email || `Agent ${String(id).slice(-6)}`;
                if (agentMap.has(id)) {
                  agentMap.get(id).name = resolvedName;
                }
                return { id, name: resolvedName };
              } catch (e) {
                return { id, name: `Agent ${String(id).slice(-6)}` };
              }
            }));

            // Update cache
            const cacheUpdate = { ...agentNameCache };
            results.forEach(({ id, name }) => {
              cacheUpdate[id] = name;
            });
            setAgentNameCache(cacheUpdate);
          } catch {}
        }
        
        // Update client agents with proper names
        clientMap.forEach(client => {
          client.agents.forEach(agent => {
            const agentData = agentMap.get(agent.id);
            if (agentData) {
              agent.name = agentData.name;
            }
          });
        });
        
        setClients(Array.from(clientMap.values()));
      }
    } catch (error) {
      console.error('Error fetching clients with requests:', error);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch templates assigned to a specific client
  const fetchClientTemplates = async (clientId) => {
    if (!clientId) return;
    
    try {
      setLoadingClientTemplates(true);
      const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
      // Ask backend to include agent info per template
      const response = await fetch(`${API_BASE_URL}/templates/client/${clientId}?platform=whatsapp&includeAgents=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setClientTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching client templates:', error);
      setClientTemplates([]);
    } finally {
      setLoadingClientTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTool === 'whatsapp') {
      setWhatsappPage(true);
      fetchTemplates(activeTool);
      fetchAccessRequests({ status: 'pending', platform: activeTool });
      // Fetch clients after access requests to get the latest data
      setTimeout(() => fetchClients(), 100);
    } else if (activeTool === 'telegram' || activeTool === 'email' || activeTool === 'sms') {
      setWhatsappPage(false);
      fetchTemplates(activeTool);
      fetchAccessRequests({ status: 'pending', platform: activeTool });
    }
  }, [activeTool]);

  // When a client is selected, fetch their templates
  useEffect(() => {
    if (selectedClient) {
      fetchClientTemplates(selectedClient._id);
    }
  }, [selectedClient]);

  const fetchAccessRequests = async (params = { status: 'pending' }) => {
    try {
      setLoadingRequests(true);
      const qs = new URLSearchParams(params).toString();
      const resp = await fetch(`${API_BASE_URL}/agent-access/requests${qs ? `?${qs}` : ''}`);
      const json = await resp.json();
      setAccessRequests(json?.success ? (json.data || []) : []);
    } catch (e) {
      setAccessRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const approveAccessRequest = async (requestId, templateName, templateData) => {
    try {
      const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
      const resp = await fetch(`${API_BASE_URL}/agent-access/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ requestId, templateName, templateData })
      });
      const json = await resp.json();
      if (json?.success) {
        await fetchAccessRequests({ status: 'pending', platform: activeTool });
        // Refresh clients list to show updated pending requests
        await fetchClients();
        // Refresh client templates if a client is selected
        if (selectedClient) {
          fetchClientTemplates(selectedClient._id);
        }
        alert('Approved and updated agent successfully');
      } else {
        alert(json?.message || 'Failed to approve');
      }
    } catch (e) {
      alert('Failed to approve');
    }
  };

  const toggleSelectTemplate = (id) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const assignTemplates = async () => {
    try {
      if (!assignAgentId || selectedTemplateIds.length === 0) {
        alert("Enter Agent ID and select at least one template");
        return;
      }

      // Get the selected templates data
      const selectedTemplates = templates.filter(t => selectedTemplateIds.includes(t._id));
      
      const resp = await fetch(`${API_BASE_URL}/templates/assign`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken')}`
        },
        body: JSON.stringify({ 
          agentId: assignAgentId, 
          templateIds: selectedTemplateIds,
          templates: selectedTemplates // Send full template data for WhatsApp
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.message || "Failed to assign");
      alert("Templates assigned to agent");
      setSelectedTemplateIds([]);
      setAssignAgentId("");
    } catch (e) {
      alert(e.message || "Failed to assign templates");
    }
  };

  // Assign templates to a specific client
  const assignTemplatesToClient = async (clientId, templateIds) => {
    try {
      const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
      const resp = await fetch(`${API_BASE_URL}/templates/assign-client`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          clientId, 
          templateIds,
          platform: 'whatsapp'
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.message || "Failed to assign templates to client");
      alert("Templates assigned to client successfully");
      // Refresh client templates
      fetchClientTemplates(clientId);
    } catch (e) {
      alert(e.message || "Failed to assign templates to client");
    }
  };

  // Assign template to a specific agent
  const assignTemplatesToAgent = async (agentId, templateOrId) => {
    try {
      if (!agentId) {
        alert('Please select an agent');
        return;
      }
      // Build request body depending on template source
      const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
      let body;
      if (externalTemplates && templateOrId && typeof templateOrId === 'object') {
        // WhatsApp external template: send full template object; keep templateIds as [] to satisfy backend guard
        body = { agentId, templateIds: [], templates: [templateOrId], platform: 'whatsapp' };
      } else if (typeof templateOrId === 'string') {
        // Internal template by id
        body = { agentId, templateIds: [templateOrId] };
      } else {
        // Fallback: nothing to assign
        alert('Invalid template selection');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/templates/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await resp.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to assign template');
      }
      // If this is a WhatsApp template assignment and there is a pending access request for this client/agent, approve it
      if (externalTemplates && selectedClient?._id && selectedAgentId) {
        const match = (accessRequests || []).find((r) => {
          const ridClient = typeof r.clientId === 'object' ? r.clientId?._id : r.clientId;
          const ridAgent = typeof r.agentId === 'object' ? r.agentId?._id : r.agentId;
          return r.platform === 'whatsapp' && String(ridClient) === String(selectedClient._id) && String(ridAgent) === String(selectedAgentId) && r.status === 'pending';
        });
        if (match) {
          try {
            const tplObj = typeof templateOrId === 'object' ? templateOrId : templates.find(t => (t._id || t.id) === templateOrId);
            if (tplObj) {
              await approveAccessRequest(match._id, tplObj.name, tplObj);
            }
          } catch (e) {
            console.warn('Auto-approve request after assignment failed:', e);
          }
        }
      }
      // Refresh client templates to reflect approval badges
      if (selectedClient?._id) await fetchClientTemplates(selectedClient._id);
      // Also refresh access requests list
      await fetchAccessRequests();
      // Refresh clients sidebar pending counts
      await fetchClients();
      alert('Template assigned to agent successfully');
    } catch (e) {
      console.error('Assign to agent failed:', e);
      alert(e.message || 'Failed to assign template to agent');
    } finally {
      // no-op
    }
  };

  // Handle template assignment to client/agent (now agent)
  const handleClientTemplateAssignment = (templateOrId) => {
    if (!selectedClient) {
      alert("Please select a client first");
      return;
    }
    if (!selectedAgentId) {
      alert("Please select an agent");
      return;
    }
    assignTemplatesToAgent(selectedAgentId, templateOrId);
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.businessName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.agents.some(agent => agent.name.toLowerCase().includes(searchLower))
    );
  });

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    // Search term filter
    if (templateSearchTerm) {
      const searchLower = templateSearchTerm.toLowerCase();
      if (!template.name.toLowerCase().includes(searchLower) && 
          !template.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Category filter
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }
    
    // Language filter
    if (selectedLanguage && template.language !== selectedLanguage) {
      return false;
    }
    
    return true;
  });

  // Get unique categories and languages for filters
  const uniqueCategories = [...new Set(templates.map(t => t.category).filter(Boolean))];
  const uniqueLanguages = [...new Set(templates.map(t => t.language).filter(Boolean))];

  // Render WhatsApp specific page
  const renderWhatsappPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">WhatsApp Templates Management</h3>
        <button
          onClick={() => setWhatsappPage(false)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          ← Back to Tools
        </button>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {clientSearchTerm ? filteredClients.length : clients.length}
            </div>
            <div className="text-sm text-blue-800">
              {clientSearchTerm ? 'Filtered Clients' : 'Clients with Requests'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {(clientSearchTerm ? filteredClients : clients).reduce((total, client) => total + client.agents.length, 0)}
            </div>
            <div className="text-sm text-green-800">Total Agents</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {(clientSearchTerm ? filteredClients : clients).reduce((total, client) => total + client.requestCount, 0)}
            </div>
            <div className="text-sm text-orange-800">Total Requests</div>
          </div>
        </div>
        
        {/* Search Status */}
        {(clientSearchTerm || templateSearchTerm || selectedCategory || selectedLanguage) && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active Filters:</span>
              {clientSearchTerm && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Clients: "{clientSearchTerm}"</span>}
              {templateSearchTerm && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Templates: "{templateSearchTerm}"</span>}
              {selectedCategory && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Category: {selectedCategory}</span>}
              {selectedLanguage && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Language: {selectedLanguage}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Clients with Pending Requests */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Clients with Pending Requests</h4>
              <button
                onClick={fetchClients}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Refresh clients list"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Client Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients, business, agents..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {clientSearchTerm && (
                <button
                  onClick={() => setClientSearchTerm('')}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingClients ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading clients...</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client._id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClient?._id === client._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                        {client.requestCount} request{client.requestCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{client.businessName}</div>
                    <div className="text-xs text-gray-400">{client.email}</div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-600 font-medium mb-1">Requesting Agents:</div>
                      <div className="space-y-1">
                        {client.agents.map((agent, index) => (
                          <div key={agent.id} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                            <span className="font-medium">👤</span> {agent.name && !agent.name.startsWith('Loading')
  ? agent.name
  : `Agent ${String(agent.id || agent._id).slice(-6)}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {!loadingClients && filteredClients.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  {clients.length === 0 
                    ? 'No clients with pending WhatsApp requests' 
                    : 'No clients match your search criteria'
                  }
                </div>
              )}
            </div>
          </div>

          {/* Selected Client Templates */}
          {selectedClient && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  {selectedClient.name}'s Templates
                </h4>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Deselect client"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Business:</span> {selectedClient.businessName || 'N/A'}
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">Email:</span> {selectedClient.email || 'N/A'}
                </div>
                {/* Agent selector if multiple agents requested */}
                <div className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">Agent:</span>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="ml-2 px-2 py-1 border border-blue-200 rounded"
                  >
                    {(selectedClient.agents || []).map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name && !agent.name.startsWith('Loading') ? agent.name : `Agent ${String(agent.id).slice(-6)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {loadingClientTemplates ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientTemplates.map((template, idx) => (
                    <div key={`${template.templateId || template._id || template.id}-${idx}`} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-900">
                        {template.agentName ? `${template.agentName} - ${template.name}` : template.name}
                      </div>
                      <div className="text-xs text-green-600">✓ Approved</div>
                    </div>
                  ))}
                  {clientTemplates.length === 0 && (
                    <div className="text-gray-500 text-center py-4">No templates assigned</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Templates Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Available Templates</h4>
            
            {/* Template Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search templates by name or description..."
                  value={templateSearchTerm}
                  onChange={(e) => setTemplateSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Filter Options */}
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                {/* Language Filter */}
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Languages</option>
                  {uniqueLanguages.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
                
                {/* Clear Filters */}
                {(templateSearchTerm || selectedCategory || selectedLanguage) && (
                  <button
                    onClick={() => {
                      setTemplateSearchTerm('');
                      setSelectedCategory('');
                      setSelectedLanguage('');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {filteredTemplates.length} of {templates.length} templates
              </div>
            </div>
            
            {loadingWhatsappTemplates ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-lg text-gray-600 mt-4">Loading WhatsApp Templates...</p>
                <p className="text-sm text-gray-500">Please wait while we fetch the latest templates</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((t) => (
                  <div
                    key={t._id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="font-semibold text-gray-900 text-lg truncate">{t.name}</div>
                      {t.status && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          t.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {t.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {(t.language || t.category) && (
                        <span>{t.language}{t.language && t.category ? ' • ' : ''}{t.category}</span>
                      )}
                    </div>
                    
                    {t.imageUrl && (
                      <img src={t.imageUrl} alt={t.name} className="w-full h-32 object-cover rounded mb-3" />
                    )}
                    
                    {t.description && (
                      <div className="text-sm text-gray-700 mb-3 line-clamp-3">{t.description}</div>
                    )}
                    
                    <div className="flex gap-2">
                      {selectedClient && selectedAgentId && (
                        <button
                          onClick={() => handleClientTemplateAssignment(externalTemplates ? t : (t._id || t.id))}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          title={`Assign to ${(() => {
                            const ag = selectedClient.agents.find(a => a.id === selectedAgentId);
                            return ag && ag.name && !ag.name.startsWith('Loading') ? ag.name : `Agent ${String(selectedAgentId).slice(-6)}`;
                          })()}`}
                        >
                          Assign to {getShortName(selectedClient.agents.find(a => a.id === selectedAgentId)?.name || `Agent ${String(selectedAgentId).slice(-6)}`)}
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuTemplateId(openMenuTemplateId === t._id ? null : t._id);
                        }}
                        title="View Requests"
                      >
                        Requests
                      </button>
                    </div>

                    {/* Requests Menu */}
                    {openMenuTemplateId === t._id && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
                        <div className="px-3 py-2 text-sm font-semibold text-gray-700 border-b">Pending Requests</div>
                        <div className="max-h-72 overflow-y-auto">
                          {loadingRequests ? (
                            <div className="p-3 text-sm text-gray-500">Loading...</div>
                          ) : (
                            (accessRequests || []).filter(r => r.platform === 'whatsapp').length === 0 ? (
                              <div className="p-3 text-sm text-gray-500">No pending requests</div>
                            ) : (
                                                             (accessRequests || []).filter(r => r.platform === 'whatsapp').map((r) => {
                                 // Find client and agent names from our loaded data
                                 const client = clients.find(c => c._id === r.clientId);
                                 const agent = client?.agents.find(a => a.id === r.agentId);
                                 
                                 return (
                                   <div key={r._id} className="px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50">
                                     <div className="pr-2 min-w-0">
                                       <div className="text-gray-800 truncate">
                                         Agent: <span className="font-medium">{agent?.name && !agent.name.startsWith('Loading')
  ? agent.name
  : `Agent ${String(agent.id || agent._id).slice(-6)}`}</span>
                                       </div>
                                       <div className="text-gray-500 truncate">
                                         Client: <span className="font-medium">{client?.name || `Client ${r.clientId.slice(-6)}`}</span>
                                       </div>
                                     </div>
                                     <button
                                       className="flex-shrink-0 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         approveAccessRequest(r._id, t.name, t);
                                       }}
                                     >
                                       Approve
                                     </button>
                                   </div>
                                 );
                               })
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredTemplates.length === 0 && !loadingWhatsappTemplates && (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-gray-500">
                      {templates.length === 0 
                        ? 'No WhatsApp templates found.' 
                        : 'No templates match your search criteria.'
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render regular tools page
  const renderRegularToolsPage = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { id: "whatsapp", label: "WhatsApp", color: "bg-green-600" },
          { id: "telegram", label: "Telegram", color: "bg-blue-500" },
          { id: "email", label: "Email", color: "bg-red-500" },
          { id: "sms", label: "SMS", color: "bg-purple-600" },
          { id: "stt", label: "STT", color: "bg-indigo-600" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (t.id === 'stt') return setActivePage('stt');
              if (t.id === 'telegram' || t.id === 'email' || t.id === 'sms') return setActivePage(t.id);
              setActiveTool(t.id);
            }}
            className={`h-28 rounded-xl text-white text-2xl font-semibold shadow transition transform hover:-translate-y-0.5 ${t.color}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTool && activeTool !== 'whatsapp' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h4 className="text-lg font-semibold capitalize">{activeTool} Templates</h4>
            {!externalTemplates && (
              <div className="flex gap-2 items-center">
                <input
                  value={assignAgentId}
                  onChange={(e) => setAssignAgentId(e.target.value)}
                  placeholder="Agent ID to assign"
                  className="px-3 py-2 border rounded w-72"
                />
                <button onClick={assignTemplates} className="px-4 py-2 bg-black text-white rounded">
                  Assign Selected
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => (
              <div
                key={t._id}
                onClick={() => !externalTemplates && toggleSelectTemplate(t._id)}
                className={`cursor-pointer border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition ${
                  !externalTemplates && selectedTemplateIds.includes(t._id) ? "ring-2 ring-black" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-semibold text-gray-900 text-lg truncate">{t.name}</div>
                  {t.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuTemplateId(openMenuTemplateId === t._id ? null : t._id);
                      }}
                      title="Requests"
                    >
                      <span className="text-xl leading-none">⋯</span>
                    </button>
                    {openMenuTemplateId === t._id && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
                        <div className="px-3 py-2 text-sm font-semibold text-gray-700 border-b">Pending Requests</div>
                        <div className="max-h-72 overflow-y-auto">
                          {loadingRequests ? (
                            <div className="p-3 text-sm text-gray-500">Loading...</div>
                          ) : (
                            (accessRequests || []).filter(r => r.platform === activeTool).length === 0 ? (
                              <div className="p-3 text-sm text-gray-500">No pending requests</div>
                            ) : (
                                                             (accessRequests || []).filter(r => r.platform === activeTool).map((r) => {
                                 // For non-WhatsApp platforms, we don't have the client/agent data loaded
                                 // So we'll show the IDs with a fallback format
                                 return (
                                   <div key={r._id} className="px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50">
                                     <div className="pr-2 min-w-0">
                                       <div className="text-gray-800 truncate">
                                         Agent: <span className="font-medium break-all">{typeof r.agentId === 'object' ? r.agentId?._id || r.agentId : r.agentId}</span>
                                       </div>
                                       <div className="text-gray-500 truncate">
                                         Client: <span className="break-all">{typeof r.clientId === 'object' ? r.clientId?._id || r.clientId : r.clientId}</span>
                                       </div>
                                     </div>
                                     <button
                                       className="flex-shrink-0 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         approveAccessRequest(r._id, t.name, t);
                                       }}
                                     >
                                       Approve
                                     </button>
                                   </div>
                                 );
                               })
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {(t.language || t.category) && (
                    <span>{t.language}{t.language && t.category ? ' • ' : ''}{t.category}</span>
                  )}
                </div>
                {t.imageUrl && (
                  <img src={t.imageUrl} alt={t.name} className="w-full h-40 object-cover rounded mb-3" />
                )}
                {t.description && (
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap line-clamp-5">{t.description}</div>
                )}
                {t.url && (
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline mt-3">
                    Open Link
                  </a>
                )}
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-gray-500">No templates found for this platform.</div>
            )}
          </div>
        </div>
      )}

      {activeTool === 'requests' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h4 className="text-lg font-semibold">Pending Access Requests</h4>
            <div className="flex gap-2 items-center">
              <button onClick={() => fetchAccessRequests({ status: 'pending' })} className="px-4 py-2 bg-black text-white rounded">Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agent ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingRequests ? (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Loading...</td></tr>
                ) : accessRequests.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>No pending requests</td></tr>
                ) : (
                  accessRequests.map((r) => (
                    <tr key={r._id}>
                      <td className="px-4 py-2 text-sm text-gray-700 break-all">{r.clientId}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 break-all">{r.agentId}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 capitalize">{r.platform}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <button onClick={() => approveAccessRequest(r._id)} className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const [activePage, setActivePage] = useState('tools'); // tools | whatsapp | telegram | email | sms | stt

  useEffect(() => {
    if (activeTool === 'whatsapp') setActivePage('whatsapp');
  }, [activeTool]);

  const renderSimplePage = (label) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setActivePage('tools')} className="px-3 py-2 text-sm bg-gray-100 border rounded hover:bg-gray-200">← Back</button>
        <div className="text-lg font-semibold">{label}</div>
        <div></div>
      </div>
      <div className="text-sm text-gray-600">This page is under construction.</div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      {activePage === 'tools' && renderRegularToolsPage()}
      {activePage === 'whatsapp' && renderWhatsappPage()}
      {activePage === 'stt' && <STT onBack={() => setActivePage('tools')} />}
      {activePage === 'telegram' && renderSimplePage('Telegram Templates')}
      {activePage === 'email' && renderSimplePage('Email Templates')}
      {activePage === 'sms' && renderSimplePage('SMS Templates')}
    </div>
  );
};

export default ToolsManagement;
