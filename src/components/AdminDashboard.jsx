// 'use client';

// import { useState, useEffect } from 'react';
// import { collection, query, onSnapshot, where, addDoc } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { useAuth } from '../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import AssignTaskModal from './AssignTaskModal';

// export default function AdminDashboard() {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [employees, setEmployees] = useState([]);
//   const [task, setTask] = useState('');
//   const [selectedEmployee, setSelectedEmployee] = useState('');
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [deadline, setDeadline] = useState('');
//   const [description, setDescription] = useState('');
//   const [referenceLinks, setReferenceLinks] = useState('');

//   useEffect(() => {
//     if (user) {
//       const fetchEmployees = async () => {
//         try {
//           const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
//           const unsubscribe = onSnapshot(employeesQuery, (querySnapshot) => {
//             const employeesList = querySnapshot.docs.map((doc) => ({
//               id: doc.id,
//               ...doc.data(),
//             }));
//             setEmployees(employeesList);
//           });
//           return () => unsubscribe();
//         } catch (error) {
//           console.error('Error fetching employees:', error);
//           setError('Error loading employee data. Please try again later.');
//         }
//       };

//       fetchEmployees();
//     }
//   }, [user]);

//   const handleTaskSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedEmployee || !task || !deadline || !description) {
//       setError('Please fill in all required fields.');
//       return;
//     }

//     try {
//       const linksArray = referenceLinks
//         .split('\n')
//         .map((link) => link.trim())
//         .filter((link) => link !== '');

//       await addDoc(collection(db, 'tasks'), {
//         assignedTo: selectedEmployee,
//         status: 'pending',
//         title: task,
//         description: description,
//         deadline: new Date(deadline),
//         createdAt: new Date(),
//         assignedBy: user.uid,
//         referenceLinks: linksArray,
//       });

//       setSuccessMessage('Task assigned successfully!');
//       setTask('');
//       setSelectedEmployee('');
//       setDeadline('');
//       setDescription('');
//       setReferenceLinks('');
//       setIsModalOpen(false);
//     } catch (error) {
//       console.error('Error assigning task:', error);
//       setError('Error assigning task. Please try again.');
//     }
//   };

//   if (error) {
//     return (
//       <div className="container mx-auto p-4">
//         <div
//           className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative"
//           role="alert"
//         >
//           <strong className="font-bold">Error:</strong>
//           <span className="block sm:inline"> {error}</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-4 bg-white text-black">
//       <h1 className="text-2xl font-bold mb-4 text-black">Admin Dashboard</h1>

//       <div>
//         <h2 className="text-xl font-semibold mb-2 text-black">Employees</h2>
//         {employees.length === 0 ? (
//           <p className="text-black">No employees found.</p>
//         ) : (
//           <ul className="space-y-2">
//             {employees.map((employee) => (
//               <li
//                 key={employee.id}
//                 className="border p-2 rounded bg-white text-black cursor-pointer hover:bg-gray-200 transition"
//                 onClick={() => router.push(`/employee/${employee.id}`)}
//               >
//                 <p>
//                   <strong>Name:</strong> {employee.name}
//                 </p>
//                 <p>
//                   <strong>Email:</strong> {employee.email}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       <div className="mt-8">
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
//         >
//           Assign New Task
//         </button>
//       </div>

//       <AssignTaskModal
//         isModalOpen={isModalOpen}
//         setIsModalOpen={setIsModalOpen}
//         employees={employees}
//         task={task}
//         setTask={setTask}
//         selectedEmployee={selectedEmployee}
//         setSelectedEmployee={setSelectedEmployee}
//         deadline={deadline}
//         setDeadline={setDeadline}
//         description={description}
//         setDescription={setDescription}
//         referenceLinks={referenceLinks}
//         setReferenceLinks={setReferenceLinks}
//         handleTaskSubmit={handleTaskSubmit}
//         successMessage={successMessage}
//       />
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  AlertTriangle, 
  Mail, 
  CheckCircle2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import AssignTaskModal from './AssignTaskModal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [task, setTask] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          toast.error('Error loading employee data', {
            description: 'Please try again later.'
          });
        }
      };

      fetchEmployees();
    }
  }, [user]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee || !task || !deadline || !description) {
      toast.error('Incomplete Form', {
        description: 'Please fill in all required fields.'
      });
      return;
    }

    try {
      const linksArray = referenceLinks
        .split('\n')
        .map((link) => link.trim())
        .filter((link) => link !== '');

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

      toast.success('Task Assigned', {
        description: 'Task has been successfully assigned to the employee.'
      });

      // Reset form
      setTask('');
      setSelectedEmployee('');
      setDeadline('');
      setDescription('');
      setReferenceLinks('');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Task Assignment Failed', {
        description: 'Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster richColors />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Users className="mr-3 text-blue-600" size={32} />
            Admin Dashboard
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Employees Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 text-blue-600" />
                Employee List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <AlertTriangle className="mx-auto mb-2 text-yellow-500" size={32} />
                  No employees found
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div 
                      key={employee.id} 
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => router.push(`/employee/${employee.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-800 flex items-center">
                            <span className="mr-2">{employee.name}</span>
                          </p>
                          <p className="text-gray-500 flex items-center">
                            <Mail className="mr-2 text-blue-500" size={16} />
                            {employee.email}
                          </p>
                        </div>
                        <CheckCircle2 className="text-green-500" size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Assignment Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 text-green-600" />
                Assign New Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssignTaskModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                employees={employees}
                task={task}
                setTask={setTask}
                selectedEmployee={selectedEmployee}
                setSelectedEmployee={setSelectedEmployee}
                deadline={deadline}
                setDeadline={setDeadline}
                description={description}
                setDescription={setDescription}
                referenceLinks={referenceLinks}
                setReferenceLinks={setReferenceLinks}
                handleTaskSubmit={handleTaskSubmit}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}