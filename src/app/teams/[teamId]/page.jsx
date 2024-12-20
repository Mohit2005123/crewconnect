'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayRemove, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Navbar from '../../../components/Navbar';

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId;
  const [employees, setEmployees] = useState([]);
  const [teamName, setTeamName] = useState('');
  useEffect(() => {
    if (!teamId) return;

    // First, get the team document to access the employees array
    const teamDocRef = doc(db, 'teams', teamId);
    const unsubscribe = onSnapshot(teamDocRef, async (teamDoc) => {
      if (!teamDoc.exists()) {
        console.error('Team not found');
        return;
      }
      const teamData = teamDoc.data();
      const employeeIds = teamData.employees || [];
      setTeamName(teamData.name);
      // Fetch user data for each employee ID
      const employeePromises = employeeIds.map(async (employeeId) => {
        const userDoc = await getDoc(doc(db, 'users', employeeId));
        if (userDoc.exists()) {
          return {
            id: userDoc.id,
            ...userDoc.data()
          };
        }
        return null;
      });

      const employeeData = await Promise.all(employeePromises);
      // Filter out any null values (in case some users weren't found)
      setEmployees(employeeData.filter(employee => employee !== null));
    });

    return () => unsubscribe();
  }, [teamId]);

  const handleEmployeeClick = (employeeId) => {
    router.push(`/employee/${employeeId}`);
  };

  const handleRemoveEmployee = async (employeeId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this employee from the team? All tasks assigned to this employee will also be deleted.')) {
      return;
    }

    try {
      // First, get and delete all tasks assigned to this employee
      const tasksRef = collection(db, 'tasks');
      const tasksQuery = query(tasksRef, where('assignedTo', '==', employeeId));
      const taskSnapshot = await getDocs(tasksQuery);
      
      // Delete each task
      const deletePromises = taskSnapshot.docs.map(taskDoc => 
        deleteDoc(doc(db, 'tasks', taskDoc.id))
      );
      await Promise.all(deletePromises);
      // Then remove employee from team
      const teamDocRef = doc(db, 'teams', teamId);
      await updateDoc(teamDocRef, {
        employees: arrayRemove(employeeId)
      });
    } catch (error) {
      console.error('Error removing employee and tasks:', error);
      alert('Failed to remove employee and associated tasks');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
             {teamName} Members
          </h1>
          
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No employees in this team.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer relative"
                    onClick={() => handleEmployeeClick(employee.id)}
                  >
                    <button
                      onClick={(e) => handleRemoveEmployee(employee.id, e)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}