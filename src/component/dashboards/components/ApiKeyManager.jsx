"use client";

import { useState, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const ApiKeyManager = ({ clientId }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [providers, setProviders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    key: "",
    keyName: "",
    description: "",
    configuration: {},
  });
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    fetchApiKeys();
    fetchProviders();
  }, [clientId]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/client/api-keys`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/client/providers`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const handleEdit = (provider) => {
    const existingKey = apiKeys.find((key) => key.provider === provider);
    setEditingProvider(provider);
    setFormData({
      key: "",
      keyName: existingKey?.keyName || providers[provider]?.name || "",
      description: existingKey?.metadata?.description || "",
      configuration: existingKey?.configuration || {},
    });
  };

  const handleSave = async () => {
    if (!formData.key.trim()) {
      alert("API key is required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/client/api-keys/${editingProvider}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setEditingProvider(null);
        setFormData({
          key: "",
          keyName: "",
          description: "",
          configuration: {},
        });
        fetchApiKeys();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      alert("Failed to save API key");
    }
  };

  const handleTest = async (provider, key) => {
    if (!key.trim()) {
      alert("Please enter an API key to test");
      return;
    }

    setTestResults((prev) => ({ ...prev, [provider]: { testing: true } }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/client/api-keys/${provider}/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify({ key }),
        }
      );

      const result = await response.json();

      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: result.success,
          message: result.message || result.error,
        },
      }));
    } catch (error) {
      console.error("Error testing API key:", error);
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: false,
          message: "Network error occurred",
        },
      }));
    }
  };

  const handleDelete = async (provider) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the API key for ${provider}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/client/api-keys/${provider}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("API key deleted successfully");
        fetchApiKeys();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      alert("Failed to delete API key");
    }
  };

  const getProviderStatus = (provider) => {
    const key = apiKeys.find((k) => k.provider === provider);
    return key ? "configured" : "not-configured";
  };

  const getProviderIcon = (provider) => {
    const icons = {
      openai: "AI",
      anthropic: "🧠",
      google: "🔍",
      azure: "☁️",
      aws: "⚡",
      default: "🔑",
    };
    return icons[provider] || icons.default;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p>Loading API keys...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8 shadow-lg">
      <div className="mb-8 pb-4 border-b-2 border-indigo-500">
        <h2 className="text-gray-800 mb-2">API Key Management</h2>
        <p className="text-gray-600 text-sm">
          Configure API keys for different AI service providers to enable voice
          synthesis and other features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.keys(providers).map((provider) => {
          const status = getProviderStatus(provider);
          const key = apiKeys.find((k) => k.provider === provider);
          const providerInfo = providers[provider];

          return (
            <div
              key={provider}
              className={`border rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                status === "configured"
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-orange-50"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">{getProviderIcon(provider)}</span>
                  <div>
                    <h3 className="m-0 mb-1 text-gray-800 text-lg">
                      {providerInfo.name}
                    </h3>
                    <p className="m-0 text-gray-600 text-sm leading-relaxed">
                      {providerInfo.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                    status === "configured"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status === "configured" ? "Configured" : "Not Configured"}
                </div>
              </div>

              {key && (
                <div className="my-4 p-3 bg-white rounded border border-gray-200">
                  <div className="text-sm leading-relaxed text-gray-600">
                    <strong>Key Name:</strong> {key.keyName}
                    <br />
                    <strong>Added:</strong>{" "}
                    {new Date(key.createdAt).toLocaleDateString()}
                    {key.metadata?.description && (
                      <>
                        <br />
                        <strong>Description:</strong> {key.metadata.description}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(provider)}
                  className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  {key ? "Edit" : "Configure"}
                </button>
                {key && (
                  <button
                    onClick={() => handleDelete(provider)}
                    className="bg-none border-none text-xl cursor-pointer p-1 rounded transition-colors hover:bg-red-100"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="m-0 text-gray-800">
                Configure {providers[editingProvider]?.name}
              </h3>
              <button
                onClick={() => setEditingProvider(null)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={formData.keyName}
                  onChange={(e) =>
                    setFormData({ ...formData, keyName: e.target.value })
                  }
                  placeholder="Give this key a name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                />
              </div>

              {/* Test Result */}
              {testResults[editingProvider] &&
                !testResults[editingProvider].testing && (
                  <div
                    className={`my-4 p-3 rounded text-sm ${
                      testResults[editingProvider].success
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    {testResults[editingProvider].message}
                  </div>
                )}

              {/* Testing Indicator */}
              {testResults[editingProvider]?.testing && (
                <div className="flex items-center gap-2 my-4">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span>Testing API key...</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => handleTest(editingProvider, formData.key)}
                disabled={
                  !formData.key.trim() || testResults[editingProvider]?.testing
                }
                className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Test Key
              </button>
              <button
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
