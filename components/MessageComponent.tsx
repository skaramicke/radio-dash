'use client';

import { Message } from '@/lib/database';

interface MessageComponentProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageComponent({ message, isOwnMessage }: MessageComponentProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium">
            {isOwnMessage ? 'You' : message.from}
          </span>
          <span className="text-xs opacity-75">
            {formatTime(message.timestamp)}
          </span>
          {message.snr && (
            <span className="text-xs opacity-75">
              {message.snr > 0 ? '+' : ''}{message.snr} dB
            </span>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    </div>
  );
}
