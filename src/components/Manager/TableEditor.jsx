import { Settings2 } from 'lucide-react'
import StatusBadge from '../shared/StatusBadge'

const CAPACITIES = [2, 4, 6]

export default function TableEditor({ tables, onUpdateCapacity }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-base font-bold text-white">Table Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Adjust table capacities. Changes apply immediately for this session.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map(table => (
          <div
            key={table.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Table {table.number}</span>
                <StatusBadge status={table.status} />
              </div>
              <Settings2 className="w-4 h-4 text-gray-600" />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Capacity</p>
              <div className="flex gap-2">
                {CAPACITIES.map(cap => (
                  <button
                    key={cap}
                    onClick={() => onUpdateCapacity(table.id, cap)}
                    disabled={table.status === 'occupied'}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors
                      ${table.capacity === cap
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }
                      disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                  >
                    {cap}
                  </button>
                ))}
              </div>
              {table.status === 'occupied' && (
                <p className="text-xs text-gray-600 mt-1.5">
                  Cannot edit while occupied.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
