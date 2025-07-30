"use client";

import { useState } from "react";
import {
  FiEdit,
  FiTrash2,
  FiVolume2,
  FiSquare,
  FiUser,
  FiMessageSquare,
  FiTag,
  FiMoreVertical,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const AgentList = ({ agents, onEdit, onDelete, clientId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [playingAgentId, setPlayingAgentId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const formatPersonality = (personality) => {
    return personality.charAt(0).toUpperCase() + personality.slice(1);
  };

  const playAudio = async (agentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/audio?clientId=${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        }
      );
      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setPlayingAgentId(agentId);
      } else {
        setAudioUrl(null);
        setPlayingAgentId(null);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setAudioUrl(null);
      setPlayingAgentId(null);
    }
  };

  const stopAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setPlayingAgentId(null);
  };

  const toggleMenu = (agentId) => {
    setOpenMenuId(openMenuId === agentId ? null : agentId);
  };

  const handleEdit = (agent) => {
    setOpenMenuId(null);
    onEdit(agent);
  };

  const handleDelete = (agentId) => {
    setOpenMenuId(null);
    onDelete(agentId);
  };

  // Ensure agents is always an array
  const agentsArray = Array.isArray(agents) ? agents : [];

  return (
    <div className="w-full">
      {agentsArray.length === 0 ? (
        <div className="text-center py-16 px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Agents Yet
            </h3>
            <p className="text-gray-500">
              Create your first AI agent to get started!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentsArray.map((agent) => (
            <div
              key={agent._id}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-black px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-semibold text-lg truncate capitalize">
                    {agent.agentName}
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => toggleMenu(agent._id)}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="More options"
                    >
                      <FiMoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === agent._id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleEdit(agent)}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit Agent
                        </button>
                        <button
                          onClick={() => handleDelete(agent._id)}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete Agent
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                {/* Description */}
                <div>
                  <label className="block font-semibold text-gray-700">
                    Description
                  </label>
                  <p className="text-gray-600 text-sm leading-relaxed italic">
                    "{agent.description}"
                  </p>
                </div>

                {/* Agent Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiTag className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Category
                      </span>
                      <p className="text-sm font-medium text-gray-800">
                        {agent.category || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiUser className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Personality
                      </span>
                      <p className="text-sm font-medium text-gray-800">
                        {formatPersonality(agent.personality)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* First Message Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiMessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        First Message
                      </span>
                      <p className="text-sm font-medium text-gray-800">
                        {agent.firstMessage || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => playAudio(agent._id)}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      <FiVolume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {playingAgentId === agent._id && audioUrl && (
                    <div className="mt-4 space-y-3">
                      <audio
                        controls
                        autoPlay
                        src={audioUrl}
                        onEnded={stopAudio}
                        className="w-full"
                      />
                      <button
                        onClick={stopAudio}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <FiSquare className="w-4 h-4" />
                        Stop
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
};

export default AgentList;
