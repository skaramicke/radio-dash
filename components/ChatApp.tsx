'use client';

import { useEffect, useState, useRef } from 'react';
import { Message, Conversation } from '@/lib/database';
import ConnectionStatus from './ConnectionStatus';
import MessageComponent from './MessageComponent';
import ConversationList from './ConversationList';

interface StationInfo {
  callsign: string;
  grid: string;
  frequency: number;
  connected: boolean;
}

export default function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string>('@allcall');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [stationInfo, setStationInfo] = useState<StationInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Server-Sent Events connection
    eventSourceRef.current = new EventSource('/api/events');

    eventSourceRef.current.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        switch (type) {
          case 'connection:status':
            setIsConnected(data.connected);
            break;
          case 'message:new':
            // Only add if this message is for the active conversation
            if (data.conversation === activeConversation) {
              setMessages(prev => [...prev, data]);
            }
            // Update conversation list
            fetchConversations();
            break;
          case 'station:info':
            setStationInfo(prev => ({
              ...prev,
              callsign: data.callsign,
              grid: data.grid,
              frequency: data.frequency,
              connected: isConnected
            }));
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
    };

    // Initial data fetch
    fetchConversations();
    fetchStationInfo();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    // Fetch messages when active conversation changes
    if (activeConversation) {
      fetchMessages(activeConversation);
      
      // Mark conversation as read
      markConversationAsRead(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversation: string) => {
    try {
      const response = await fetch(`/api/messages?conversation=${encodeURIComponent(conversation)}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchStationInfo = async () => {
    try {
      const response = await fetch('/api/station');
      const data = await response.json();
      if (!data.error) {
        setStationInfo({
          ...data,
          connected: data.connected
        });
        setIsConnected(data.connected);
      }
    } catch (error) {
      console.error('Error fetching station info:', error);
    }
  };

  const markConversationAsRead = async (callsign: string) => {
    try {
      await fetch(`/api/conversations/${encodeURIComponent(callsign)}/read`, {
        method: 'PUT'
      });
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.callsign === callsign 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: activeConversation,
          text: messageInput.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessageInput('');
        // Add message to current conversation
        if (data.message && data.message.conversation === activeConversation) {
          setMessages(prev => [...prev, data.message]);
        }
        // Refresh conversations
        fetchConversations();
      } else {
        alert('Failed to send message. Check JS8Call connection.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Check JS8Call connection.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <div className="text-xl">📻</div>
            <span className="font-bold text-lg">Radio Dash</span>
          </div>
          
          <ConnectionStatus 
            isConnected={isConnected} 
            stationInfo={stationInfo ? {
              callsign: stationInfo.callsign,
              grid: stationInfo.grid,
              frequency: stationInfo.frequency
            } : null} 
          />
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">
              Conversations
            </h3>
            <ConversationList
              conversations={conversations}
              activeConversation={activeConversation}
              onConversationSelect={setActiveConversation}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-xl font-semibold">
            {activeConversation === '@allcall' ? '📻 All Call' : `📡 ${activeConversation}`}
          </h2>
          <div className="text-sm text-gray-400">
            {activeConversation === '@allcall' 
              ? 'General calling frequency' 
              : `Direct conversation with ${activeConversation}`
            }
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageComponent
              key={message.id}
              message={message}
              isOwnMessage={message.direction === 'outgoing'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message ${activeConversation === '@allcall' ? 'all stations' : activeConversation}...`}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              disabled={!isConnected || isSending}
            />
            <button
              type="submit"
              disabled={!isConnected || !messageInput.trim() || isSending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
          {!isConnected && (
            <div className="mt-2 text-sm text-red-400">
              ⚠️ Not connected to JS8Call. Check that JS8Call is running and TCP server is enabled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
