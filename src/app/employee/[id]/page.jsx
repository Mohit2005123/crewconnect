'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Add useRouter
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../components/AuthProvider'; // Add this import
import CreateTaskModal from '../../../components/CreateTaskModal';
import ReviewTaskModal from '../../../components/ReviewTaskModal';
import AdminTaskInfoModal from '../../../components/AdminTaskInfoModal';

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
  const [selectedInfoTask, setSelectedInfoTask] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleInfoClick = (task, e) => {
    e.stopPropagation(); // Prevent triggering the task click handler
    setSelectedInfoTask(task);
    setIsInfoModalOpen(true);
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
                      className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 relative
                        ${task.status === 'requested' ? 'border-purple-200 cursor-pointer' : 'border-gray-200'}`}
                    >
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">
                        {task.title}
                      </h3>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 font-medium">Status:</span>
                          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                            {task.status === 'requested' ? 'Requested ⏳' : task.status}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleInfoClick(task, e)}
                          className="p-2 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </button>
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
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 font-medium">Status:</span>
                          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleInfoClick(task, e)}
                          className="p-2 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </button>
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

      <ReviewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTask={selectedTask}
        isUpdating={isUpdating}
        onUpdateTask={handleTaskUpdate}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employeeId={employeeId}
        currentUser={user}
      />

      <AdminTaskInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setSelectedInfoTask(null);
        }}
        task={selectedInfoTask}
      />
    </div>
  );
}
