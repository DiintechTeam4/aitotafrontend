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
          response = await fetch(
            `${API_BASE_URL}/client/agents`,
            {
              headers: {
                Authorization: `Bearer ${clientToken}`,
              },
            }
          );
          data = await response.json();
          if (response.ok && data.success && Array.isArray(data.data)) {
            const found = data.data.find((a) => a._id === agentId);
            if (found) {
              setAgent(found);
              return;
            } else {
              setError("Agent not found");
              return;
            }
          } else {
            setError("Failed to fetch agent");
            return;
          }
        } else {
          // No client token: try to fetch agent by ID (public route)
          response = await fetch(`${API_BASE_URL}/client/agents`);
          data = await response.json();
          if (response.ok && data.success && Array.isArray(data.data)) {
            const found = data.data.find((a) => a._id === agentId);
            if (found) {
              setAgent(found);
              return;
            } else {
              setError("Agent not found");
              return;
            }
          } else {
            setError("Failed to fetch agent");
            return;
          }
        }
      } catch (err) {
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