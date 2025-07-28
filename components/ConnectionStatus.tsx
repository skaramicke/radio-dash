'use client';

interface ConnectionStatusProps {
  isConnected: boolean;
  stationInfo: {
    callsign: string;
    grid: string;
    frequency: number;
  } | null;
}

export default function ConnectionStatus({ isConnected, stationInfo }: ConnectionStatusProps) {
  const formatFrequency = (freq: number) => {
    if (freq >= 1000000) {
      return `${(freq / 1000000).toFixed(3)} MHz`;
    }
    return `${(freq / 1000).toFixed(1)} kHz`;
  };

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-2">
        <div 
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`} 
        />
        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {stationInfo && isConnected && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-300 font-mono">
            {stationInfo.callsign}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            {stationInfo.grid}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            {formatFrequency(stationInfo.frequency)}
          </span>
        </>
      )}
    </div>
  );
}
