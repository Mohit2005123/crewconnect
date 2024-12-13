// components/TaskInfoModal.jsx
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminTaskInfoModal({ isOpen, onClose, task }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Task Details</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            <div className="space-y-6">
              {[
                { label: "Title", value: task.title },
                { label: "Description", value: task.description || 'No description provided' },
                { label: "Status", value: task.status, className: "capitalize" },
                { label: "Created At", value: task.createdAt ? new Date(task.createdAt.toDate()).toLocaleString() : 'N/A' },
                { label: "Deadline", value: task.deadline ? new Date(task.deadline.toDate()).toLocaleString() : 'N/A' }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{item.label}</h3>
                  <p className={`text-gray-800 ${item.className || ''}`}>{item.value}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-8 bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              onClick={onClose}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}