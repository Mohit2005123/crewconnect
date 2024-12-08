'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import TaskInfoModal from './TaskInfoModal';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().role === 'admin') {
          router.push('/dashboard');
        }
      });
    }
  }, [user, router]);

  useEffect(() => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      try {
        const q = query(collection(db, 'tasks'), where('assignedTo', '==', userAuth.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const tasksList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTasks(tasksList);
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

  const handleCompleteTask = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'requested',
        completedAt: new Date()
      });
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Error updating task. Please try again later.');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <p><strong>Title:</strong> {task.title}</p>
                  <p><strong>Status:</strong> {task.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setIsInfoModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Info
                  </button>
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
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
    </div>
  );
}
