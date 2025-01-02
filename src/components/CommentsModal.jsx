'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function CommentsModal({ task, isOpen, onClose }) {
  const overlayRef = useRef();
  const [comment, setComment] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
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
      setLocalComments([...localComments, newComment]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
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
              <h2 className="text-xl font-semibold text-black">Comments</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                {localComments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-2">
                    {[...localComments].reverse().map((comment, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">{comment.text}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(comment.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 border rounded p-2"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleAddComment}
                  disabled={isSubmitting}
                  className={`${
                    isSubmitting ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white px-4 py-2 rounded transition flex items-center`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : 'Add'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
