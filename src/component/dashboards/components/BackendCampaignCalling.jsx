import React, { useState, useEffect } from "react";
import { API_BASE } from "../../../config";

const BackendCampaignCalling = ({ campaign, selectedAgent }) => {
  const [callingStatus, setCallingStatus] = useState("idle");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  // Poll for progress updates
  useEffect(() => {
    let interval;
    if (callingStatus === "calling" && campaign?._id) {
      interval = setInterval(async () => {
        try {
          const token = sessionStorage.getItem("clienttoken");
          const response = await fetch(
            `${API_BASE}/campaigns/${campaign._id}/calling-status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const result = await response.json();

          if (result.success) {
            setProgress(result.data.progress);

            // Update calling status based on campaign status
            if (!result.data.isRunning && callingStatus === "calling") {
              setCallingStatus("completed");
            }
          }
        } catch (error) {
          console.error("Error fetching calling status:", error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callingStatus, campaign?._id]);

  const startCalling = async () => {
    if (!selectedAgent || !campaign) {
      setError("Please select an agent and ensure campaign has contacts");
      return;
    }

    try {
      setError(null);
      setCallingStatus("starting");

      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/start-calling`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: selectedAgent,
            delayBetweenCalls: 2000, // 2 seconds between calls
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setCallingStatus("calling");
        console.log("Campaign calling started:", result.data);
      } else {
        setError(result.error || "Failed to start calling");
        setCallingStatus("idle");
      }
    } catch (error) {
      console.error("Error starting campaign calling:", error);
      setError("Failed to start calling");
      setCallingStatus("idle");
    }
  };

  const stopCalling = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/stop-calling`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setCallingStatus("stopped");
        console.log("Campaign calling stopped:", result.data);
      } else {
        setError(result.error || "Failed to stop calling");
      }
    } catch (error) {
      console.error("Error stopping campaign calling:", error);
      setError("Failed to stop calling");
    }
  };

  const makeSingleCall = async (contactId) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/make-call`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contactId,
            agentId: selectedAgent,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("Single call made:", result.data);
        alert("Call initiated successfully!");
      } else {
        setError(result.error || "Failed to make call");
      }
    } catch (error) {
      console.error("Error making single call:", error);
      setError("Failed to make call");
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return Math.round((progress.completedCalls / progress.totalContacts) * 100);
  };

  return (
    <div className="backend-campaign-calling">
      <h3>Backend Campaign Calling</h3>

      {error && (
        <div
          className="error-message"
          style={{ color: "red", marginBottom: "10px" }}
        >
          {error}
        </div>
      )}

      <div className="calling-controls">
        {callingStatus === "idle" && (
          <button
            onClick={startCalling}
            disabled={!selectedAgent || !campaign?.contacts?.length}
            className="btn btn-primary"
          >
            Start Campaign Calling
          </button>
        )}

        {callingStatus === "calling" && (
          <button onClick={stopCalling} className="btn btn-danger">
            Stop Calling
          </button>
        )}

        {callingStatus === "completed" && (
          <div className="completion-message">
            <p>Campaign calling completed!</p>
            <button
              onClick={() => setCallingStatus("idle")}
              className="btn btn-secondary"
            >
              Reset
            </button>
          </div>
        )}

        {callingStatus === "stopped" && (
          <div className="stopped-message">
            <p>Campaign calling stopped.</p>
            <button
              onClick={() => setCallingStatus("idle")}
              className="btn btn-secondary"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {progress && (
        <div className="calling-progress">
          <h4>Calling Progress</h4>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${getProgressPercentage()}%`,
                height: "20px",
                backgroundColor: "#007bff",
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
          <p>
            {progress.completedCalls} / {progress.totalContacts} calls completed
            ({getProgressPercentage()}%)
          </p>
          <p>
            Successful: {progress.successfulCalls} | Failed:{" "}
            {progress.failedCalls}
          </p>
          {progress.lastCallTime && (
            <p>
              Last call: {new Date(progress.lastCallTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {campaign?.contacts && (
        <div className="contacts-list">
          <h4>Campaign Contacts</h4>
          <div className="contacts-grid">
            {campaign.contacts.slice(0, 10).map((contact) => (
              <div key={contact._id} className="contact-item">
                <div>
                  <strong>{contact.name}</strong>
                  <br />
                  {contact.phone}
                </div>
                <button
                  onClick={() => makeSingleCall(contact._id)}
                  disabled={!selectedAgent}
                  className="btn btn-sm btn-outline-primary"
                >
                  Call
                </button>
              </div>
            ))}
            {campaign.contacts.length > 10 && (
              <p>... and {campaign.contacts.length - 10} more contacts</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .backend-campaign-calling {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 20px 0;
        }

        .calling-controls {
          margin-bottom: 20px;
        }

        .calling-progress {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
          margin: 10px 0;
        }

        .contacts-list {
          margin-top: 20px;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .contact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: white;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-outline-primary {
          background-color: transparent;
          color: #007bff;
          border: 1px solid #007bff;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default BackendCampaignCalling;
