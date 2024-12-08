'use client'
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';

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
      {isInfoModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Task Details</h2>
              <button
                onClick={() => {
                  setIsInfoModalOpen(false);
                  setSelectedTask(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-black">Title</h3>
                <p className="text-gray-600">{selectedTask.title}</p>
              </div>

              <div>
                <h3 className="font-medium text-black">Description</h3>
                <p className="text-gray-600">{selectedTask.description}</p>
              </div>

              <div>
                <h3 className="font-medium text-black">Deadline</h3>
                <p className="text-gray-600">
                  {selectedTask.deadline?.toDate().toLocaleString()}
                </p>
              </div>

              {selectedTask.referenceLinks && selectedTask.referenceLinks.length > 0 && (
                <div>
                  <h3 className="font-medium text-black">Reference Links</h3>
                  <ul className="list-disc pl-5">
                    {selectedTask.referenceLinks.map((link, index) => (
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
                <p className="text-gray-600 capitalize">{selectedTask.status}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              {selectedTask.status === 'pending' && (
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                    setIsInfoModalOpen(false);
                    setSelectedTask(null);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                  Mark as Complete
                </button>
              )}
              <button
                onClick={() => {
                  setIsInfoModalOpen(false);
                  setSelectedTask(null);
                }}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

