'use client'

import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().role !== 'admin') {
          router.push('/dashboard');
        }
      });
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
        const unsubscribeEmployees = onSnapshot(employeesQuery, (querySnapshot) => {
          const employeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEmployees(employeesList);
        }, (error) => {
          console.error('Error fetching employees:', error);
          setError('Error loading employee data. Please try again later.');
        });

        if (user) {
          const tasksQuery = query(collection(db, 'tasks'), where('assignedBy', '==', user.uid));
          const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
            const tasksList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksList);
          }, (error) => {
            console.error('Error fetching tasks:', error);
            setError('Error loading task data. Please try again later.');
          });

          return () => {
            unsubscribeEmployees();
            unsubscribeTasks();
          };
        }
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError('Error loading data. Please try again later.');
      }
    };

    fetchData();
  }, [user]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'pending',
        assignedBy: user.uid, // Add assignedBy field
        createdAt: new Date()
      });
      setNewTask({ title: '', assignedTo: '' });
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Error assigning task. Please try again later.');
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
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Assign New Task</h2>
        <form onSubmit={handleAssignTask} className="space-y-4">
          <input
            type="text"
            placeholder="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <select
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            Assign Task
          </button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">All Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="border p-2 rounded">
                <p><strong>Title:</strong> {task.title}</p>
                <p><strong>Assigned To:</strong> {employees.find(e => e.id === task.assignedTo)?.name || 'Unknown'}</p>
                <p><strong>Status:</strong> {task.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
