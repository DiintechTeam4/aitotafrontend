import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {API_BASE_URL} from '../config'
import PhoneNumber from './PhoneNumber';
import Chat from './Chat';
import Setting from './Setting';
import AddContactModal from './AddContactModal';
import TemplateModal from './TemplateModal';
import { io } from 'socket.io-client';

const WhatsAppChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [conversations, setConversations] = useState({}); // { phone: Message[] }
  const [settingsByPhone, setSettingsByPhone] = useState({}); // { phone: { ...settings } }
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [templatePhone, setTemplatePhone] = useState('');

  const businessName = import.meta.env.VITE_BUSINESS_NAME || 'Business Account';
  const businessNumber = import.meta.env.VITE_BUSINESS_NUMBER || '+91XXXXXXXXXX';

  const ensureConversationArray = (phone) => {
    setConversations((prev) => ({ ...prev, [phone]: prev[phone] || [] }));
  };

  const openAddModal = () => setIsAddOpen(true);
  const closeAddModal = () => setIsAddOpen(false);
  
  const openTemplateModal = (phone) => {
    setTemplatePhone(phone);
    setIsTemplateOpen(true);
  };
  const closeTemplateModal = () => {
    setIsTemplateOpen(false);
    setTemplatePhone('');
  };

  const submitAddContact = async ({ waID, profilename }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/phonenumber/contacts`, { waID, profilename });
      const created = res.data;
      setContacts((prev) => [created, ...prev]);
      setSelectedPhone(created.waID);
      ensureConversationArray(created.waID);
      closeAddModal();
    } catch (err) {
      console.error(err);
      alert('Failed to add contact');
    }
  };

  const handleSelectPhone = async (phone) => {
    setSelectedPhone(phone);
    ensureConversationArray(phone);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chat/messages/${encodeURIComponent(phone)}`);
      const history = (res.data || []).map(m => ({
        id: m._id,
        type: m.direction,
        text: m.text,
        mediaType: m.mediaType,
        mediaUrl: m.mediaUrl,
        timestamp: m.timestamp || m.createdAt,
        status: m.status || 'sent'
      }));
      setConversations(prev => ({ ...prev, [phone]: history }));
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const handleChangeSetting = (key, value) => {
    if (!selectedPhone) return;
    setSettingsByPhone((prev) => ({
      ...prev,
      [selectedPhone]: { ...(prev[selectedPhone] || {}), [key]: value }
    }));
  };

  const handleSendText = async (text) => {
    if (!selectedPhone || !text.trim()) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/whatsapp/send-message`, {
        to: selectedPhone,
        message: text.trim()
      });
      const baseMessage = {
        id: response.data?.messageId || Date.now(),
        type: 'sent',
        text: text.trim(),
        timestamp: new Date(),
        status: 'sent'
      };
      setConversations((prev) => ({
        ...prev,
        [selectedPhone]: [ ...(prev[selectedPhone] || []), baseMessage ]
      }));

      // Persist to backend chat history
      try {
        await axios.post(`${API_BASE_URL}/api/chat/messages`, {
          waID: selectedPhone,
          direction: 'sent',
          type: 'text',
          text: text.trim(),
          messageId: response.data?.messageId,
          status: 'sent',
          timestamp: new Date().toISOString()
        });
      } catch (persistErr) {
        console.error('Failed to save message history', persistErr);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/phonenumber/contacts`);
        setContacts(res.data || []);
      } catch (err) {
        console.error('Failed to load contacts', err);
      }
    };
    fetchContacts();
  }, []);

  // realtime socket subscription per selected phone
  useEffect(() => {
    if (!selectedPhone) return;
    const socket = io(API_BASE_URL, { withCredentials: true });
    socket.emit('join', selectedPhone.startsWith('+') ? selectedPhone : `+${selectedPhone}`);
    socket.on('message', (evt) => {
      if (!evt || (evt.waID !== (selectedPhone.startsWith('+') ? selectedPhone : `+${selectedPhone}`))) return;
      setConversations((prev) => ({
        ...prev,
        [selectedPhone]: [ ...(prev[selectedPhone] || []), {
          id: Date.now(),
          type: evt.direction,
          text: evt.text,
          mediaType: evt.mediaType,
          mediaUrl: evt.mediaUrl,
          timestamp: evt.timestamp || new Date(),
          status: evt.direction === 'sent' ? 'sent' : 'received'
        } ]
      }));
    });
    return () => {
      socket.emit('leave', selectedPhone.startsWith('+') ? selectedPhone : `+${selectedPhone}`);
      socket.disconnect();
    };
  }, [selectedPhone]);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">{businessName}</div>
            <div className="text-sm opacity-90">{businessNumber}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Contacts */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <PhoneNumber
            contacts={contacts}
            selectedPhone={selectedPhone}
            onSelectPhone={handleSelectPhone}
            onOpenAdd={openAddModal}
            onOpenTemplates={openTemplateModal}
          />
        </div>

        {/* Center - Chat */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          <Chat
            conversation={conversations[selectedPhone] || []}
            onSendText={handleSendText}
            isLoading={isLoading}
          />
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-1/4 bg-white border-l border-gray-200">
          <Setting
            selectedPhone={selectedPhone}
            settings={settingsByPhone[selectedPhone] || {}}
            onChangeSetting={handleChangeSetting}
          />
        </div>
      </div>
      
      <AddContactModal open={isAddOpen} onClose={closeAddModal} onSubmit={submitAddContact} />
      <TemplateModal open={isTemplateOpen} onClose={closeTemplateModal} selectedPhone={templatePhone} />
    </div>
  );
};

export default WhatsAppChat;
