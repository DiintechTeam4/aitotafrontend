import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";

const InboundSettings = ({ clientId }) => {
  const [settings, setSettings] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/client/agents`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSettings(data);
        setForm(data || {});
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [clientId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/client/agents`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data);
      setEdit(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">
          <p className="font-medium">Error loading settings:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
        <div>
          {edit ? (
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEdit(false);
                  setForm(settings || {});
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEdit(true)}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name
            </label>
            {edit ? (
              <input
                name="agentName"
                value={form.agentName || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="Enter agent name"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                {settings?.agentName || "Not set"}
              </div>
            )}
          </div>

          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice
            </label>
            {edit ? (
              <select
                name="voice"
                value={form.voice || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
              >
                <option value="">Select Voice</option>
                <option value="sarvam">Sarvam</option>
                <option value="deepgram">Deepgram</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                {settings?.voice || "Not selected"}
              </div>
            )}
          </div>

          {/* DID Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DID Number
            </label>
            {edit ? (
              <input
                name="didNumber"
                value={form.didNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="Enter DID number"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                {settings?.didNumber || "Not set"}
              </div>
            )}
          </div>

          {/* First Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Message
            </label>
            {edit ? (
              <input
                name="firstMessage"
                value={form.firstMessage || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter first message"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                {settings?.firstMessage || "Not set"}
              </div>
            )}
          </div>
        </div>

        {/* Knowledge - Full Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Knowledge
          </label>
          {edit ? (
            <textarea
              name="knowledgeText"
              value={form.knowledgeText || ""}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              placeholder="Enter knowledge base content"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 min-h-[120px] whitespace-pre-wrap">
              {settings?.knowledgeText || "No knowledge base content"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default InboundSettings;
