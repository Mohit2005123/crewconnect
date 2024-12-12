'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Add useRouter
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../components/AuthProvider'; // Add this import
import axios from 'axios';

export default function EmployeeTasks() {
  const router = useRouter();
  const { user } = useAuth(); // Get current user
  const params = useParams();
  
  // Add loading state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Move auth check to separate useEffect
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user has admin role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.push('/dashboard');
      } else {
        setIsAdmin(true);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [user, router]);

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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');

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
        assignedBy: user.uid,
        deadline: new Date(deadline),
        referenceLinks: linksArray
      });

      // Send email notification using axios
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

      setIsCreateModalOpen(false);
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
  const getLinksArray = (links) => {
    return links
      .split('\n')
      .map(link => link.trim())
      .filter(link => link !== '');
  };

  // Add loading and admin check before rendering main content
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Return nothing while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              {employeeName ? `${employeeName}'s Tasks` : 'Loading...'}
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Task
            </button>
          </div>
          
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Links
                  </label>
                  <textarea
                    value={referenceLinks}
                    onChange={(e) => setReferenceLinks(e.target.value)}
                    placeholder="Enter links (one per line)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
