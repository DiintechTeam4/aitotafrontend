import React, { useState } from "react";
import AgentForm from "./AgentForm";

function AdminAgents() {
  const [provider, setProvider] = useState(null); // "c-zentrix" | "tata"
  const [showForm, setShowForm] = useState(false);

  const handleCreateClick = () => {
    setShowForm(false);
    setProvider(null);
  };

  const handleSelectProvider = (p) => {
    setProvider(p);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 m-0">Manage Agents</h2>
        <button
          className="px-5 py-3 text-sm font-medium rounded-md transition-all bg-black text-white hover:bg-gray-800"
          onClick={handleCreateClick}
        >
          Create Agent
        </button>
      </div>

      {!showForm && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectProvider("c-zentrix")}
              className="w-full px-4 py-6 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-lg font-semibold">C-zentrix</div>
              <div className="text-sm text-gray-600">
                Requires Account SID and Caller ID
              </div>
            </button>
            <button
              onClick={() => handleSelectProvider("tata")}
              className="w-full px-4 py-6 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-lg font-semibold">TATA</div>
              <div className="text-sm text-gray-600">
                No Account SID / Caller ID needed
              </div>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <AgentForm
          agent={null}
          onSave={() => {
            setShowForm(false);
            setProvider(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setProvider(null);
          }}
          clientId={undefined}
          initialServiceProvider={provider}
          lockServiceProvider={true}
          clientToken={null}
        />
      )}
    </div>
  );
}

export default AdminAgents;
