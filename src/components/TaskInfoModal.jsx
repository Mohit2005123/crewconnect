'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CommentsModal from './CommentsModal';

export default function TaskInfoModal({ task, isOpen, onClose, onComplete }) {
  const overlayRef = useRef();
  const [comment, setComment] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  useEffect(() => {
    if (task?.comments) {
      setLocalComments(task.comments);
    }
  }, [task]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    const newComment = {
      text: comment.trim(),
      timestamp: new Date(),
      userId: task.assignedTo
    };

    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        comments: arrayUnion(newComment)
      });
      
      // Update local state immediately
      setLocalComments([...localComments, newComment]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <>
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
          >
            <motion.div
              className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black">Task Details</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-black">Title</h3>
                  <p className="text-gray-600">{task.title}</p>
                </div>

                <div>
                  <h3 className="font-medium text-black">Description</h3>
                  <p className="text-gray-600">{task.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-black">Deadline</h3>
                  <p className="text-gray-600">
                    {task.deadline?.toDate().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {task.referenceLinks && task.referenceLinks.length > 0 && (
                  <div>
                    <h3 className="font-medium text-black">Reference Links</h3>
                    <ul className="list-disc pl-5">
                      {task.referenceLinks.map((link, index) => (
                        <li key={index}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 break-all"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-black">Status</h3>
                  <p className="text-gray-600 capitalize">{task.status}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setIsCommentsModalOpen(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Comments
                </button>
                {task.status === 'pending' && (
                  <button
                    onClick={() => {
                      onComplete(task.id);
                      onClose();
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                  >
                    Mark as Complete
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>

          <CommentsModal
            task={task}
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
}
