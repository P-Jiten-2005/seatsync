const config = {
  available: 'bg-green-900/50 text-green-400 border-green-800',
  occupied:  'bg-red-900/50   text-red-400   border-red-800',
  cleaning:  'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  waiting:   'bg-blue-900/50  text-blue-400  border-blue-800',
  seated:    'bg-purple-900/50 text-purple-400 border-purple-800',
  done:      'bg-gray-800     text-gray-400  border-gray-700',
}

const labels = {
  available: 'Available',
  occupied:  'Occupied',
  cleaning:  'Cleaning',
  waiting:   'Waiting',
  seated:    'Seated',
  done:      'Done',
}

export default function StatusBadge({ status }) {
  const cls = config[status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}
