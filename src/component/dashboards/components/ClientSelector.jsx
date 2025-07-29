import { useState, useEffect } from "react";

const ClientSelector = ({ currentClient, onClientChange }) => {
  const [clientInfo, setClientInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    settings: {
      defaultLanguage: "en",
      timezone: "UTC",
    },
  });

  useEffect(() => {
    if (currentClient) {
      fetchClientInfo();
    }
  }, [currentClient]);

  const fetchClientInfo = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/client?clientId=${currentClient}`
      );
      const data = await response.json();
      if (data.success) {
        setClientInfo(data.data);
        setFormData({
          clientName: data.data.clientName,
          email: data.data.email,
          settings: data.data.settings || {
            defaultLanguage: "en",
            timezone: "UTC",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching client info:", error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/client?clientId=${currentClient}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const result = await response.json();
      if (result.success) {
        setClientInfo(result.data);
        setIsEditing(false);
        alert("Client information updated successfully");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Failed to update client information");
    }
  };

  const handleClientIdChange = (newClientId) => {
    if (newClientId.trim()) {
      onClientChange(newClientId.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6 pb-4 border-b-2 border-indigo-500">
        <h3 className="text-xl font-semibold text-gray-800">
          Client Configuration
        </h3>
      </div>
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client ID
          </label>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={currentClient}
              onChange={(e) => handleClientIdChange(e.target.value)}
              placeholder="Enter client ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <span className="text-sm font-semibold whitespace-nowrap">
              {clientInfo ? "✅ Active" : "⚠️ New"}
            </span>
          </div>
          <small className="text-gray-600 text-sm">
            This identifies your organization/account
          </small>
        </div>
      </div>
      {clientInfo && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-3">
            <div className="mb-3 text-sm">
              <strong className="text-gray-800 mr-2">Name:</strong>{" "}
              {clientInfo.clientName}
            </div>
            <div className="mb-3 text-sm">
              <strong className="text-gray-800 mr-2">Email:</strong>{" "}
              {clientInfo.email}
            </div>
            <div className="mb-3 text-sm">
              <strong className="text-gray-800 mr-2">Status:</strong>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  clientInfo.status === "active"
                    ? "bg-green-100 text-green-800"
                    : clientInfo.status === "inactive"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {clientInfo.status}
              </span>
            </div>
            <div className="mb-3 text-sm">
              <strong className="text-gray-800 mr-2">Plan:</strong>{" "}
              {clientInfo.subscription?.plan || "free"}
            </div>
            <div className="mb-3 text-sm">
              <strong className="text-gray-800 mr-2">Default Language:</strong>{" "}
              {clientInfo.settings?.defaultLanguage || "en"}
            </div>
            <div className="mb-3 text-sm">
              <strong className="text-gray-800 mr-2">Created:</strong>{" "}
              {new Date(clientInfo.createdAt).toLocaleDateString()}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              Edit Information
            </button>
          </div>
        </div>
      )}
      {isEditing && (
        <div className="mt-6 space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clientName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={formData.settings.defaultLanguage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultLanguage: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
