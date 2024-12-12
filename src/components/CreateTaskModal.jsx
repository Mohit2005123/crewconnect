import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import axios from 'axios';

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  employeeId,
  currentUser 
}) {
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');

  const getLinksArray = (links) => {
    return links
      .split('\n')
      .map(link => link.trim())
      .filter(link => link !== '');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim() || !newTask.description.trim()) {
      alert('Title and description cannot be empty.');
      return;
    }

    setIsCreating(true);
    
    const linksArray = getLinksArray(referenceLinks);
    try {
      // Get employee email from users collection
      const employeeDoc = await getDoc(doc(db, 'users', employeeId));
      const employeeEmail = employeeDoc.data().email;
      const employeeName = employeeDoc.data().name;
      
      // Create the task
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        description: newTask.description,
        assignedTo: employeeId,
        status: 'pending',
        createdAt: new Date(),
        assignedBy: currentUser.uid,
        deadline: new Date(deadline),
        referenceLinks: linksArray
      });

      // Send email notification
      await axios.post('/api/sendTaskMail', {
        to: employeeEmail,
        subject: `New Task Assigned: ${newTask.title}`,
        message: `
          <h2>Hello ${employeeName},</h2>
          <p>A new task has been assigned to you:</p>
          <h3>${newTask.title}</h3>
          <p><strong>Description:</strong><br>${newTask.description}</p>
          <p><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
          ${linksArray.length > 0 ? `
            <p><strong>Reference Links:</strong></p>
            <ul>
              ${linksArray.map(link => `<li><a href="${link}">${link}</a></li>`).join('')}
            </ul>
          ` : ''}
          <p>Please log in to your dashboard to view the complete task details and get started.</p>
          <p>Best regards,<br>RBNA & Associates LLP</p>
        `
      });

      onClose();
      setNewTask({ title: '', description: '' });
      setDeadline('');
      setReferenceLinks('');
    } catch (error) {
      console.error('Error creating task or sending notification:', error);
      if (axios.isAxiosError(error)) {
        alert(`Task created but failed to send email: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Task created but there was an error sending the email notification.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Add click outside handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
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
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows="4"
                    placeholder="Enter task description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference Links
                  </label>
                  <textarea
                    value={referenceLinks}
                    onChange={(e) => setReferenceLinks(e.target.value)}
                    placeholder="Enter links (one per line)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isCreating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500 shadow-md hover:shadow-lg"
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}