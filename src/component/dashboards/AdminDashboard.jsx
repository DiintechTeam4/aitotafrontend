import React, { useState, useEffect, useMemo } from "react";
import { useAsyncError, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import {
  FaChartBar,
  FaDatabase,
  FaRobot,
  FaComments,
  FaHeadset,
  FaCog,
  FaShieldAlt,
  FaQuestionCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaExternalLinkAlt,
  FaAngleLeft,
  FaPlus,
  FaUsers,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaUserTie,
  FaRupeeSign,
} from "react-icons/fa";
import ApprovalFormDetails from "./components/ApprovalFormDetails";
import HumanAgentManagement from "./components/HumanAgentManagement";
import AdminAgents from "./components/AdminAgents";
import AllAgents from "./components/AllAgents";
import SystemPrompts from "./components/SystemPrompts";
import PlanManagement from "./components/PlanManagement";
import CreditManagement from "./components/CreditManagement";
import CouponManagement from "./components/CouponManagement";
import ToolsManagement from "./components/ToolsManagement";

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem("admin_active_tab") || "Overview";
    } catch {
      return "Overview";
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [clients, setclients] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [clientcount, setclientcount] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [loggedInClients, setLoggedInClients] = useState(new Set());
  const [Auth, setAuth] = useState("Authenticate");
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    websiteUrl: "",
    city: "",
    pincode: "",
    gstNo: "",
    panNo: "",
    mobileNo: "",
    address: "",
  });
  const [loadingClientId, setLoadingClientId] = useState(null);
  const [businessLogoFile, setBusinessLogoFile] = useState(null);
  const [businessLogoKey, setBusinessLogoKey] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [reviewClientId, setReviewClientId] = useState(null);
  const [showHumanAgentModal, setShowHumanAgentModal] = useState(false);
  const [selectedClientForHumanAgent, setSelectedClientForHumanAgent] =
    useState(null);
  const [clientTokenForHumanAgent, setClientTokenForHumanAgent] =
    useState(null);

  // Helpers: JWT decode and expiry check
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const isTokenExpired = (token) => {
    if (!token) return true;
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return true;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds;
  };

  const redirectToAdminLogin = () => {
    try {
      navigate("/admin/login");
    } catch {
      window.location.href = "/admin/login";
    }
  };

  const ensureAdminAuthValid = () => {
    const token =
      localStorage.getItem("admintoken") ||
      sessionStorage.getItem("admintoken");
    if (!token || isTokenExpired(token)) {
      redirectToAdminLogin();
      return false;
    }
    return true;
  };

  // On mount, ensure token is valid; if expired, redirect to admin login
  useEffect(() => {
    ensureAdminAuthValid();
  }, []);

  // Sync tab with URL query param
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlTab = sp.get("tab");
      if (urlTab) {
        setActiveTab(urlTab);
      }
    } catch {}
  }, []);

  // React to location.search changes (without remount)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || window.location.search);
      const urlTab = sp.get("tab");
      if (urlTab && urlTab !== activeTab) {
        setActiveTab(urlTab);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Persist active tab across refreshes
  useEffect(() => {
    try {
      localStorage.setItem("admin_active_tab", activeTab);
      const sp = new URLSearchParams(window.location.search);
      sp.set("tab", activeTab);
      const newUrl = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, "", newUrl);
    } catch {}
  }, [activeTab]);

  // Default Client tab to show Prime list
  useEffect(() => {
    if (activeTab === "Client") {
      setClientTypeFilter("prime");
    }
  }, [activeTab]);

  // Auto-close modals when switching tabs to avoid overlap
  useEffect(() => {
    if (showApprovalModal || reviewClientId) {
      setShowApprovalModal(false);
      setReviewClientId(null);
    }
    if (
      showHumanAgentModal ||
      selectedClientForHumanAgent ||
      clientTokenForHumanAgent
    ) {
      setShowHumanAgentModal(false);
      setSelectedClientForHumanAgent(null);
      setClientTokenForHumanAgent(null);
    }
  }, [activeTab]);

  // Tools/Templates state
  const [activeTool, setActiveTool] = useState(null); // 'whatsapp' | 'telegram' | 'email' | 'sms'
  const [templates, setTemplates] = useState([]);
  const [externalTemplates, setExternalTemplates] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [assignAgentId, setAssignAgentId] = useState("");
  const [accessRequests, setAccessRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  // const [agentCounts, setAgentCounts] = useState({}); // temporarily disabled
  const [openMenuTemplateId, setOpenMenuTemplateId] = useState(null);
  const [clientStatusFilter, setClientStatusFilter] = useState("all"); // all | approved | pending

  const fetchTemplates = async (platform) => {
    try {
      // For WhatsApp, load from external service provided
      if (platform === "whatsapp") {
        const resp = await fetch(
          "https://whatsapp-template-module.onrender.com/api/whatsapp/get-templates"
        );
        const json = await resp.json();
        const arr = Array.isArray(json?.templates) ? json.templates : [];
        // Normalize into a common shape used by the grid
        const normalized = arr.map((t) => {
          const bodyComponent = (t.components || []).find(
            (c) => c.type === "BODY"
          );
          const buttonsComp = (t.components || []).find(
            (c) => c.type === "BUTTONS"
          );
          const firstUrl =
            buttonsComp &&
            Array.isArray(buttonsComp.buttons) &&
            buttonsComp.buttons[0]?.url;
          const headerComp = (t.components || []).find(
            (c) => c.type === "HEADER"
          );
          return {
            _id: t.id || t.name,
            name: t.name,
            url: firstUrl || "",
            imageUrl:
              headerComp?.format === "IMAGE"
                ? headerComp.example?.header_handle?.[0]
                : "",
            description: bodyComponent?.text || "",
            language: t.language,
            status: t.status,
            category: t.category,
            sub_category: t.sub_category,
            parameter_format: t.parameter_format,
            components: t.components,
          };
        });
        setTemplates(normalized);
        setExternalTemplates(true);
      } else {
        const resp = await fetch(
          `${API_BASE_URL}/templates?platform=${platform}`
        );
        const json = await resp.json();
        setTemplates(json?.success ? json.data || [] : []);
        setExternalTemplates(false);
      }
      setSelectedTemplateIds([]);
    } catch (e) {
      setTemplates([]);
      setSelectedTemplateIds([]);
      setExternalTemplates(false);
    }
  };

  useEffect(() => {
    if (
      activeTool === "whatsapp" ||
      activeTool === "telegram" ||
      activeTool === "email" ||
      activeTool === "sms"
    ) {
      fetchTemplates(activeTool);
      fetchAccessRequests({ status: "pending", platform: activeTool });
    }
  }, [activeTool]);

  const fetchAccessRequests = async (params = { status: "pending" }) => {
    try {
      setLoadingRequests(true);
      const qs = new URLSearchParams(params).toString();
      const resp = await fetch(
        `${API_BASE_URL}/agent-access/requests${qs ? `?${qs}` : ""}`
      );
      const json = await resp.json();
      setAccessRequests(json?.success ? json.data || [] : []);
    } catch (e) {
      setAccessRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const approveAccessRequest = async (
    requestId,
    templateName,
    templateData
  ) => {
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const resp = await fetch(`${API_BASE_URL}/agent-access/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestId, templateName, templateData }),
      });
      const json = await resp.json();
      if (json?.success) {
        await fetchAccessRequests({ status: "pending", platform: activeTool });
        alert("Approved and updated agent successfully");
      } else {
        alert(json?.message || "Failed to approve");
      }
    } catch (e) {
      alert("Failed to approve");
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
      const selectedTemplates = templates.filter((t) =>
        selectedTemplateIds.includes(t._id)
      );

      const resp = await fetch(`${API_BASE_URL}/templates/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("admintoken") ||
            sessionStorage.getItem("admintoken")
          }`,
        },
        body: JSON.stringify({
          agentId: assignAgentId,
          templateIds: selectedTemplateIds,
          templates: selectedTemplates, // Send full template data for WhatsApp
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.success)
        throw new Error(json.message || "Failed to assign");
      alert("Templates assigned to agent");
      setSelectedTemplateIds([]);
      setAssignAgentId("");
    } catch (e) {
      alert(e.message || "Failed to assign templates");
    }
  };

  // Check if screen is mobile and handle resize events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Close sidebar automatically on mobile after clicking a tab
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  const getclients = async (req, res) => {
    try {
      if (!ensureAdminAuthValid()) return;
      setIsLoading(true);
      const adminToken =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      if (!adminToken) {
        console.error("No admin token found");
        setIsLoading(false);
        redirectToAdminLogin();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/getclients`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        redirectToAdminLogin();
        return;
      }

      const data = await response.json();
      console.log(data.data);
      setclients(data.data);
      setclientcount(data.count);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(activeTab);
    if (activeTab == "Client" || activeTab == "Overview") {
      getclients();
    }
  }, [activeTab]);

  // Open login modal for a specific client
  const openClientLogin = async (clientId, clientEmail, clientName) => {
    try {
      setLoadingClientId(clientId);
      console.log("Starting client login process for:", clientId);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("admintoken");
      console.log("Admin token:", adminToken);

      if (!adminToken) {
        console.error("No admin token found");
        alert("Admin session expired. Please login again.");
        return;
      }

      // Make API call to get client token
      const response = await fetch(
        `${API_BASE_URL}/admin/get-client-token/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to get client access token"
        );
      }

      const data = await response.json();
      console.log("Client token response:", data);

      if (data.token) {
        // First open a blank window
        setAuth("Login");
        const clientWindow = window.open("about:blank", "_blank");

        if (!clientWindow) {
          throw new Error(
            "Failed to open new window. Please allow popups for this site."
          );
        }

        // Add client to logged in set
        setLoggedInClients((prev) => new Set([...prev, clientId]));

        // Write the HTML content that will set sessionStorage and redirect
        const html = `
          <html>
            <head>
              <title>Loading...</title>
              <script>
                // Clear any existing session data
                sessionStorage.clear();
                
                // Set the credentials in sessionStorage
                sessionStorage.setItem('clienttoken', '${data.token}');
                sessionStorage.setItem('clientData', JSON.stringify({
                  role: 'client',
                  userType: 'client',
                  name: '${clientName}',
                  email: '${clientEmail}',
                  clientId: '${clientId}'
                }));
                
                // Redirect to client dashboard
                window.location.href = '/auth/dashboard';
              </script>
            </head>
            <body>
              <p>Loading client dashboard...</p>
            </body>
          </html>
        `;

        // Write the HTML to the new window
        clientWindow.document.open();
        clientWindow.document.write(html);
        clientWindow.document.close();

        // Add event listener for window close
        clientWindow.onbeforeunload = () => {
          setLoggedInClients((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clientId);
            return newSet;
          });
        };
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("Error in openClientLogin:", error);
      alert(error.message || "Failed to access client dashboard");
    } finally {
      setLoadingClientId(null);
    }
  };

  // Filter clients based on search term
  const [clientTypeFilter, setClientTypeFilter] = useState("all");

  const clientTypeCounts = useMemo(() => {
    const counts = {
      all: 0,
      prime: 0,
      demo: 0,
      owned: 0,
      testing: 0,
      new: 0,
      rejected: 0,
    };
    if (Array.isArray(clients)) {
      counts.all = clients.length;
      clients.forEach((c) => {
        const t = (c.clientType || "").toLowerCase();
        if (t === "prime") counts.prime++;
        else if (t === "demo") counts.demo++;
        else if (t === "owned") counts.owned++;
        else if (t === "testing") counts.testing++;
        else if (t === "new") counts.new++;
        else if (t === "rejected") counts.rejected++;
      });
    }
    return counts;
  }, [clients]);

  const filteredClients = clients
    ? clients
        .filter((client) => {
          if (clientStatusFilter === "approved") return !!client.isApproved;
          if (clientStatusFilter === "pending") return !client.isApproved;
          return true;
        })
        .filter((client) => {
          if (clientTypeFilter === "all") return true;
          return (client.clientType || "").toLowerCase() === clientTypeFilter;
        })
        .filter(
          (client) =>
            client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.businessName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            client.mobileNo?.includes(searchTerm) ||
            client.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.gstNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.panNo?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : [];

  const navItems = [
    { name: "Overview", icon: <FaChartBar /> },
    { name: "Client", icon: <FaUsers /> },
    // { name: "Agents", icon: <FaUserTie /> },
    {
      name: "Accounts",
      icon: <FaRupeeSign />,
      subItems: ["Plans", "Credits", "Coupons", "Payments"],
    },
    { name: "Tools", icon: <FaCog /> },
    {
      name: "Datastore",
      icon: <FaDatabase />,
      subItems: ["Chats"],
    },
    { name: "AI Agent", icon: <FaRobot /> },
    // { name: "Tickets", icon: <FaClipboardList /> },
    // { name: "Users", icon: <FaUsers /> },
  ];

  const bottomNavItems = [
    { name: "Support", icon: <FaHeadset />, subItems: ["Tickets"] },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  const sidebarWidth = isSidebarOpen ? "16rem" : "5rem";

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleBusinessLogoChange = async (e) => {
    const file = e.target.files[0];
    setBusinessLogoFile(file);

    if (file) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/client/upload-url?fileName=${encodeURIComponent(
            file.name
          )}&fileType=${encodeURIComponent(file.type)}`
        );
        const data = await res.json();
        if (data.success && data.url && data.key) {
          await fetch(data.url, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          });
          setBusinessLogoKey(data.key);
        } else {
          alert("Failed to get upload URL");
        }
      } catch (err) {
        alert("Error uploading logo");
      }
    }
  };

  const handleAddClient = async () => {
    try {
      if (newClient.password !== newClient.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/client/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admintoken")}`,
        },
        body: JSON.stringify({
          ...newClient,
          businessLogoKey: businessLogoKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create client");
      }

      setShowAddClientModal(false);
      setNewClient({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        websiteUrl: "",
        city: "",
        pincode: "",
        gstNo: "",
        panNo: "",
        mobileNo: "",
        address: "",
      });
      setBusinessLogoFile(null);
      setBusinessLogoKey("");
      alert("Client created successfully");
      await getclients();
    } catch (error) {
      console.error("Error creating client:", error);
      alert(error.message || "Failed to create client. Please try again.");
    }
  };

  const handleDeleteClient = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/deleteclient/${clientToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete client");
      }

      setShowDeleteModal(false);
      setClientToDelete(null);
      await getclients();
      alert("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert(error.message || "Failed to delete client. Please try again.");
    }
  };

  const confirmDelete = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteModal(true);
  };

  const handleApproveClient = async (clientId) => {
    try {
      // You can add an approval API call here if needed
      // const response = await fetch(`${API_BASE_URL}/admin/approve-client/${clientId}`, {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem("admintoken")}`,
      //     "Content-Type": "application/json",
      //   },
      // });

      alert("Client approved successfully!");
      setShowApprovalModal(false);
      setReviewClientId(null);
    } catch (err) {
      console.error("Error approving client:", err);
      alert(err.message || "Failed to approve client");
    }
  };

  // Open Human Agent Management
  const openHumanAgentManagement = async (clientId, clientName) => {
    try {
      setLoadingClientId(clientId);
      console.log("Opening Human Agent Management for:", clientId);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("admintoken");
      console.log("Admin token:", adminToken);
      if (!adminToken) {
        alert("Admin token not found. Please login again.");
        return;
      }

      // Get client token first
      const response = await fetch(
        `${API_BASE_URL}/admin/get-client-token/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get client token");
      }

      const data = await response.json();
      const clientToken = data.token;

      // Set the client info and token for HumanAgent management
      setSelectedClientForHumanAgent({ id: clientId, name: clientName });
      setClientTokenForHumanAgent(clientToken);
      setShowHumanAgentModal(true);
      setLoadingClientId(null);
    } catch (error) {
      console.error("Error opening Human Agent Management:", error);
      alert("Failed to open Human Agent Management. Please try again.");
      setLoadingClientId(null);
    }
  };

  // Fetch agent count per client using admin token -> client token -> /client/agents
  // const fetchAgentCountForClient = async (clientId) => {
  //   try {
  //     if (!clientId || agentCounts[clientId] !== undefined) return; // skip if already fetched
  //     const adminToken =
  //       localStorage.getItem("admintoken") ||
  //       sessionStorage.getItem("admintoken");
  //     if (!adminToken) return;
  //     const tokenResp = await fetch(
  //       `${API_BASE_URL}/admin/get-client-token/${clientId}`,
  //       {
  //         headers: { Authorization: `Bearer ${adminToken}` },
  //       }
  //     );
  //     if (!tokenResp.ok) return;
  //     const tokenJson = await tokenResp.json();
  //     const clientToken = tokenJson?.token;
  //     if (!clientToken) return;
  //     const agentsResp = await fetch(`${API_BASE_URL}/client/agents`, {
  //       headers: {
  //         Authorization: `Bearer ${clientToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     if (!agentsResp.ok) return;
  //     const agentsJson = await agentsResp.json();
  //     const count = Array.isArray(agentsJson?.data)
  //       ? agentsJson.data.length
  //       : Array.isArray(agentsJson)
  //       ? agentsJson.length
  //       : 0;
  //     setAgentCounts((prev) => ({ ...prev, [clientId]: count }));
  //   } catch (e) {
  //     // Silent fail; keep UI responsive
  //     setAgentCounts((prev) => ({ ...prev, [clientId]: 0 }));
  //   }
  // };

  // When filtered clients change, prefetch counts (best-effort)
  // useEffect(() => {
  //   try {
  //     (filteredClients || [])
  //       .slice(0, 50)
  //       .forEach((c) => fetchAgentCountForClient(c._id));
  //   } catch {}
  // }, [filteredClients]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-bold">
                  <FaPlus className="text-sm" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Add New Client
                </h2>
              </div>
              <button
                className="text-white hover:text-red-200 transition-colors p-1"
                onClick={() => setShowAddClientModal(false)}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Business Information Section (moved above Personal Information) */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter business name"
                      value={newClient.businessName}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          businessName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="https://example.com"
                      value={newClient.websiteUrl}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          websiteUrl: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter GST number"
                      value={newClient.gstNo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, gstNo: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter PAN number"
                      value={newClient.panNo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, panNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Logo
                    </label>
                    <div className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        onChange={handleBusinessLogoChange}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Upload your business logo (PNG, JPG, GIF up to 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Section (moved below Business Information) */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter full name"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter email address"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter mobile number"
                      value={newClient.mobileNo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, mobileNo: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter address"
                      value={newClient.address}
                      onChange={(e) =>
                        setNewClient({ ...newClient, address: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter city"
                      value={newClient.city}
                      onChange={(e) =>
                        setNewClient({ ...newClient, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter pincode"
                      value={newClient.pincode}
                      onChange={(e) =>
                        setNewClient({ ...newClient, pincode: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Account Security Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter password"
                      value={newClient.password}
                      onChange={(e) =>
                        setNewClient({ ...newClient, password: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Confirm password"
                      value={newClient.confirmPassword}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-500">* Required fields</p>
              <div className="flex space-x-3">
                <button
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setShowAddClientModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  onClick={handleAddClient}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Confirm Delete
              </h2>
              <p className="text-center text-gray-600 mb-4">
                Are you sure you want to delete this client? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={handleDeleteClient}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && reviewClientId && (
        <ApprovalFormDetails
          clientId={reviewClientId}
          onClose={() => {
            setShowApprovalModal(false);
            setReviewClientId(null);
          }}
          onApprove={handleApproveClient}
        />
      )}

      {/* Human Agent Management Modal */}
      {showHumanAgentModal &&
        selectedClientForHumanAgent &&
        clientTokenForHumanAgent && (
          <HumanAgentManagement
            clientId={selectedClientForHumanAgent.id}
            clientToken={clientTokenForHumanAgent}
            onClose={() => {
              setShowHumanAgentModal(false);
              setSelectedClientForHumanAgent(null);
              setClientTokenForHumanAgent(null);
            }}
            onUpdated={() => {
              // Refresh clients after updates in modal (e.g., clientType changes)
              getclients();
            }}
          />
        )}

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full opacity-50 z-40 bg-black"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full w-64"
            : isSidebarOpen
            ? "w-64"
            : "w-20"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-bold">
                A
              </div>
              <h4 className="m-0 font-semibold text-lg text-white">
                Admin Portal
              </h4>
            </div>
          )}
          <button
            className="text-white hover:text-gray-200 focus:outline-none"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4">
            {navItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                    activeTab === item.name ||
                    (item.subItems && item.subItems.includes(activeTab))
                      ? "bg-red-50 text-red-600 border-r-4 border-red-500"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (item.subItems) {
                      // For Accounts, show submenu and select Plans by default
                      if (item.name === "Accounts") {
                        if (
                          activeTab === item.name ||
                          item.subItems.includes(activeTab)
                        ) {
                          setActiveTab("Overview"); // Close submenu if already open
                        } else {
                          setActiveTab("Plans"); // Open submenu with Plans selected by default
                        }
                      } else if (item.name === "Datastore") {
                        if (
                          activeTab === item.name ||
                          item.subItems.includes(activeTab)
                        ) {
                          setActiveTab("Overview"); // Close submenu if already open
                        } else {
                          setActiveTab("Datastore"); // Open submenu with Datastore selected by default
                        }
                      } else {
                        // For other items with submenus, toggle the submenu
                        if (activeTab === item.name) {
                          setActiveTab("Overview"); // Close submenu
                        } else {
                          setActiveTab(item.name); // Open submenu
                        }
                      }
                    } else {
                      handleTabClick(item.name);
                    }
                  }}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </button>

                {/* Submenu for Accounts and Datastore */}
                {isSidebarOpen &&
                  item.subItems &&
                  (item.subItems.includes(activeTab) ||
                    activeTab === item.name) && (
                    <div className="ml-12 mt-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          className={`flex items-center w-full py-2 text-left transition-colors duration-200 ${
                            activeTab === subItem
                              ? "text-red-600 font-medium"
                              : "text-gray-600 hover:text-red-600"
                          }`}
                          onClick={() => setActiveTab(subItem)}
                        >
                          <span>{subItem}</span>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Bottom Navigation - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                    activeTab === item.name ||
                    (item.subItems && item.subItems.includes(activeTab))
                      ? "bg-red-50 text-red-600 border-r-4 border-red-500"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (item.subItems) {
                      // For Accounts, show submenu and select Plans by default
                      if (item.name === "Accounts") {
                        if (
                          activeTab === item.name ||
                          item.subItems.includes(activeTab)
                        ) {
                          setActiveTab("Overview"); // Close submenu if already open
                        } else {
                          setActiveTab("Plans"); // Open submenu with Plans selected by default
                        }
                      } else if (item.name === "Datastore") {
                        if (
                          activeTab === item.name ||
                          item.subItems.includes(activeTab)
                        ) {
                          setActiveTab("Overview"); // Close submenu if already open
                        } else {
                          setActiveTab("Chats"); // Open submenu with Chats selected by default
                        }
                      } else if (item.name === "Support") {
                        if (
                          activeTab === item.name ||
                          item.subItems.includes(activeTab)
                        ) {
                          setActiveTab("Overview"); // Close submenu if already open
                        } else {
                          setActiveTab("Support"); // Open submenu with Support selected by default
                        }
                      } else {
                        // For other items with submenus, toggle the submenu
                        if (activeTab === item.name) {
                          setActiveTab("Overview"); // Close submenu
                        } else {
                          setActiveTab(item.name); // Open submenu
                        }
                      }
                    } else {
                      handleTabClick(item.name);
                    }
                  }}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </button>

                {/* Submenu for Accounts and Settings */}
                {isSidebarOpen &&
                  item.subItems &&
                  (item.subItems.includes(activeTab) ||
                    activeTab === item.name) && (
                    <div className="ml-12 mt-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          className={`flex items-center w-full py-2 text-left transition-colors duration-200 ${
                            activeTab === subItem
                              ? "text-red-600 font-medium"
                              : "text-gray-600 hover:text-red-600"
                          }`}
                          onClick={() => {
                            if (subItem === "Log out") {
                              onLogout();
                            } else if (
                              item.name === "Accounts" ||
                              item.name === "Datastore" ||
                              item.name === "Support"
                            ) {
                              setActiveTab(subItem);
                            }
                          }}
                        >
                          {subItem === "Log out" && (
                            <FaSignOutAlt className="mr-2" />
                          )}
                          <span>{subItem}</span>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`${
          isMobile ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-white shadow-sm">
            <div className="flex justify-between items-center p-4">
              <button
                className="p-2 text-gray-600 hover:text-gray-800"
                onClick={toggleSidebar}
              >
                <FaBars size={20} />
              </button>
              <h4 className="font-bold text-lg">Admin Dashboard</h4>
              <div className="w-8"></div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Content based on active tab */}
            {activeTab === "Overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Total Clients
                  </h5>
                  <h2 className="text-3xl my-2 text-red-600">{clientcount}</h2>
                  <p className="text-sm text-gray-600">
                    12% increase from last month
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Active Sessions
                  </h5>
                  <h2 className="text-3xl my-2 text-red-600">423</h2>
                  <p className="text-sm text-gray-600">
                    5% increase from yesterday
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    AI Interactions
                  </h5>
                  <h2 className="text-3xl my-2 text-red-600">8,732</h2>
                  <p className="text-sm text-gray-600">
                    18% increase from last week
                  </p>
                </div>
              </div>
            )}
            {/* Dashboard Content based on active tab */}
            {activeTab === "Agents" && <AdminAgents />}

            {activeTab === "AI Agent" && <AllAgents />}
            {activeTab === "System Prompts" && <SystemPrompts />}

            {activeTab === "Plans" && <PlanManagement />}

            {activeTab === "Credits" && <CreditManagement />}

            {activeTab === "Coupons" && <CouponManagement />}

            {activeTab === "Payments" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Payment Management
                </h3>
                <p className="text-gray-600">
                  Payment management functionality coming soon...
                </p>
              </div>
            )}

            {activeTab === "Datastore" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Datastore Management
                </h3>
                <p className="text-gray-600">
                  Datastore management functionality coming soon...
                </p>
              </div>
            )}

            {activeTab === "Chats" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Chat Management
                </h3>
                <p className="text-gray-600">
                  Chat management functionality coming soon...
                </p>
              </div>
            )}

            {activeTab === "Support" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Support Management
                </h3>
                <p className="text-gray-600">
                  Support management functionality coming soon...
                </p>
              </div>
            )}

            {activeTab === "Tickets" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Support Tickets
                </h3>
                <p className="text-gray-600">
                  Support ticket management functionality coming soon...
                </p>
              </div>
            )}

            {activeTab === "Tools" && <ToolsManagement />}

            {/* Client Table */}
            {activeTab === "Client" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Search and filters */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Client List
                    </h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowAddClientModal(true)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <FaPlus className="mr-2" />
                        Add Client
                      </button>
                    </div>
                  </div>
                </div>

                {/* filter Button for type of clients*/}
                <div className="p-4 border-b border-gray-100 flex justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    {[
                      { key: "all", label: "All" },
                      { key: "new", label: "New" },
                      { key: "prime", label: "Prime" },
                      { key: "demo", label: "Demo" },
                      { key: "owned", label: "In-house" },
                      { key: "testing", label: "Testing" },
                      { key: "rejected", label: "Rejected" },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setClientTypeFilter(btn.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          clientTypeFilter === btn.key
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {btn.label}
                        <span
                          className={`ml-2 inline-block text-xs rounded-full px-2 py-0.5 ${
                            clientTypeFilter === btn.key
                              ? "bg-red-500 text-white"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {clientTypeCounts[btn.key] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <FaSearch className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading clients...</p>
                    </div>
                  ) : !clients || clients.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No clients found.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            SNo.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Agents
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Business Details
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Contact Info
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                            KYC
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Actions
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                            Team Settings
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client, index) => (
                          <tr
                            key={index}
                            onClick={() => {
                              setReviewClientId(client._id);
                              setShowApprovalModal(true);
                            }}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-gray-100 cursor-pointer`}
                            title="Click to review client"
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-center text-xs text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-4 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                {client.businessLogoUrl ? (
                                  <img
                                    src={client.businessLogoUrl}
                                    alt={client.businessName || client.name}
                                    className="flex-shrink-0 h-12 w-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                                    {client.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {client.businessName}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Client since {formatDate(client.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              {/* {agentCounts[client._id] === undefined ? (
                                <span className="inline-flex items-center px-2 py-1 text-gray-500 text-xs">
                                  <span className="inline-block h-3 w-3 mr-2 animate-spin rounded-full border-[2px] border-gray-300 border-t-gray-600"></span>
                                  Loading
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-gray-700 text-xs">
                                  {agentCounts[client._id]}
                                </span>
                              )} */}
                              <span>-</span>
                            </td>
                            <td className="px-4 py-6">
                              <div className="text-sm font-medium text-gray-900">
                                {client.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {client.websiteUrl ? (
                                  <a
                                    href={client.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-red-600 hover:underline"
                                  >
                                    Website{" "}
                                    <FaExternalLinkAlt className="ml-1 text-xs" />
                                  </a>
                                ) : (
                                  "No website"
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              <div className="text-sm text-gray-900 font-medium">
                                {client.email}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {client.mobileNo}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {client.address}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {client.city}, {client.pincode}
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              <div className="text-sm text-gray-900">
                                <div className="text-xs text-gray-600">
                                  GST: {client.gstNo}
                                </div>
                                <div className="text-xs text-gray-600 mt-2">
                                  PAN: {client.panNo}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-6 text-center">
                              <div className="flex flex-row items-center gap-1 justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    openClientLogin(
                                      client._id,
                                      client.email,
                                      client.name
                                    );
                                  }}
                                  className={`inline-flex items-center justify-center w-24 ${
                                    loggedInClients.has(client._id)
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  } text-white px-3 py-2 rounded-md transition-colors text-xs font-semibold`}
                                  title={
                                    loggedInClients.has(client._id)
                                      ? "Client Logged In"
                                      : "Client Login"
                                  }
                                >
                                  {loggedInClients.has(client._id)
                                    ? "Logged In"
                                    : "Authenticate"}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-6 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();

                                  openHumanAgentManagement(
                                    client._id,
                                    client.name
                                  );
                                }}
                                disabled={loadingClientId === client._id}
                                className="inline-flex items-center justify-center w-10 h-10 transition-colors disabled:opacity-50"
                                title="Settings"
                              >
                                {loadingClientId === client._id ? (
                                  "..."
                                ) : (
                                  <FaCog className="text-sm" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
