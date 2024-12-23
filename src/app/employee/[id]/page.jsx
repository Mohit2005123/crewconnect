'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Add useRouter
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../components/AuthProvider'; // Add this import
import CreateTaskModal from '../../../components/CreateTaskModal';
import ReviewTaskModal from '../../../components/ReviewTaskModal';
import AdminTaskInfoModal from '../../../components/AdminTaskInfoModal';
import Navbar from '../../../components/Navbar';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { database } from '../../../lib/firebase'; // Add realtime database to your firebase config
import ChatBox from '../../../components/ChatBox';

export default function EmployeeTasks() {
  const router = useRouter();
  const { user } = useAuth(); // Get current user
  const params = useParams();
  const employeeId = params?.id;

  // Group all useState declarations together at the top
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInfoTask, setSelectedInfoTask] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatWidth, setChatWidth] = useState(320); // Add this state

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

  // Add chat functionality
  useEffect(() => {
    if (!employeeId || !user) return;

    const chatRef = ref(database, `chats/${user.uid}_${employeeId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    return () => unsubscribe();
  }, [employeeId, user]);

  // Separate tasks by assignedBy
  const tasksAssignedByMe = tasks.filter(task => task.assignedBy === user.uid);
  const tasksAssignedByOthers = tasks.filter(task => task.assignedBy !== user.uid);

  // Further separate each category into completed and pending
  const myCompletedTasks = tasksAssignedByMe.filter(task => task.status === 'completed' || task.status === 'requested');
  const myPendingTasks = tasksAssignedByMe.filter(task => task.status === 'pending')
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      const dateA = a.deadline?.toDate?.() || new Date(a.deadline);
      const dateB = b.deadline?.toDate?.() || new Date(b.deadline);
      return dateA - dateB;
    });

  const othersCompletedTasks = tasksAssignedByOthers.filter(task => task.status === 'completed' || task.status === 'requested');
  const othersPendingTasks = tasksAssignedByOthers.filter(task => task.status === 'pending')
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      const dateA = a.deadline?.toDate?.() || new Date(a.deadline);
      const dateB = b.deadline?.toDate?.() || new Date(b.deadline);
      return dateA - dateB;
    });

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
    if (task.status === 'requested' && task.assignedBy === user.uid) {
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

  const handleInfoClick = (task, e) => {
    e.stopPropagation(); // Prevent triggering the task click handler
    setSelectedInfoTask(task);
    setIsInfoModalOpen(true);
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
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

  // Add this function with your other handlers
  const handleDeadlineUpdate = async (taskId, newDeadline) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        deadline: newDeadline
      });
      setEditingTaskId(null);
      setIsEditingDeadline(false);
    } catch (error) {
      console.error('Error updating deadline:', error);
    }
  };

  const handleSendMessage = (text) => {
    if (!employeeId || !user) return;

    const chatRef = ref(database, `chats/${user.uid}_${employeeId}`);
    push(chatRef, {
      text,
      timestamp: serverTimestamp(),
      isAdmin: true,
      senderId: user.uid
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <div 
          className="transition-all duration-0 ease-in-out w-full"
          style={{ 
            width: isChatOpen ? `calc(100% - ${chatWidth}px)` : '100%',
            marginRight: isChatOpen ? `${chatWidth}px` : '0'
          }}
        >
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
                  {/* Tasks Assigned By Me */}
                  <div className="border-b pb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Tasks Assigned By Me</h2>
                    
                    {/* Completed Tasks Section */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Completed Tasks ({myCompletedTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {myCompletedTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className={`bg-white border rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 relative flex justify-between items-center
                              ${task.status === 'requested' ? 'border-purple-200 cursor-pointer' : 'border-gray-200'}`}
                          >
                            <h3 className="font-semibold text-gray-800">{task.title}</h3>
                            <div className="flex items-center gap-4">
                              {task.deadline && (
                                <span className="text-sm text-gray-600">
                                  Due: {task.deadline?.toDate?.().toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }) || new Date(task.deadline).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                                {task.status === 'requested' ? 'Requested ⏳' : task.status}
                              </span>
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
                        {myCompletedTasks.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No completed tasks</p>
                        )}
                      </div>
                    </div>

                    {/* Pending Tasks Section */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Pending Tasks ({myPendingTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {myPendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 flex justify-between items-center"
                          >
                            <h3 className="font-semibold text-gray-800">{task.title}</h3>
                            <div className="flex items-center gap-4">
                              {task.deadline && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    {editingTaskId === task.id ? (
                                      <input
                                        type="date"
                                        defaultValue={task.deadline?.toDate?.().toISOString().split('T')[0] || 
                                                   new Date(task.deadline).toISOString().split('T')[0]}
                                        onChange={(e) => {
                                          const newDate = new Date(e.target.value);
                                          handleDeadlineUpdate(task.id, newDate);
                                        }}
                                        className="border rounded px-2 py-1"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span>
                                          Due: {task.deadline?.toDate?.().toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          }) || new Date(task.deadline).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          })}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTaskId(task.id);
                                          }}
                                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </span>
                                </div>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                                {task.status}
                              </span>
                              <button
                                onClick={(e) => handleInfoClick(task, e)}
                                className="p-2 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleDeleteTask(task.id, e)}
                                className="p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                        {myPendingTasks.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No pending tasks</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Assigned By Others */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Tasks Assigned By Others</h2>
                    
                    {/* Completed Tasks Section */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Completed Tasks ({othersCompletedTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {othersCompletedTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`bg-white border rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 relative flex justify-between items-center
                              ${task.status === 'requested' ? 'border-purple-200' : 'border-gray-200'}`}
                          >
                            <h3 className="font-semibold text-gray-800">{task.title}</h3>
                            <div className="flex items-center gap-4">
                              {task.deadline && (
                                <span className="text-sm text-gray-600">
                                  Due: {task.deadline?.toDate?.().toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }) || new Date(task.deadline).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                                {task.status === 'requested' ? 'Requested ⏳' : task.status}

                              </span>
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
                        {othersCompletedTasks.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No completed tasks</p>
                        )}
                      </div>
                    </div>

                    {/* Pending Tasks Section for Tasks Assigned By Others */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Pending Tasks ({othersPendingTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {othersPendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 flex justify-between items-center"
                            
                          >
                            <h3 className="font-semibold text-gray-800">{task.title}</h3>
                            <div className="flex items-center gap-4">
                              {task.deadline && (
                                <span className="text-sm text-gray-600">
                                  Due: {task.deadline?.toDate?.().toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }) || new Date(task.deadline).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                                {task.status}
                              </span>
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
                        {othersPendingTasks.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No pending tasks</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Add chat button - place this after your main content */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Move ChatBox here */}
        <ChatBox
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          employeeName={employeeName}
          user={user}
          width={chatWidth}
          onWidthChange={setChatWidth}
        />
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


