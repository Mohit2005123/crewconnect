'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // or manually unwrap the params Promise
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getDoc } from 'firebase/firestore';

export default function EmployeeTasks() {
  const params = useParams(); // Unwrap params as a Promise
  const [tasks, setTasks] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const employeeId = params?.id; // Adjust for your specific param key (e.g., 'id')

  useEffect(() => {
    if (!employeeId) return;

    // Fetch tasks assigned to this employee
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', employeeId)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (querySnapshot) => {
        const tasksList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksList);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
      }
    );

    // Fetch employee name
    const fetchEmployeeName = async () => {
      try {
        const employeeDoc = await getDoc(doc(db, 'users', employeeId));
        if (employeeDoc.exists()) {
          setEmployeeName(employeeDoc.data().name);
        }
      } catch (error) {
        console.error('Error fetching employee name:', error);
      }
    };

    fetchEmployeeName();

    return () => unsubscribe();
  }, [employeeId]);

  // Update computed values to move requested tasks to completed section
  const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'requested');
  const pendingTasks = tasks.filter(task => task.status === 'pending');

  // Helper function to get status styles
  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'requested':
        return 'bg-purple-100 text-purple-800 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskClick = (task) => {
    if (task.status === 'requested') {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  const handleTaskUpdate = async (action) => {
    if (!selectedTask) return;
    
    setIsUpdating(true);
    const taskRef = doc(db, 'tasks', selectedTask.id);

    try {
      if (action === 'accept') {
        await deleteDoc(taskRef);
      } else {
        await updateDoc(taskRef, {
          status: 'pending'
        });
      }
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
            {employeeName ? `${employeeName}'s Tasks` : 'Loading...'}
          </h1>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Completed Tasks Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Completed Tasks ({completedTasks.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200
                        ${task.status === 'requested' ? 'border-purple-200 cursor-pointer' : 'border-gray-200'}`}
                    >
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">
                        {task.title}
                      </h3>
                      <div className="flex items-center mt-3">
                        <span className="text-sm text-gray-600 font-medium">Status:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                          {task.status === 'requested' ? 'Requested ⏳' : task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {completedTasks.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No completed tasks</p>
                )}
              </div>

              {/* Pending Tasks Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Pending Tasks ({pendingTasks.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200"
                    >
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">
                        {task.title}
                      </h3>
                      <div className="flex items-center mt-3">
                        <span className="text-sm text-gray-600 font-medium">Status:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingTasks.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending tasks</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Review Task Completion</h3>
            <p className="text-gray-600 mb-6">
              Would you like to accept or reject the completion request for "{selectedTask?.title}"?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isUpdating}
                className={`px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTaskUpdate('reject')}
                disabled={isUpdating}
                className={`px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Updating...' : 'Reject'}
              </button>
              <button
                onClick={() => handleTaskUpdate('accept')}
                disabled={isUpdating}
                className={`px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Updating...' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
