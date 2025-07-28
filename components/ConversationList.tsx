'use client';

import { Conversation } from '@/lib/database';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: string;
  onConversationSelect: (callsign: string) => void;
}

export default function ConversationList({ 
  conversations, 
  activeConversation, 
  onConversationSelect 
}: ConversationListProps) {
  const formatTime = (timestamp: number) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return messageTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffHours < 24 * 7) {
      return messageTime.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageTime.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <button
          key={conversation.callsign}
          onClick={() => onConversationSelect(conversation.callsign)}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            activeConversation === conversation.callsign
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-700 text-gray-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium truncate">
                  {conversation.callsign === '@allcall' 
                    ? '📻 All Call' 
                    : `📡 ${conversation.callsign}`
                  }
                </span>
                {conversation.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                )}
              </div>
              {conversation.lastMessage && (
                <div className="text-sm text-gray-400 truncate mt-1">
                  {conversation.lastMessage}
                </div>
              )}
            </div>
            {conversation.lastTimestamp && (
              <div className="text-xs text-gray-500 ml-2 shrink-0">
                {formatTime(conversation.lastTimestamp)}
              </div>
            )}
          </div>
          {conversation.grid && conversation.callsign !== '@allcall' && (
            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
              <span>📍 {conversation.grid}</span>
              {conversation.snr && (
                <span>📶 {conversation.snr > 0 ? '+' : ''}{conversation.snr} dB</span>
              )}
            </div>
          )}
        </button>
      ))}
      
      {conversations.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-2xl mb-2">📻</div>
          <div className="text-sm">No conversations yet</div>
          <div className="text-xs mt-1">
            Messages will appear when you&apos;re mentioned
          </div>
        </div>
      )}
    </div>
  );
}
