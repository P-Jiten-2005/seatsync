import { Users } from 'lucide-react'
import TokenCard from './TokenCard'

export default function QueuePanel({ tokens, selectedToken, onSelectToken }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Queue
          </h2>
          <span className="bg-indigo-900/50 text-indigo-400 border border-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {tokens.length}
          </span>
        </div>
        {selectedToken && (
          <p className="text-xs text-indigo-400 mt-1">
            #{selectedToken.tokenNumber} selected — pick an available table to seat them
          </p>
        )}
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <Users className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-sm text-gray-500">No customers waiting</p>
            <p className="text-xs text-gray-600 mt-1">
              New check-ins appear here
            </p>
          </div>
        ) : (
          tokens.map(token => (
            <TokenCard
              key={token.id}
              token={token}
              isSelected={selectedToken}
              onSelect={onSelectToken}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      {tokens.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-800 shrink-0">
          <p className="text-xs text-gray-600">
            Click a token, then click an available table to seat them.
          </p>
        </div>
      )}
    </div>
  )
}
