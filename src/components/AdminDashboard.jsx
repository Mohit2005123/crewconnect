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
import axios from 'axios';

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

  async function handleTaskSubmit(e) {
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

      const employeeEmail = employees.find(employee => employee.id === selectedEmployee).email;
      if(employeeEmail){
        const emailBody = `
          <p>Dear ${employees.find(employee => employee.id === selectedEmployee).name},</p>
          <p>You have been assigned a new task titled "<strong>${task}</strong>".</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
          <p>Please find the reference links below:</p>
          <ul>${linksArray.map(link => `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></li>`).join('')}</ul>
          <p>Best regards,</p>
          <p>RBNA & Associates LLP</p>
          <img src="https://www.rbnaca.com/uploads/logo/19683836f91695826400.png" alt="Company Logo" style="width:500px;height:auto;"/>
        `;

        await axios.post('/api/sendTaskMail', {
          to: employeeEmail, 
          subject: 'Task Assigned', 
          message: emailBody 
        });
      }

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
      console.log(error);
      toast.error('Task Assignment Failed', {
        description: 'Please try again.'
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster richColors />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Users className="mr-3 text-blue-600" size={32} />
            Admin Dashboard
          </h1>
        </div>

        {/* Task Assignment Section */}
        <Card className="shadow-lg mb-8 transition-transform">
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

        {/* Employees Section */}
        <Card className="shadow-lg transition-transform">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                  <div 
                    key={employee.id} 
                    className="bg-white border rounded-lg p-4 transition-all cursor-pointer"
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
      </div>
    </div>
  );
}