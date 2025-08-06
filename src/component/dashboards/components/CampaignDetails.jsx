import { useState, useEffect } from "react";
import { FiX, FiPlus, FiUsers, FiCalendar, FiTrash2 } from "react-icons/fi";

function CampaignDetails({ campaignId, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingGroups, setAddingGroups] = useState(false);
  const { API_BASE_URL } = require("../../../config");
  console.log(API_BASE_URL)
  // API base URL
  const API_BASE = API_BASE_URL;

  useEffect(() => {
    fetchCampaignDetails();
    fetchAvailableGroups();
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setCampaign(result.data);
        setSelectedGroups(result.data.groupIds || []);
      } else {
        console.error("Failed to fetch campaign details:", result.error);
        // For demo purposes, create a dummy campaign if API fails
        setCampaign({
          _id: campaignId,
          name: "Demo Campaign",
          description: "This is a demo campaign for testing purposes",
          groupIds: [],
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: "draft",
          createdAt: new Date(),
        });
        setSelectedGroups([]);
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      // For demo purposes, create a dummy campaign if API fails
      setCampaign({
        _id: campaignId,
        name: "Demo Campaign",
        description: "This is a demo campaign for testing purposes",
        groupIds: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "draft",
        createdAt: new Date(),
      });
      setSelectedGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setAvailableGroups(result.data);
      } else {
        console.error("Failed to fetch groups:", result.error);
        // For demo purposes, create dummy groups if API fails
        setAvailableGroups([
          {
            _id: "1",
            name: "Demo Group 1",
            description: "First demo group",
            contacts: [],
          },
          {
            _id: "2",
            name: "Demo Group 2",
            description: "Second demo group",
            contacts: [],
          },
          {
            _id: "3",
            name: "Demo Group 3",
            description: "Third demo group",
            contacts: [],
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      // For demo purposes, create dummy groups if API fails
      setAvailableGroups([
        {
          _id: "1",
          name: "Demo Group 1",
          description: "First demo group",
          contacts: [],
        },
        {
          _id: "2",
          name: "Demo Group 2",
          description: "Second demo group",
          contacts: [],
        },
        {
          _id: "3",
          name: "Demo Group 3",
          description: "Third demo group",
          contacts: [],
        },
      ]);
    }
  };

  const handleAddGroupsToCampaign = async () => {
    if (selectedGroups.length === 0) {
      alert("Please select at least one group to add to the campaign.");
      return;
    }

    try {
      setAddingGroups(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupIds: selectedGroups,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        // Update the campaign with new groups
        setCampaign((prev) => ({
          ...prev,
          groupIds: selectedGroups,
        }));
        alert("Groups updated successfully!");
      } else {
        console.error("Failed to add groups to campaign:", result.error);
        alert("Failed to update groups: " + result.error);
      }
    } catch (error) {
      console.error("Error adding groups to campaign:", error);
      // For demo purposes, update locally if API fails
      setCampaign((prev) => ({
        ...prev,
        groupIds: selectedGroups,
      }));
      alert("Groups updated (demo mode)!");
    } finally {
      setAddingGroups(false);
    }
  };

  const handleRemoveGroup = async (groupId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this group from the campaign?"
      )
    ) {
      try {
        setLoading(true);
        const updatedGroups = selectedGroups.filter((id) => id !== groupId);

        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE}/campaigns/${campaignId}/groups`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              groupIds: updatedGroups,
            }),
          }
        );

        const result = await response.json();
        if (result.success) {
          setSelectedGroups(updatedGroups);
          setCampaign((prev) => ({
            ...prev,
            groupIds: updatedGroups,
          }));
        } else {
          console.error("Failed to remove group:", result.error);
          alert("Failed to remove group: " + result.error);
        }
      } catch (error) {
        console.error("Error removing group:", error);
        // For demo purposes, remove locally if API fails
        const updatedGroups = selectedGroups.filter((id) => id !== groupId);
        setSelectedGroups(updatedGroups);
        setCampaign((prev) => ({
          ...prev,
          groupIds: updatedGroups,
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-red-100 text-red-700";
      case "draft":
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Campaign not found</div>
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
              ← Back to Campaigns
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {campaign.name}
            </h2>
            <p className="text-gray-600 text-base">
              {campaign.description || "No description available"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Created: {new Date(campaign.createdAt).toLocaleDateString()}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {selectedGroups.length} groups
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Campaign Info */}
        <div className="mb-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Campaign Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Start Date</div>
                <div className="font-medium">
                  {new Date(campaign.startDate).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCalendar className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">End Date</div>
                <div className="font-medium">
                  {new Date(campaign.endDate).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiUsers className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiUsers className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Groups</div>
                <div className="font-medium">
                  {selectedGroups.length} groups selected
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Group Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Manage Groups
          </h3>

          {/* Available Groups */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-4">
              Available Groups
            </h4>
            {availableGroups.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                <h5 className="text-lg font-medium text-gray-600 mb-2">
                  No groups available
                </h5>
                <p className="text-gray-500">
                  Create groups first to add them to campaigns
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableGroups.map((group) => (
                  <div
                    key={group._id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedGroups.includes(group._id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-800">
                        {group.name}
                      </h5>
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, group._id]);
                          } else {
                            setSelectedGroups(
                              selectedGroups.filter((id) => id !== group._id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {group.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      {group.contacts?.length || 0} contacts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Groups Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAddGroupsToCampaign}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
              disabled={addingGroups}
            >
              {addingGroups ? "Updating..." : "Update Campaign Groups"}
            </button>
          </div>
        </div>

        {/* Selected Groups */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4">
            Selected Groups
          </h4>
          {selectedGroups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
              <h5 className="text-lg font-medium text-gray-600 mb-2">
                No groups selected
              </h5>
              <p className="text-gray-500">
                Select groups above to add them to this campaign
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedGroups.map((groupId) => {
                const group = availableGroups.find((g) => g._id === groupId);
                if (!group) return null;

                return (
                  <div
                    key={group._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-800">
                        {group.name}
                      </h5>
                      <button
                        onClick={() => handleRemoveGroup(group._id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        disabled={loading}
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {group.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      {group.contacts?.length || 0} contacts
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignDetails;
