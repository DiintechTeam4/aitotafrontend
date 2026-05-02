import { useState } from "react";
import { FiSearch, FiDownload, FiRefreshCw, FiPhone, FiMail, FiMapPin, FiGlobe, FiUser, FiFilter, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const SOURCES = [
  { key: "justdial", label: "JustDial", color: "bg-orange-500", textColor: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { key: "indiamart", label: "IndiaMart", color: "bg-green-600", textColor: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
];

const LeadScraper = ({ clientId }) => {
  const [activeSource, setActiveSource] = useState("justdial");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [expandedLead, setExpandedLead] = useState(null);
  const [savingIds, setSavingIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [apiConfig, setApiConfig] = useState({ justdial: { apiKey: "", clientId: "" }, indiamart: { apiKey: "", mobileNo: "" } });
  const [showConfig, setShowConfig] = useState(false);

  const handleSearch = async (pageNum = 1) => {
    if (!query.trim()) { setError("Please enter a search keyword"); return; }
    setLoading(true);
    setError("");
    setLeads([]);
    try {
      const token = sessionStorage.getItem("admintoken") || sessionStorage.getItem("clienttoken") || localStorage.getItem("admintoken") || localStorage.getItem("clienttoken");
      const params = new URLSearchParams({ source: activeSource, query, location, category, page: pageNum, clientId });
      const res = await fetch(`${API_BASE_URL}/lead-scraper/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch leads");
      setLeads(data.leads || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || 0);
      setPage(pageNum);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (lead) => {
    const id = lead.id || lead.phone;
    setSavingIds(prev => new Set([...prev, id]));
    try {
      const token = sessionStorage.getItem("admintoken") || sessionStorage.getItem("clienttoken") || localStorage.getItem("admintoken") || localStorage.getItem("clienttoken");
      const res = await fetch(`${API_BASE_URL}/lead-scraper/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead, source: activeSource, clientId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      setSavedIds(prev => new Set([...prev, id]));
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleSaveAll = async () => {
    for (const lead of leads) {
      const id = lead.id || lead.phone;
      if (!savedIds.has(id)) await handleSaveLead(lead);
    }
  };

  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = ["Name", "Phone", "Email", "Address", "City", "Category", "Website", "Rating", "Source"];
    const rows = leads.map(l => [
      l.name || "", l.phone || "", l.email || "", l.address || "",
      l.city || "", l.category || "", l.website || "", l.rating || "", activeSource
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads_${activeSource}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const src = SOURCES.find(s => s.key === activeSource);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lead Scraper</h2>
            <p className="text-sm text-gray-500 mt-1">Extract business leads from JustDial & IndiaMart</p>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <FiFilter className="w-4 h-4" /> API Config
          </button>
        </div>

        {/* API Config Panel */}
        {showConfig && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">API Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-orange-600 uppercase">JustDial</p>
                <input placeholder="API Key" value={apiConfig.justdial.apiKey}
                  onChange={e => setApiConfig(p => ({ ...p, justdial: { ...p.justdial, apiKey: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input placeholder="Client ID" value={apiConfig.justdial.clientId}
                  onChange={e => setApiConfig(p => ({ ...p, justdial: { ...p.justdial, clientId: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-green-600 uppercase">IndiaMart</p>
                <input placeholder="API Key" value={apiConfig.indiamart.apiKey}
                  onChange={e => setApiConfig(p => ({ ...p, indiamart: { ...p.indiamart, apiKey: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <input placeholder="Mobile Number" value={apiConfig.indiamart.mobileNo}
                  onChange={e => setApiConfig(p => ({ ...p, indiamart: { ...p.indiamart, mobileNo: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
          </div>
        )}

        {/* Source Tabs */}
        <div className="flex gap-2 mb-4">
          {SOURCES.map(s => (
            <button key={s.key} onClick={() => { setActiveSource(s.key); setLeads([]); setError(""); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSource === s.key ? `${s.color} text-white shadow-md` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text" placeholder="Search keyword (e.g. plumber, restaurant...)"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch(1)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text" placeholder="City / Location"
              value={location} onChange={e => setLocation(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-44"
            />
          </div>
          <input
            type="text" placeholder="Category (optional)"
            value={category} onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-44"
          />
          <button
            onClick={() => handleSearch(1)} disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2 ${src.color} hover:opacity-90 disabled:opacity-60`}
          >
            {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4" />}
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-red-700 text-sm">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Results Header */}
        {leads.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{leads.length}</span> of <span className="font-semibold text-gray-900">{totalResults}</span> results
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${src.bg} ${src.textColor} border ${src.border}`}>{src.label}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={handleSaveAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <FiUser className="w-4 h-4" /> Save All to Contacts
              </button>
              <button onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 flex items-center gap-2">
                <FiDownload className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        )}

        {/* Lead Cards */}
        {leads.length > 0 ? (
          <div className="space-y-3">
            {leads.map((lead, i) => {
              const id = lead.id || lead.phone;
              const isExpanded = expandedLead === id;
              const isSaved = savedIds.has(id);
              const isSaving = savingIds.has(id);
              return (
                <div key={id || i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl ${src.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {(lead.name?.[0] || "?").toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{lead.name || "—"}</h4>
                          {lead.category && <span className="text-xs text-gray-500">{lead.category}</span>}
                        </div>
                        {lead.rating && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            ★ {lead.rating}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                        {lead.phone && (
                          <span className="flex items-center gap-1"><FiPhone className="w-3 h-3 text-green-500" />{lead.phone}</span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1"><FiMail className="w-3 h-3 text-blue-500" />{lead.email}</span>
                        )}
                        {lead.city && (
                          <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 text-red-500" />{lead.city}</span>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <FiGlobe className="w-3 h-3" />Website
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSaveLead(lead)}
                        disabled={isSaved || isSaving}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSaved ? "bg-green-100 text-green-700 cursor-default" : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"}`}
                      >
                        {isSaving ? "Saving..." : isSaved ? "✓ Saved" : "Save"}
                      </button>
                      <button onClick={() => setExpandedLead(isExpanded ? null : id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {[
                          { label: "Full Address", value: lead.address },
                          { label: "Pincode", value: lead.pincode },
                          { label: "State", value: lead.state },
                          { label: "Mobile 2", value: lead.phone2 },
                          { label: "Description", value: lead.description },
                          { label: "Working Hours", value: lead.workingHours },
                          { label: "Reviews", value: lead.reviews },
                          { label: "Established", value: lead.established },
                          { label: "Product", value: lead.productTitle },
                          { label: "Member Since", value: lead.memberSince },
                        ].filter(f => f.value).map(({ label, value }) => (
                          <div key={label} className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{label}</p>
                            <p className="text-xs text-gray-800">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <FiSearch className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Search for Leads</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Enter a keyword and location to extract business leads from {src.label}
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4 ${activeSource === "justdial" ? "border-orange-500" : "border-green-600"}`}></div>
            <p className="text-sm text-gray-500">Fetching leads from {src.label}...</p>
          </div>
        ) : null}

        {/* Pagination */}
        {leads.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => handleSearch(page - 1)} disabled={page <= 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => handleSearch(page + 1)} disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadScraper;
