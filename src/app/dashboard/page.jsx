'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import AdminDashboard from '../../components/AdminDashboard';
import EmployeeDashboard from '../../components/EmployeeDashboard';
import { useRouter } from 'next/navigation';
import TeamsDashboard from '../../components/TeamsDashboard';
import Navbar from '@/components/Navbar';
export default function Dashboard() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const fetchUserRole = async () => {
        try {
          console.log(user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            console.error('User document does not exist');
            setError('User profile not found. Please contact support.');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setError('Error loading user profile. Please try again later.');
        }
      };

      fetchUserRole();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="bg-white text-black">
        <Navbar />
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white text-black">
        <Navbar />
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="bg-white text-black">
        <Navbar />
        <div>Loading user role...</div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black">
      <Navbar />
      {userRole === 'admin' ? <TeamsDashboard /> : <EmployeeDashboard />}
    </div>
  );
}

