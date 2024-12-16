'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
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
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => handleEmployeeClick(employee.id)}
                  >
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