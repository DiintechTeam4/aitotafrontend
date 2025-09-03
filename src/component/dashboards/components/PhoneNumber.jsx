import React, { useState, useMemo } from 'react';

const PhoneNumber = ({ contacts, selectedPhone, onSelectPhone, onOpenAdd, onOpenTemplates }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const name = (c.profilename || '').toLowerCase();
      const number = (c.waID || String(c)).toLowerCase();
      return name.includes(q) || number.includes(q);
    });
  }, [contacts, search]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex gap-2 items-center">
          <button
            onClick={onOpenAdd}
            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 whitespace-nowrap transition-colors"
          >
            Add Contact
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {(!filtered || filtered.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No chats yet</p>
            <p className="text-xs text-gray-400">Start a conversation</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c._id || c.waID || c}
              className={`relative group border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selectedPhone === (c.waID || c) ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <button
                onClick={() => onSelectPhone(c.waID || c)}
                className="w-full text-left px-4 py-3 flex items-center gap-3"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
                  {(c.profilename || c.waID || c).charAt(0).toUpperCase()}
                </div>
                
                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {c.profilename || c.waID || c}
                    </h3>
        
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.waID || c}</p>
                </div>
              </button>
              
              {/* Template Button */}
              <button
                onClick={() => onOpenTemplates(c.waID || c)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Templates
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PhoneNumber;


