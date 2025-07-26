import { useState, useEffect } from "react"

function OutboundSection({ tenantId }) {
  const [contactGroups, setContactGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [contacts, setContacts] = useState([])
  const [activeTab, setActiveTab] = useState("groups")
  const [showAddGroupForm, setShowAddGroupForm] = useState(false)
  const [showAddContactForm, setShowAddContactForm] = useState(false)
  const [uploadMethod, setUploadMethod] = useState("form") // "form" or "excel"

  // Form states
  const [groupForm, setGroupForm] = useState({ name: "", description: "" })
  const [contactForm, setContactForm] = useState({ name: "", mobile: "", email: "", groupId: "" })
  const [bulkContacts, setBulkContacts] = useState("")
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetchContactGroups()
  }, [tenantId])

  useEffect(() => {
    if (selectedGroup) {
      fetchContacts(selectedGroup.id)
    }
  }, [selectedGroup])

  const fetchContactGroups = async () => {
    try {
      const response = await fetch(` http://localhost:4000/api/v1/api/contact-groups?tenantId=${tenantId}`)
      const data = await response.json()
      setContactGroups(data)
    } catch (error) {
      console.error("Error fetching contact groups:", error)
    }
  }

  const fetchContacts = async (groupId) => {
    try {
      const response = await fetch(` http://localhost:4000/api/v1/api/contacts?groupId=${groupId}&tenantId=${tenantId}`)
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(` http://localhost:4000/api/v1/api/contact-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...groupForm, tenantId })
      })
      if (response.ok) {
        fetchContactGroups()
        setGroupForm({ name: "", description: "" })
        setShowAddGroupForm(false)
      }
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const handleAddContact = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(` http://localhost:4000/api/v1/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...contactForm, 
          groupId: selectedGroup?.id || contactForm.groupId,
          tenantId 
        })
      })
      if (response.ok) {
        fetchContacts(selectedGroup?.id || contactForm.groupId)
        setContactForm({ name: "", mobile: "", email: "", groupId: "" })
        setShowAddContactForm(false)
      }
    } catch (error) {
      console.error("Error adding contact:", error)
    }
  }

  const handleBulkUpload = async () => {
    try {
      const contacts = bulkContacts.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, mobile, email] = line.split(',').map(item => item.trim())
          return { name, mobile, email, groupId: selectedGroup.id, tenantId }
        })

      const response = await fetch(` http://localhost:4000/api/v1/api/contacts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts })
      })
      
      if (response.ok) {
        fetchContacts(selectedGroup.id)
        setBulkContacts("")
        setShowAddContactForm(false)
      }
    } catch (error) {
      console.error("Error bulk uploading contacts:", error)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("groupId", selectedGroup.id)
    formData.append("tenantId", tenantId)

    try {
      const response = await fetch(` http://localhost:4000/api/v1/api/contacts/upload-excel`, {
        method: "POST",
        body: formData
      })
      
      if (response.ok) {
        fetchContacts(selectedGroup.id)
        setShowAddContactForm(false)
        e.target.value = ""
      }
    } catch (error) {
      console.error("Error uploading Excel file:", error)
    }
  }

  const handleDeleteContact = async (contactId) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await fetch(` http://localhost:4000/api/v1/api/contacts/${contactId}?tenantId=${tenantId}`, {
          method: "DELETE"
        })
        fetchContacts(selectedGroup.id)
      } catch (error) {
        console.error("Error deleting contact:", error)
      }
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group and all its contacts?")) {
      try {
        await fetch(` http://localhost:4000/api/v1/api/contact-groups/${groupId}?tenantId=${tenantId}`, {
          method: "DELETE"
        })
        fetchContactGroups()
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null)
          setContacts([])
        }
      } catch (error) {
        console.error("Error deleting group:", error)
      }
    }
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <h2>Contact Groups & Outbound</h2>
        <p className="section-description">
          Manage contact groups and configure outbound communications for your campaigns.
        </p>
      </div>

      <div className="section-body">
        <div className="outbound-nav">
          <button 
            className={`nav-button ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => setActiveTab("groups")}
          >
            Contact Groups ({contactGroups.length})
          </button>
          <button 
            className={`nav-button ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => setActiveTab("contacts")}
          >
            Contacts {selectedGroup ? `(${contacts.length})` : ""}
          </button>
        </div>

        {activeTab === "groups" && (
          <div className="groups-section">
            <div className="section-actions">
              <button 
                className="primary-button"
                onClick={() => setShowAddGroupForm(true)}
              >
                + Create Group
              </button>
            </div>

            {contactGroups.length === 0 ? (
              <div className="empty-state">
                <h3>No Contact Groups</h3>
                <p>Create your first contact group to start managing contacts</p>
              </div>
            ) : (
              <div className="groups-grid">
                {contactGroups.map(group => (
                  <div key={group.id} className="group-card">
                    <div className="group-header">
                      <h3>{group.name}</h3>
                      <div className="group-actions">
                        <button 
                          className="view-button"
                          onClick={() => {
                            setSelectedGroup(group)
                            setActiveTab("contacts")
                          }}
                        >
                          View Contacts
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="group-description">{group.description}</p>
                    <div className="group-stats">
                      <span className="contact-count">{group.contactCount || 0} contacts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="contacts-section">
            {!selectedGroup ? (
              <div className="empty-state">
                <h3>Select a Contact Group</h3>
                <p>Choose a group from the Contact Groups tab to view and manage contacts</p>
              </div>
            ) : (
              <>
                <div className="contacts-header">
                  <div className="group-info">
                    <h3>{selectedGroup.name}</h3>
                    <span className="contact-count">{contacts.length} contacts</span>
                  </div>
                  <button 
                    className="primary-button"
                    onClick={() => setShowAddContactForm(true)}
                  >
                    + Add Contacts
                  </button>
                </div>

                {contacts.length === 0 ? (
                  <div className="empty-state">
                    <h3>No Contacts</h3>
                    <p>Add contacts to this group using the form or Excel upload</p>
                  </div>
                ) : (
                  <div className="contacts-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Email</th>
                          <th>Added</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map(contact => (
                          <tr key={contact.id}>
                            <td>{contact.name}</td>
                            <td>{contact.mobile}</td>
                            <td>{contact.email || "-"}</td>
                            <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="delete-button"
                                onClick={() => handleDeleteContact(contact.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Add Group Modal */}
        {showAddGroupForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Create Contact Group</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowAddGroupForm(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label>Group Name *</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setShowAddGroupForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Contacts Modal */}
        {showAddContactForm && selectedGroup && (
          <div className="modal-overlay">
            <div className="modal large-modal">
              <div className="modal-header">
                <h3>Add Contacts to "{selectedGroup.name}"</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowAddContactForm(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="upload-method-selector">
                <button 
                  className={`method-button ${uploadMethod === "form" ? "active" : ""}`}
                  onClick={() => setUploadMethod("form")}
                >
                  Single Contact Form
                </button>
                <button 
                  className={`method-button ${uploadMethod === "bulk" ? "active" : ""}`}
                  onClick={() => setUploadMethod("bulk")}
                >
                  Bulk Text Input
                </button>
                <button 
                  className={`method-button ${uploadMethod === "excel" ? "active" : ""}`}
                  onClick={() => setUploadMethod("excel")}
                >
                  Excel Upload
                </button>
              </div>

              {uploadMethod === "form" && (
                <form onSubmit={handleAddContact}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      value={contactForm.mobile}
                      onChange={(e) => setContactForm({...contactForm, mobile: e.target.value})}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="secondary-button" onClick={() => setShowAddContactForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Add Contact
                    </button>
                  </div>
                </form>
              )}

              {uploadMethod === "bulk" && (
                <div>
                  <div className="form-group">
                    <label>Bulk Contacts (CSV format: Name, Mobile, Email)</label>
                    <textarea
                      value={bulkContacts}
                      onChange={(e) => setBulkContacts(e.target.value)}
                      rows="10"
                      placeholder="John Doe, +1234567890, john@example.com&#10;Jane Smith, +0987654321, jane@example.com"
                    />
                    <small className="form-help">Enter one contact per line in format: Name, Mobile, Email</small>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="secondary-button" onClick={() => setShowAddContactForm(false)}>
                      Cancel
                    </button>
                    <button className="primary-button" onClick={handleBulkUpload}>
                      Upload Contacts
                    </button>
                  </div>
                </div>
              )}

              {uploadMethod === "excel" && (
                <div>
                  <div className="form-group">
                    <label>Excel File Upload</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                    <small className="form-help">
                      Excel file should have columns: Name, Mobile, Email (first row as headers)
                    </small>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="secondary-button" onClick={() => setShowAddContactForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OutboundSection