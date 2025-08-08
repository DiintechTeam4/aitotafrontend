import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgentMobileTalkUI from "./AgentMobileTalkUI";
import { API_BASE_URL } from "../../../config";

const AgentMobileTalk = () => {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clientToken = sessionStorage.getItem("clienttoken");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        let response, data;
        if (clientToken) {
          // Authenticated request
          response = await fetch(
            `${API_BASE_URL}/client/agents/${agentId}`,
            {
              headers: {
                Authorization: `Bearer ${clientToken}`,
              },
            }
          );
          data = await response.json();
          if (response.ok && data.success) {
            const agentObj = data.data;
            try {
              const clientRes = await fetch(`${API_BASE_URL}/client/public/${agentObj.clientId}`);
              const clientJson = await clientRes.json();
              if (clientRes.ok && clientJson.success) {
                agentObj.__clientPublic = clientJson.data;
              }
            } catch {}
            setAgent(agentObj);
            return;
          } else {
            setError("Failed to fetch agent");
            return;
          }
        } else {
          // Public request for mobile users
          response = await fetch(`${API_BASE_URL}/client/agents/${agentId}/public`);
          data = await response.json();
          if (response.ok && data.success) {
            const agentObj = data.data;
            // Try to fetch minimal client details for header
            try {
              const clientRes = await fetch(`${API_BASE_URL}/client/public/${agentObj.clientId}`);
              const clientJson = await clientRes.json();
              if (clientRes.ok && clientJson.success) {
                // attach minimal client details to agent for UI header
                agentObj.__clientPublic = clientJson.data;
              }
            } catch {}
            setAgent(agentObj);
            return;
          } else {
            setError("Failed to fetch agent");
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching agent:", err);
        setError("Error fetching agent");
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [agentId, clientToken]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!agent) return <div className="p-8 text-center">Agent not found</div>;

  return (
    <AgentMobileTalkUI
      agent={agent}
      clientId={agent.clientId}
      onClose={() => navigate(-1)}
    />
  );
};

export default AgentMobileTalk; 
