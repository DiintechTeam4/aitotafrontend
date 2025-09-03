import React, { useState, useEffect } from 'react';

const AddContactModal = ({ open, onClose, onSubmit }) => {
  const [waID, setWaID] = useState('');
  const [profilename, setProfilename] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setWaID('');
      setProfilename('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const trimmedNumber = waID.trim();
    const normalized = trimmedNumber.startsWith('+') ? trimmedNumber : `+91${trimmedNumber}`;
    if (!/^\+\d{7,15}$/.test(normalized)) {
      setError('Enter a valid phone number in international or 10-digit format');
      return null;
    }
    if (!profilename.trim()) {
      setError('Name is required');
      return null;
    }
    setError('');
    return { waID: normalized, profilename: profilename.trim() };
  };

  const handleSubmit = () => {
    const payload = validate();
    if (!payload) return;
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 m-0">Add Contact</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g., +919876543210"
              value={waID}
              onChange={(e) => setWaID(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 box-border"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              placeholder="Display name"
              value={profilename}
              onChange={(e) => setProfilename(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 box-border"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm text-white bg-green-600 hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;


