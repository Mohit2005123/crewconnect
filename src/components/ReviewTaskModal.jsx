import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewTaskModal({ 
  isOpen, 
  onClose, 
  selectedTask, 
  isUpdating, 
  onUpdateTask 
}) {
  const modalRef = useRef();

  // Handle click outside
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleClickOutside}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl"
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Review Task Completion
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Would you like to accept or reject the completion request for{" "}
              <span className="font-medium text-gray-800">
                "{selectedTask?.title}"
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                disabled={isUpdating}
                className={`px-6 py-2.5 text-gray-600 hover:text-gray-800 transition-colors rounded-md border border-gray-300 hover:border-gray-400 ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUpdateTask('reject')}
                disabled={isUpdating}
                className={`px-6 py-2.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Updating...' : 'Reject'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUpdateTask('accept')}
                disabled={isUpdating}
                className={`px-6 py-2.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Updating...' : 'Accept'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}