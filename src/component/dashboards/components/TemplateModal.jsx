import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const TemplateModal = ({ open, onClose, selectedPhone }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/whatsapp/get-templates`);
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      } else {
        setError('Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 m-0">Templates</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading templates...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchTemplates}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No templates found</div>
            ) : (
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <div key={template.id || index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 m-0">{template.name || 'Unnamed Template'}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.status || 'Unknown'}
                      </span>
                    </div>
    
                    {template.components && template.components.length > 0 && (
                      <div className="text-sm">
                        {template.components.map((comp, compIndex) => (
                          <div key={compIndex} className="mb-1">
                            <span className="font-medium text-gray-700">{comp.type}:</span>
                            <span className="text-gray-600 ml-1">{comp.text || 'No text'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateModal;
