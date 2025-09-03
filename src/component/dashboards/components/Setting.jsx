import React from 'react';

const Setting = ({ selectedPhone, settings, onChangeSetting }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Contact Info</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedPhone ? (
          <div className="space-y-6">
            {/* Contact Details */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
                {selectedPhone.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Contact Name</h4>
              <p className="text-xs text-gray-500">{selectedPhone}</p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Notifications</label>
                <select
                  value={settings.notifications || 'enabled'}
                  onChange={(e) => onChangeSetting('notifications', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="enabled">Enabled</option>
                  <option value="muted">Muted</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Auto-reply</label>
                <select
                  value={settings.autoReply || 'off'}
                  onChange={(e) => onChangeSetting('autoReply', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="off">Off</option>
                  <option value="on">On</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Labels</label>
                <input
                  type="text"
                  value={settings.labels || ''}
                  onChange={(e) => onChangeSetting('labels', e.target.value)}
                  placeholder="comma,separated,labels"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h5>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add to favorites
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share contact
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Block contact
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm">Select a contact</p>
            <p className="text-xs text-gray-400">to view details and settings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setting;


