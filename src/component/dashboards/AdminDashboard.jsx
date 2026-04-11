import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  FaUser,
  FaUserCog,
  FaEdit,
  FaTrash,
  FaEye,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
  FaIdCard,
} from "react-icons/fa";
import ApprovalFormDetails from "./components/ApprovalFormDetails";
import HumanAgentManagement from "./components/HumanAgentManagement";
import AdminAgents from "./components/AdminAgents";
import AllAgents from "./components/AllAgents";
import AgentConfigure from "./components/AgentConfigure";
import SystemPrompts from "./components/SystemPrompts";
import PlanManagement from "./components/PlanManagement";
import CreditManagement from "./components/CreditManagement";
import CouponManagement from "./components/CouponManagement";
import ToolsManagement from "./components/ToolsManagement";
import UserInfo from "./components/UserInfo";
import WhatsAppTemplateManagement from "./components/WhatsAppTemplateManagement";

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
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [showWhatsAppTemplateModal, setShowWhatsAppTemplateModal] = useState(false);
  const [whatsAppClientId, setWhatsAppClientId] = useState(null);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(null);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const adminDropdownRef = React.useRef(null);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editClientData, setEditClientData] = useState({
    name: "", email: "", businessName: "", websiteUrl: "",
    city: "", pincode: "", gstNo: "", panNo: "", mobileNo: "", address: "",
  });
  const [isSubmittingEditClient, setIsSubmittingEditClient] = useState(false);
  const [viewClientModal, setViewClientModal] = useState(null);

  // End-user (app user) profile field config per client
  const [endUserProfileClient, setEndUserProfileClient] = useState(null);
  const [endUserProfileFields, setEndUserProfileFields] = useState([]);
  const [endUserProfileLoading, setEndUserProfileLoading] = useState(false);
  const [endUserProfileSaving, setEndUserProfileSaving] = useState(false);

  const fetchEndUserProfileFields = async (clientId) => {
    setEndUserProfileLoading(true);
    try {
      if (!ensureAdminAuthValid()) return;
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const resp = await fetch(
        `${API_BASE_URL}/admin/clients/${clientId}/end-user-profile-fields`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.message || "Failed to load profile fields");
      }
      setEndUserProfileFields(json.data.fields || []);
    } catch (e) {
      alert(e.message || "Failed to load profile fields");
      setEndUserProfileClient(null);
    } finally {
      setEndUserProfileLoading(false);
    }
  };

  const openEndUserProfileSetup = (client) => {
    setEndUserProfileClient({
      id: client.userId,
      name: client.businessName || client.name || client.email,
    });
    fetchEndUserProfileFields(client.userId);
  };

  const saveEndUserProfileFields = async () => {
    if (!endUserProfileClient) return;
    setEndUserProfileSaving(true);
    try {
      if (!ensureAdminAuthValid()) return;
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const resp = await fetch(
        `${API_BASE_URL}/admin/clients/${endUserProfileClient.id}/end-user-profile-fields`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fields: endUserProfileFields }),
        }
      );
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.message || "Save failed");
      }
      setEndUserProfileFields(json.data.fields || []);
      alert("End-user profile fields saved");
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setEndUserProfileSaving(false);
    }
  };

  const addCustomEndUserField = () => {
    setEndUserProfileFields((prev) => [
      ...prev,
      {
        key: `custom_${Date.now()}`,
        label: "",
        required: false,
        locked: false,
        fieldType: "string",
        order: prev.length,
      },
    ]);
  };

  const removeEndUserField = (index) => {
    const row = endUserProfileFields[index];
    if (row?.locked) return;
    setEndUserProfileFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEndUserField = (index, patch) => {
    setEndUserProfileFields((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (!cur) return prev;
      if (cur.locked && patch.key !== undefined) return prev;
      next[index] = { ...cur, ...patch };
      return next;
    });
  };

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

  // Close settings dropdown when clicking outside
  useEffect(() => {
    if (!openSettingsMenu) return;
    const handler = () => setOpenSettingsMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openSettingsMenu]);

  // Close admin dropdown when clicking outside
  useEffect(() => {
    if (!showAdminDropdown) return;
    const handler = (e) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target)) {
        setShowAdminDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAdminDropdown]);

  // Get admin info from localStorage (saved at login time)
  const getAdminInfo = () => {
    try {
      const stored = localStorage.getItem('adminData');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed?.name || 'Admin',
          email: parsed?.email || '',
        };
      }
    } catch {}
    // Fallback: try JWT token
    const token = localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
    if (!token) return { name: 'Admin', email: '' };
    const payload = decodeJwt(token);
    return {
      name: payload?.name || payload?.username || 'Admin',
      email: payload?.email || '',
    };
  };
  const adminInfo = getAdminInfo();

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
  const prevTabRef = React.useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    setShowApprovalModal(false);
    setReviewClientId(null);
    setShowHumanAgentModal(false);
    setSelectedClientForHumanAgent(null);
    setClientTokenForHumanAgent(null);
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
        // Token invalid/expired — clear storage and redirect to login
        localStorage.removeItem("admintoken");
        localStorage.removeItem("adminData");
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
    { name: "User", icon: <FaUser /> },
    // { name: "Tickets", icon: <FaClipboardList /> },
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

  const getClientLogoUrl = (client) => {
    if (!client) return "";
    if (typeof client.businessLogoUrl === "string" && client.businessLogoUrl) {
      return client.businessLogoUrl;
    }
    if (
      client.businessLogo &&
      typeof client.businessLogo.url === "string" &&
      client.businessLogo.url
    ) {
      return client.businessLogo.url;
    }
    if (
      client.businessLogo &&
      typeof client.businessLogo === "string" &&
      client.businessLogo.startsWith("http")
    ) {
      return client.businessLogo;
    }
    return "";
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
      setIsSubmittingClient(true);
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
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      const adminTok =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/admin/deleteclient/${clientToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminTok}`,
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

  const openEditClient = (client) => {
    setEditingClient(client);
    setEditClientData({
      name: client.name || "",
      email: client.email || "",
      businessName: client.businessName || "",
      websiteUrl: client.websiteUrl || "",
      city: client.city || "",
      pincode: client.pincode || "",
      gstNo: client.gstNo || "",
      panNo: client.panNo || "",
      mobileNo: client.mobileNo || "",
      address: client.address || "",
    });
    setShowEditClientModal(true);
  };

  const handleEditClient = async () => {
    try {
      setIsSubmittingEditClient(true);
      const adminTok = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
      const response = await fetch(`${API_BASE_URL}/admin/updateclient/${editingClient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify(editClientData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update client");
      setShowEditClientModal(false);
      setEditingClient(null);
      alert("Client updated successfully");
      await getclients();
    } catch (error) {
      alert(error.message || "Failed to update client. Please try again.");
    } finally {
      setIsSubmittingEditClient(false);
    }
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
        <div className="fixed inset-0 bg-black/35 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 font-bold">
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
                  className={`px-6 py-2 rounded-lg transition-colors font-medium shadow-sm ${
                    isSubmittingClient
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  onClick={handleAddClient}
                  disabled={isSubmittingClient}
                >
                  {isSubmittingClient ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Client Modal - replaced by ApprovalFormDetails */}
      {false && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getClientLogoUrl(viewClientModal) ? (
                  <img src={getClientLogoUrl(viewClientModal)} alt="logo" className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.currentTarget.src = "/AitotaLogo.png"; }} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                    {(viewClientModal?.businessName?.[0] || viewClientModal?.name?.[0] || "C").toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">{viewClientModal.businessName || viewClientModal.name}</h2>
                  <p className="text-xs text-slate-300">Client since {formatDate(viewClientModal.createdAt)}</p>
                </div>
              </div>
              <button className="text-white hover:text-red-200" onClick={() => setViewClientModal(null)}>
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaUser className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Full Name</p>
                    <p className="text-sm text-gray-800 font-medium">{viewClientModal.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaEnvelope className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Email</p>
                    <p className="text-sm text-gray-800 break-all">{viewClientModal.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaPhone className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Mobile</p>
                    <p className="text-sm text-gray-800">{viewClientModal.mobileNo || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaBuilding className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Business Name</p>
                    <p className="text-sm text-gray-800">{viewClientModal.businessName || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaGlobe className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Website</p>
                    {viewClientModal.websiteUrl ? (
                      <a href={viewClientModal.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-red-600 hover:underline break-all">{viewClientModal.websiteUrl}</a>
                    ) : <p className="text-sm text-gray-800">—</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Location</p>
                    <p className="text-sm text-gray-800">{[viewClientModal.address, viewClientModal.city, viewClientModal.pincode].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaIdCard className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">GST Number</p>
                    <p className="text-sm text-gray-800 font-mono">{viewClientModal.gstNo || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaIdCard className="text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">PAN Number</p>
                    <p className="text-sm text-gray-800 font-mono">{viewClientModal.panNo || "—"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  viewClientModal.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {viewClientModal.isApproved ? "Approved" : "Pending Approval"}
                </span>
                {viewClientModal.clientType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                    {viewClientModal.clientType}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900" onClick={() => setViewClientModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-40 z-[60] flex items-center justify-center p-4">
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
      {showEditClientModal && editingClient && (
        <div className="fixed inset-0 bg-black/35 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative flex flex-col">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit Client</h2>
              <button className="text-white hover:text-red-200" onClick={() => setShowEditClientModal(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.name} onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.email} onChange={(e) => setEditClientData({ ...editClientData, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.businessName} onChange={(e) => setEditClientData({ ...editClientData, businessName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.mobileNo} onChange={(e) => setEditClientData({ ...editClientData, mobileNo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <input type="url" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.websiteUrl} onChange={(e) => setEditClientData({ ...editClientData, websiteUrl: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.city} onChange={(e) => setEditClientData({ ...editClientData, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.pincode} onChange={(e) => setEditClientData({ ...editClientData, pincode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.address} onChange={(e) => setEditClientData({ ...editClientData, address: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.gstNo} onChange={(e) => setEditClientData({ ...editClientData, gstNo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" value={editClientData.panNo} onChange={(e) => setEditClientData({ ...editClientData, panNo: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setShowEditClientModal(false)}>Cancel</button>
              <button
                className={`px-6 py-2 rounded-lg font-medium text-white ${isSubmittingEditClient ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                onClick={handleEditClient}
                disabled={isSubmittingEditClient}
              >
                {isSubmittingEditClient ? "Saving..." : "Save Changes"}
              </button>
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
          onWhatsAppClick={(clientId) => {
            setShowApprovalModal(false);
            setWhatsAppClientId(clientId);
            setShowWhatsAppTemplateModal(true);
          }}
        />
      )}

      {/* WhatsApp Template Management Modal */}
      {showWhatsAppTemplateModal && whatsAppClientId && (
        <WhatsAppTemplateManagement
          clientId={whatsAppClientId}
          onClose={() => {
            setShowWhatsAppTemplateModal(false);
            setWhatsAppClientId(null);
          }}
        />
      )}

      {/* End-user profile field schema (registration step 3) */}
      {endUserProfileClient && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaUserCog />
                  End-user profile setup
                </h2>
                <p className="text-sm text-slate-200 mt-1">
                  {endUserProfileClient.name} — fields users fill after email &amp; mobile
                  verification. Email and mobile cannot be removed.
                </p>
              </div>
              <button
                type="button"
                className="text-white hover:text-slate-200 p-1"
                onClick={() => {
                  setEndUserProfileClient(null);
                  setEndUserProfileFields([]);
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Public schema (for apps):{" "}
                <code className="text-xs bg-gray-100 px-1 rounded break-all">
                  {API_BASE_URL}/user-auth/client/
                  {endUserProfileClient.id}/end-user-profile-fields
                </code>
              </p>
              {endUserProfileLoading ? (
                <div className="py-12 text-center text-gray-500">Loading…</div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Key</th>
                          <th className="px-3 py-2">Label</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2 text-center">Required</th>
                          <th className="px-3 py-2 w-24" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {endUserProfileFields.map((row, idx) => (
                          <tr key={`${row.key}-${idx}`} className="bg-white">
                            <td className="px-3 py-2 align-middle">
                              {row.locked ? (
                                <span className="font-mono text-gray-700">
                                  {row.key}
                                </span>
                              ) : (
                                <input
                                  className="w-full border border-gray-200 rounded px-2 py-1 font-mono text-xs"
                                  value={row.key}
                                  onChange={(e) =>
                                    updateEndUserField(idx, {
                                      key: e.target.value
                                        .replace(/\s+/g, "_")
                                        .replace(/[^a-zA-Z0-9_]/g, ""),
                                    })
                                  }
                                />
                              )}
                              {row.locked && (
                                <span className="ml-2 text-xs text-amber-700 bg-amber-50 px-1 rounded">
                                  fixed
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input
                                className="w-full border border-gray-200 rounded px-2 py-1"
                                value={row.label}
                                onChange={(e) =>
                                  updateEndUserField(idx, {
                                    label: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              {row.locked ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                <select
                                  className="border border-gray-200 rounded px-2 py-1 w-full"
                                  value={row.fieldType || "string"}
                                  onChange={(e) =>
                                    updateEndUserField(idx, {
                                      fieldType: e.target.value,
                                    })
                                  }
                                >
                                  <option value="string">Short text</option>
                                  <option value="textarea">Long text</option>
                                  <option value="number">Number</option>
                                </select>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={!!row.required}
                                disabled={!!row.locked}
                                onChange={(e) =>
                                  updateEndUserField(idx, {
                                    required: e.target.checked,
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-2 text-right align-middle">
                              {!row.locked && (
                                <button
                                  type="button"
                                  className="text-red-600 text-xs hover:underline"
                                  onClick={() => removeEndUserField(idx)}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomEndUserField}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <FaPlus className="text-xs" /> Add field
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg"
                onClick={() => {
                  setEndUserProfileClient(null);
                  setEndUserProfileFields([]);
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={endUserProfileSaving || endUserProfileLoading}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
                onClick={saveEndUserProfileFields}
              >
                {endUserProfileSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
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
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out flex flex-col ${
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
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-slate-800 to-slate-900">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 font-bold">
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
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 py-4 overflow-y-auto scrollbar-hide pb-2">
            {navItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                    activeTab === item.name ||
                    (item.subItems && item.subItems.includes(activeTab))
                      ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-500"
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
                              ? "text-indigo-700 font-medium"
                              : "text-gray-600 hover:text-indigo-700"
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

          {/* Bottom Navigation - Sticky at bottom */}
          <div className="border-t-2 border-gray-200 bg-white flex-shrink-0 divide-y divide-gray-100">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                    activeTab === item.name ||
                    (item.subItems && item.subItems.includes(activeTab))
                      ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-500"
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
                              ? "text-indigo-700 font-medium"
                              : "text-gray-600 hover:text-indigo-700"
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
        {/* Top Header Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center px-6 py-3">
            {/* Left: Mobile menu + Page title */}
            <div className="flex items-center gap-3">
              {isMobile && (
                <button className="p-2 text-gray-600 hover:text-gray-800" onClick={toggleSidebar}>
                  <FaBars size={20} />
                </button>
              )}
              <h4 className="font-semibold text-gray-800 text-base">{activeTab}</h4>
            </div>

            {/* Right: Admin info with dropdown */}
            <div className="relative" ref={adminDropdownRef}>
              <button
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(adminInfo.name?.[0] || 'A').toUpperCase()}
                </div>
                {!isMobile && (
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{adminInfo.name}</p>
                    <p className="text-xs text-gray-500 leading-tight">{adminInfo.email}</p>
                  </div>
                )}
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showAdminDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAdminDropdown && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{adminInfo.name}</p>
                    <p className="text-xs text-gray-500 truncate">{adminInfo.email}</p>
                  </div>
                  <button
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                    onClick={() => { setShowAdminDropdown(false); setActiveTab('AdminProfile'); }}
                  >
                    <FaUser className="text-slate-500" /> Profile
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-2 border-t border-gray-100"
                    onClick={() => { setShowAdminDropdown(false); onLogout(); }}
                  >
                    <FaSignOutAlt className="text-red-500" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Content based on active tab */}
            {activeTab === "AdminProfile" && (
              <div className="max-w-lg mx-auto mt-6">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                  {/* Avatar + name */}
                  <div className="flex flex-col items-center py-10 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700">
                      {(adminInfo.name?.[0] || 'A').toUpperCase()}
                    </div>
                    <p className="mt-3 text-lg font-semibold text-gray-800">{adminInfo.name}</p>
                    <p className="text-sm text-gray-400">{adminInfo.email}</p>
                    <span className="mt-2 text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-0.5">Administrator</span>
                  </div>

                  {/* Info rows */}
                  <div className="divide-y divide-gray-100">
                    <div className="flex justify-between items-center px-6 py-4">
                      <span className="text-sm text-gray-400">Full Name</span>
                      <span className="text-sm font-medium text-gray-700">{adminInfo.name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-6 py-4">
                      <span className="text-sm text-gray-400">Email</span>
                      <span className="text-sm font-medium text-gray-700">{adminInfo.email || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-6 py-4">
                      <span className="text-sm text-gray-400">Role</span>
                      <span className="text-sm font-medium text-gray-700">Administrator</span>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="px-6 py-5 border-t border-gray-100">
                    <button
                      onClick={onLogout}
                      className="w-full py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaSignOutAlt className="text-gray-400" /> Logout
                    </button>
                  </div>

                </div>
              </div>
            )}

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
            {activeTab === "User" && <UserInfo />}
            {activeTab === "Agents" && <AdminAgents />}

            {activeTab === "AI Agent" && <AllAgents />}
            {activeTab === "Agent Configure" && <AgentConfigure />}
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
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
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
                  ) : filteredClients.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">
                        No clients found for current filters.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full divide-y divide-gray-200 table-fixed">
                      <colgroup>
                        <col className="w-10" />
                        <col className="w-44" />
                        <col className="w-16" />
                        <col className="w-40" />
                        <col className="w-48" />
                        <col className="w-36" />
                        <col className="w-52" />
                        <col className="w-24" />
                      </colgroup>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agents
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            KYC
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Settings
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client, index) => (
                          <tr
                            key={index}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-gray-100`}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-center text-xs text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-2">
                                {getClientLogoUrl(client) ? (
                                  <img
                                    src={getClientLogoUrl(client)}
                                    alt={client.businessName || client.name}
                                    className="flex-shrink-0 h-9 w-9 rounded-full object-cover"
                                    onError={(e) => { e.currentTarget.src = "/AitotaLogo.png"; }}
                                  />
                                ) : (
                                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm">
                                    {(client?.businessName?.[0] || client?.name?.[0] || "C").toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate" title={client.businessName}>
                                    {client.businessName || "—"}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">
                                    {formatDate(client.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-4 text-center">
                              <span className="text-sm text-gray-500">—</span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="text-sm font-medium text-gray-900 truncate" title={client.name}>
                                {client.name || "—"}
                              </div>
                              {client.websiteUrl && (
                                <a
                                  href={client.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs text-red-600 hover:underline mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Website <FaExternalLinkAlt className="ml-1" />
                                </a>
                              )}
                            </td>
                            <td className="px-3 py-4">
                              <div className="text-xs text-gray-900 truncate" title={client.email}>{client.email || "—"}</div>
                              <div className="text-xs text-gray-500 mt-1">{client.mobileNo || "—"}</div>
                              <div className="text-xs text-gray-400 mt-1 truncate" title={[client.city, client.pincode].filter(Boolean).join(", ")}>
                                {[client.city, client.pincode].filter(Boolean).join(", ") || "—"}
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="text-xs text-gray-600">GST: <span className="font-mono">{client.gstNo || "—"}</span></div>
                              <div className="text-xs text-gray-600 mt-1">PAN: <span className="font-mono">{client.panNo || "—"}</span></div>
                            </td>

                            <td className="px-4 py-6 text-center">
                              <div className="flex flex-row flex-wrap items-center gap-2 justify-center">
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
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEndUserProfileSetup(client);
                                  }}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                                  title="Configure end-user registration profile fields"
                                >
                                  <FaUserCog className="text-sm" />
                                  User profile
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-6 text-center">
                              <div className="relative inline-block">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSettingsMenu(openSettingsMenu === client._id ? null : client._id);
                                  }}
                                  disabled={loadingClientId === client._id}
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                                  title="Settings"
                                >
                                  {loadingClientId === client._id ? (
                                    "..."
                                  ) : (
                                    <FaCog className="text-sm" />
                                  )}
                                </button>
                                {openSettingsMenu === client._id && (
                                  <div
                                    className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSettingsMenu(null);
                                        setReviewClientId(client._id);
                                        setShowApprovalModal(true);
                                      }}
                                    >
                                      <FaEye className="mr-2 text-green-500" /> View
                                    </button>
                                    <button
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSettingsMenu(null);
                                        openEditClient(client);
                                      }}
                                    >
                                      <FaEdit className="mr-2 text-blue-500" /> Edit
                                    </button>
                                    <button
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSettingsMenu(null);
                                        confirmDelete(client._id);
                                      }}
                                    >
                                      <FaTrash className="mr-2 text-red-500" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
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
