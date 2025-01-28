'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import TaskInfoModal from './TaskInfoModal';
import axios from 'axios';
import JoinTeamModal from './JoinTeamModal';
import CommentsModal from './CommentsModal';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
  const [taskAssigners, setTaskAssigners] = useState({});
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);

  // Function to convert Firestore Timestamp to Date
  const convertTimestampToDate = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    // Set the time to 5:30 PM
    date.setHours(17, 30, 0, 0);
    return date;
  };

  // Function to sort tasks by deadline
  const sortTasksByDeadline = (tasksToSort) => {
    return tasksToSort.sort((a, b) => {
      const deadlineA = convertTimestampToDate(a.deadline);
      const deadlineB = convertTimestampToDate(b.deadline);

      // If no deadline, put those tasks at the end
      if (!deadlineA) return 1;
      if (!deadlineB) return -1;
      
      // Compare dates
      return deadlineA.getTime() - deadlineB.getTime();
    });
  };

  // Function to check if a task is overdue
  const isTaskOverdue = (deadline) => {
    const parsedDeadline = convertTimestampToDate(deadline);
    if (!parsedDeadline) return false;
    return parsedDeadline < new Date();
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB') + ' 5:30 PM';
  };

  useEffect(() => {
    const userAuth = auth.currentUser;
    
    // Separate function for unread messages listener
    const setupUnreadMessagesListener = (uid) => {
      return onSnapshot(doc(db, 'users', uid), (userDoc) => {
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || userDoc.data().email);
          setHasUnreadMessages(userDoc.data().unreadMessage || false);
        }
        setIsLoading(false);
      });
    };

    if (userAuth) {
      // Set up unread messages listener
      const unsubscribeMessages = setupUnreadMessagesListener(userAuth.uid);
      
      // Set up tasks listener
      try {
        const q = query(collection(db, 'tasks'), where('assignedTo', '==', userAuth.uid));
        const unsubscribeTasks = onSnapshot(q, async (querySnapshot) => {
          const tasksList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Sort tasks by deadline
          const sortedTasks = sortTasksByDeadline(tasksList);
          
          setTasks(sortedTasks);
          
          const assignersData = {};
          for (const task of sortedTasks) {
            if (task.assignedBy && !taskAssigners[task.assignedBy]) {
              const assignerDoc = await getDoc(doc(db, 'users', task.assignedBy));
              if (assignerDoc.exists()) {
                assignersData[task.assignedBy] = assignerDoc.data().name || assignerDoc.data().email;
              }
            }
          }
          setTaskAssigners(prev => ({ ...prev, ...assignersData }));
        });

        return () => {
          unsubscribeTasks();
          unsubscribeMessages();
        };
      } catch (error) {
        console.error('Error setting up listener:', error);
        setError('Error loading data. Please try again later.');
      }
    }
  }, []);

  const handleCompleteTask = async (taskId, taskTitle) => {
    try {
      const currentTime = new Date().toLocaleDateString('en-GB'); // Changed to dd/mm/yyyy format
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'requested',
        completedAt: new Date()
      });
      const taskDocs = await getDoc(doc(db, 'tasks', taskId));
      const assignedById = taskDocs.data().assignedBy;
      const assignedByRef = doc(db, 'users', assignedById);
      const assignedByDoc = await getDoc(assignedByRef);
      const assignedByEmail = assignedByDoc.data().email;
      const response = await axios.post('/api/sendTaskMail', {
        to: assignedByEmail,
        subject: 'Task Completed',
        message: `The task titled "${taskTitle}" has been completed on ${currentTime} by ${user.email}.`
      });

    } catch (error) {
      console.error('Error completing task:', error);
      setError('Error updating task. Please try again later.');
    }
  };

  const handleChatClick = async () => {
    try {
      if (hasUnreadMessages && user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          unreadMessage: false
        });
        setHasUnreadMessages(false);
      }
      router.push('/chat');
    } catch (error) {
      console.error('Error updating unread messages:', error);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow-md" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-lg mt-20">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {isLoading ? (
          <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mx-auto"></div>
        ) : userName ? (
          `${userName}'s Tasks`
        ) : (
          'Your Tasks'
        )}
      </h1>
      <div className="mb-6">
        <button
          onClick={() => setIsJoinTeamModalOpen(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow"
        >
          Join Team
        </button>
        <button
          onClick={handleChatClick}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow ml-4 relative"
        >
          Chat with Admins
          {hasUnreadMessages && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-600">No tasks assigned yet.</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => {
              const deadline = convertTimestampToDate(task.deadline);
              return (
                <li 
                  key={task.id} 
                  className={`border p-4 rounded-lg flex justify-between items-center shadow-sm hover:shadow-md transition-shadow 
                    ${isTaskOverdue(task.deadline) && task.status !== 'requested' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white'}`}
                >
                  <div>
                    <p className="text-lg font-medium text-gray-800"><strong>Title:</strong> {task.title}</p>
                    <p className="text-sm text-gray-600"><strong>Status:</strong> {task.status}</p>
                    <p className="text-sm text-gray-600"><strong>Assigned by:</strong> {taskAssigners[task.assignedBy] || 'Loading...'}</p>
                    {deadline && (
                      <p className={`text-sm font-medium 
                        ${isTaskOverdue(task.deadline) && task.status !== 'requested'
                          ? 'text-red-600' 
                          : 'text-gray-600'}`}>
                        <strong>Deadline:</strong> {formatDateTime(deadline)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedTaskForComments(task);
                        setIsCommentsModalOpen(true);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow"
                    >
                      Comments
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setIsInfoModalOpen(true);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow"
                    >
                      Info
                    </button>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleCompleteTask(task.id, task.title)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow"
                      >
                        Mark as Complete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Task Info Modal */}
      <TaskInfoModal
        task={selectedTask}
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setSelectedTask(null);
        }}
        onComplete={handleCompleteTask}
      />

      {/* Join Team Modal */}
      <JoinTeamModal 
        isOpen={isJoinTeamModalOpen}
        onClose={() => setIsJoinTeamModalOpen(false)}
        userId={user?.uid}
      />

      {/* Add CommentsModal */}
      <CommentsModal
        task={selectedTaskForComments}
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false);
          setSelectedTaskForComments(null);
        }}
      />
    </div>
  );
}