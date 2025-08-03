import { useState, useEffect } from "react";
import {
  FiX,
  FiPlus,
  FiUser,
  FiPhone,
  FiMail,
  FiTrash2,
  FiChevronDown,
} from "react-icons/fi";

function GroupDetails({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [agents, setAgents] = useState([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // API base URL
  const API_BASE = "http://localhost:4000/api/v1/client";

  // Dummy contacts data for demonstration
  const dummyContacts = [
    {
      id: 1,
      name: "John Doe",
      phone: "+1234567890",
      email: "john@example.com",
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "+0987654321",
      email: "jane@example.com",
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+1122334455",
      email: "mike@example.com",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      phone: "+1555666777",
      email: "sarah@example.com",
    },
    {
      id: 5,
      name: "David Brown",
      phone: "+1888999000",
      email: "david@example.com",
    },
  ];

  useEffect(() => {
    fetchGroupDetails();
    fetchAgents();
  }, [groupId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAgentDropdown && !event.target.closest(".agent-dropdown")) {
        setShowAgentDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAgentDropdown]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setGroup(result.data);
        setContacts(result.data.contacts || []);
      } else {
        console.error("Failed to fetch group details:", result.error);
        // For demo purposes, create a dummy group if API fails
        setGroup({
          _id: groupId,
          name: "Demo Group",
          description: "This is a demo group for testing purposes",
          contacts: [],
          createdAt: new Date(),
        });
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      // For demo purposes, create a dummy group if API fails
      setGroup({
        _id: groupId,
        name: "Demo Group",
        description: "This is a demo group for testing purposes",
        contacts: [],
        createdAt: new Date(),
      });
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/agents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setAgents(result.data || []);
      } else {
        console.error("Failed to fetch agents:", result.error);
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      setAddingContact(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups/${groupId}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactForm),
      });

      const result = await response.json();
      if (result.success) {
        // Add the new contact to the local state
        const newContact = {
          _id: result.data._id || Date.now().toString(),
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email,
          createdAt: new Date(),
        };

        setContacts([...contacts, newContact]);
        setContactForm({ name: "", phone: "", email: "" });
        setShowAddContactForm(false);
      } else {
        console.error("Failed to add contact:", result.error);
        alert("Failed to add contact: " + result.error);
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      // For demo purposes, add contact locally if API fails
      const newContact = {
        _id: Date.now().toString(),
        name: contactForm.name,
        phone: contactForm.phone,
        email: contactForm.email,
        createdAt: new Date(),
      };

      setContacts([...contacts, newContact]);
      setContactForm({ name: "", phone: "", email: "" });
      setShowAddContactForm(false);
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("clienttoken");

        const response = await fetch(
          `${API_BASE}/groups/${groupId}/contacts/${contactId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();
        if (result.success) {
          setContacts(contacts.filter((contact) => contact._id !== contactId));
        } else {
          console.error("Failed to delete contact:", result.error);
          alert("Failed to delete contact: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting contact:", error);
        // For demo purposes, remove contact locally if API fails
        setContacts(contacts.filter((contact) => contact._id !== contactId));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAgentSelection = (agentId) => {
    setSelectedAgentIds((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleSaveAgentIds = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentIds: selectedAgentIds,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Agent IDs saved successfully!");
        setShowAgentDropdown(false);
      } else {
        console.error("Failed to save agent IDs:", result.error);
        alert("Failed to save agent IDs: " + result.error);
      }
    } catch (error) {
      console.error("Error saving agent IDs:", error);
      alert("Error saving agent IDs");
    }
  };

  const handleAddDummyContact = async (dummyContact) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups/${groupId}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: dummyContact.name,
          phone: dummyContact.phone,
          email: dummyContact.email,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Add the new contact to the local state
        const newContact = {
          _id: result.data._id || Date.now().toString(),
          name: dummyContact.name,
          phone: dummyContact.phone,
          email: dummyContact.email,
          createdAt: new Date(),
        };

        setContacts([...contacts, newContact]);
      } else {
        console.error("Failed to add dummy contact:", result.error);
        alert("Failed to add contact: " + result.error);
      }
    } catch (error) {
      console.error("Error adding dummy contact:", error);
      // For demo purposes, add contact locally if API fails
      const newContact = {
        _id: Date.now().toString(),
        name: dummyContact.name,
        phone: dummyContact.phone,
        email: dummyContact.email,
        createdAt: new Date(),
      };

      setContacts([...contacts, newContact]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Group not found</div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b-2 border-black p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-2"
            >
              ← Back to Groups
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {group.name}
            </h2>
            <p className="text-gray-600 text-base">
              {group.description || "No description available"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Created: {new Date(group.createdAt).toLocaleDateString()}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {contacts.length} contacts
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Contacts</h3>
          <div className="flex gap-3">
            {/* Agent Selection Dropdown */}
            <div className="relative agent-dropdown">
              <button
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                disabled={loadingAgents}
              >
                <FiPlus className="text-sm" />
                {loadingAgents ? "Loading..." : "Add Agents"}
                <FiChevronDown className="text-sm" />
              </button>

              {showAgentDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Select Agents
                    </h4>
                    <p className="text-sm text-gray-600">
                      Choose agents to assign to this group
                    </p>
                  </div>

                  <div className="p-4">
                    {agents.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        {loadingAgents
                          ? "Loading agents..."
                          : "No agents available"}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {agents.map((agent) => (
                          <label
                            key={agent._id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAgentIds.includes(agent._id)}
                              onChange={() => handleAgentSelection(agent._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {agent.agentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {agent.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {agents.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {selectedAgentIds.length} agent(s) selected
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedAgentIds([]);
                              setShowAgentDropdown(false);
                            }}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveAgentIds}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            disabled={selectedAgentIds.length === 0}
                          >
                            Save ({selectedAgentIds.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddContactForm(true)}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <FiPlus className="text-sm" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Dummy Contacts Section */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-700 mb-4">
            Quick Add Contacts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dummyContacts.map((dummyContact) => (
              <div
                key={dummyContact.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-800">
                    {dummyContact.name}
                  </h5>
                  <button
                    onClick={() => handleAddDummyContact(dummyContact)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-semibold flex items-center gap-1"
                    disabled={loading}
                  >
                    <FiPlus className="text-xs" />
                    {loading ? "Adding..." : "Add"}
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-xs" />
                    {dummyContact.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="text-xs" />
                    {dummyContact.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Contacts */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4">
            Current Contacts
          </h4>
          {contacts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiUser className="mx-auto text-4xl text-gray-400 mb-4" />
              <h5 className="text-lg font-medium text-gray-600 mb-2">
                No contacts yet
              </h5>
              <p className="text-gray-500">Add contacts to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-800">
                      {contact.name}
                    </h5>
                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      disabled={loading}
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-xs" />
                      {contact.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMail className="text-xs" />
                      {contact.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      Added: {new Date(contact.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="m-0 text-gray-800">Add New Contact</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                onClick={() => setShowAddContactForm(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                  placeholder="+1234567890"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                />
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                  onClick={() => setShowAddContactForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                  disabled={addingContact}
                >
                  {addingContact ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetails;
