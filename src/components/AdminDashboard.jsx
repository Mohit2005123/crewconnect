// 'use client'

// import { useState, useEffect } from 'react';
// import { collection, addDoc, query, onSnapshot, updateDoc, doc, getDoc, where } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { useAuth } from '../components/AuthProvider';
// import { useRouter } from 'next/navigation';

// export default function AdminDashboard() {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [employees, setEmployees] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [newTask, setNewTask] = useState({ title: '', assignedTo: '' });
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (user) {
//       const userRef = doc(db, 'users', user.uid);
//       getDoc(userRef).then((docSnap) => {
//         if (docSnap.exists() && docSnap.data().role !== 'admin') {
//           router.push('/dashboard');
//         }
//       });
//     }
//   }, [user, router]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
//         const unsubscribeEmployees = onSnapshot(employeesQuery, (querySnapshot) => {
//           const employeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//           setEmployees(employeesList);
//         }, (error) => {
//           console.error('Error fetching employees:', error);
//           setError('Error loading employee data. Please try again later.');
//         });

//         if (user) {
//           const tasksQuery = query(collection(db, 'tasks'), where('assignedBy', '==', user.uid));
//           const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
//             const tasksList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//             setTasks(tasksList);
//           }, (error) => {
//             console.error('Error fetching tasks:', error);
//             setError('Error loading task data. Please try again later.');
//           });

//           return () => {
//             unsubscribeEmployees();
//             unsubscribeTasks();
//           };
//         }
//       } catch (error) {
//         console.error('Error setting up listeners:', error);
//         setError('Error loading data. Please try again later.');
//       }
//     };

//     fetchData();
//   }, [user]);

//   const handleAssignTask = async (e) => {
//     e.preventDefault();
//     try {
//       await addDoc(collection(db, 'tasks'), {
//         ...newTask,
//         status: 'pending',
//         assignedBy: user.uid, // Add assignedBy field
//         createdAt: new Date()
//       });
//       setNewTask({ title: '', assignedTo: '' });
//     } catch (error) {
//       console.error('Error assigning task:', error);
//       setError('Error assigning task. Please try again later.');
//     }
//   };

//   if (error) {
//     return (
//       <div className="container mx-auto p-4">
//         <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
//           <strong className="font-bold">Error:</strong>
//           <span className="block sm:inline"> {error}</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-4 bg-white text-black">
//       <h1 className="text-2xl font-bold mb-4 text-black">Admin Dashboard</h1>
//       <div className="mb-8">
//         <h2 className="text-xl font-semibold mb-2 text-black">Assign New Task</h2>
//         <form onSubmit={handleAssignTask} className="space-y-4">
//           <input
//             type="text"
//             placeholder="Task Title"
//             value={newTask.title}
//             onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
//             className="w-full p-2 border rounded bg-white text-black"
//             required
//           />
//           <select
//             value={newTask.assignedTo}
//             onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
//             className="w-full p-2 border rounded bg-white text-black"
//             required
//           >
//             <option value="">Select Employee</option>
//             {employees.map((employee) => (
//               <option key={employee.id} value={employee.id}>{employee.name}</option>
//             ))}
//           </select>
//           <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
//             Assign Task
//           </button>
//         </form>
//       </div>
//       <div>
//         <h2 className="text-xl font-semibold mb-2 text-black">All Tasks</h2>
//         {tasks.length === 0 ? (
//           <p className="text-black">No tasks assigned yet.</p>
//         ) : (
//           <ul className="space-y-2">
//             {tasks.map((task) => (
//               <li key={task.id} className="border p-2 rounded bg-white text-black">
//                 <p><strong>Title:</strong> {task.title}</p>
//                 <p><strong>Assigned To:</strong> {employees.find(e => e.id === task.assignedTo)?.name || 'Unknown'}</p>
//                 <p><strong>Status:</strong> {task.status}</p>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [task, setTask] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchEmployees = async () => {
        try {
          const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
          const unsubscribe = onSnapshot(employeesQuery, (querySnapshot) => {
            const employeesList = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setEmployees(employeesList);
          });
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching employees:', error);
          setError('Error loading employee data. Please try again later.');
        }
      };

      fetchEmployees();
    }
  }, [user]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !task) {
      setError('Please select an employee and provide a task.');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        assignedTo: selectedEmployee,
        status: 'pending',
        title: task,
        createdAt: new Date(),
        assignedBy: user.uid,
      });

      setSuccessMessage('Task assigned successfully!');
      setTask('');
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Error assigning task. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div
          className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4 text-black">Admin Dashboard</h1>

      <div>
        <h2 className="text-xl font-semibold mb-2 text-black">Employees</h2>
        {employees.length === 0 ? (
          <p className="text-black">No employees found.</p>
        ) : (
          <ul className="space-y-2">
            {employees.map((employee) => (
              <li
                key={employee.id}
                className="border p-2 rounded bg-white text-black cursor-pointer hover:bg-gray-200 transition"
                onClick={() => router.push(`/employee/${employee.id}`)}
              >
                <p>
                  <strong>Name:</strong> {employee.name}
                </p>
                <p>
                  <strong>Email:</strong> {employee.email}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-black">Assign Task</h2>
        {successMessage && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label htmlFor="employee" className="block font-medium text-black">
              Select Employee
            </label>
            <select
              id="employee"
              className="block w-full border border-gray-300 rounded p-2"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task" className="block font-medium text-black">
              Task
            </label>
            <textarea
              id="task"
              className="block w-full border border-gray-300 rounded p-2"
              rows="4"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter task details"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Assign Task
          </button>
        </form>
      </div>
    </div>
  );
}
