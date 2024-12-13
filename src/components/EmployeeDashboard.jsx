'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import TaskInfoModal from './TaskInfoModal';
import axios from 'axios';
import JoinTeamModal from './JoinTeamModal';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
  const [taskAssigners, setTaskAssigners] = useState({});

  // useEffect(() => {
  //   if (user) {
  //     const userRef = doc(db, 'users', user.uid);
  //     getDoc(userRef).then((docSnap) => {
  //       if (docSnap.exists() && docSnap.data().role === 'admin') {
  //         router.push('/dashboard');
  //       }
  //     });
  //   }
  // }, [user, router]);

  useEffect(() => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      try {
        const q = query(collection(db, 'tasks'), where('assignedTo', '==', userAuth.uid));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const tasksList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTasks(tasksList);
          
          // Fetch assigner details for each task
          const assignersData = {};
          for (const task of tasksList) {
            if (task.assignedBy && !taskAssigners[task.assignedBy]) {
              const assignerDoc = await getDoc(doc(db, 'users', task.assignedBy));
              if (assignerDoc.exists()) {
                assignersData[task.assignedBy] = assignerDoc.data().name || assignerDoc.data().email;
              }
            }
          }
          setTaskAssigners(prev => ({ ...prev, ...assignersData }));
        }, (error) => {
          console.error('Error fetching tasks:', error);
          setError('Error loading task data. Please try again later.');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up listener:', error);
        setError('Error loading data. Please try again later.');
      }
    }
  }, []);

  const handleCompleteTask = async (taskId, taskTitle) => {
    try {
      const currentTime = new Date().toLocaleString();
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
        message: `The task titled "${taskTitle}" has been completed at ${currentTime} by ${user.email}.`
      });

    } catch (error) {
      console.error('Error completing task:', error);
      setError('Error updating task. Please try again later.');
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
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Assigned tasks</h1>
      <div className="mb-6">
        <button
          onClick={() => setIsJoinTeamModalOpen(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow"
        >
          Join Team
        </button>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-600">No tasks assigned yet.</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task.id} className="border p-4 rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-lg font-medium text-gray-800"><strong>Title:</strong> {task.title}</p>
                  <p className="text-sm text-gray-600"><strong>Status:</strong> {task.status}</p>
                  <p className="text-sm text-gray-600"><strong>Assigned by:</strong> {taskAssigners[task.assignedBy] || 'Loading...'}</p>
                </div>
                <div className="flex gap-3">
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
            ))}
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

      {/* Replace the old modal with the new component */}
      <JoinTeamModal 
        isOpen={isJoinTeamModalOpen}
        onClose={() => setIsJoinTeamModalOpen(false)}
        userId={user?.uid}
      />
    </div>
  );
}
