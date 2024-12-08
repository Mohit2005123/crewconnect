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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');

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
    if (!selectedEmployee || !task || !deadline || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const linksArray = referenceLinks
        .split('\n')
        .map(link => link.trim())
        .filter(link => link !== '');

      await addDoc(collection(db, 'tasks'), {
        assignedTo: selectedEmployee,
        status: 'pending',
        title: task,
        description: description,
        deadline: new Date(deadline),
        createdAt: new Date(),
        assignedBy: user.uid,
        referenceLinks: linksArray,
      });

      setSuccessMessage('Task assigned successfully!');
      setTask('');
      setSelectedEmployee('');
      setDeadline('');
      setDescription('');
      setReferenceLinks('');
      setIsModalOpen(false);
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Assign New Task
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Assign Task</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

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
                  Task Title
                </label>
                <input
                  type="text"
                  id="task"
                  className="block w-full border border-gray-300 rounded p-2"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label htmlFor="description" className="block font-medium text-black">
                  Description
                </label>
                <textarea
                  id="description"
                  className="block w-full border border-gray-300 rounded p-2"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed task description"
                />
              </div>
              <div>
                <label htmlFor="deadline" className="block font-medium text-black">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  className="block w-full border border-gray-300 rounded p-2"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="referenceLinks" className="block font-medium text-black">
                  Reference Links
                </label>
                <textarea
                  id="referenceLinks"
                  className="block w-full border border-gray-300 rounded p-2"
                  rows="2"
                  value={referenceLinks}
                  onChange={(e) => setReferenceLinks(e.target.value)}
                  placeholder="Add any relevant links (one per line)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
