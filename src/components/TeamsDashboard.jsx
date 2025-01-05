'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import CreateTeamModal from './CreateTeamModal';
import TeamCard from './TeamCard';
import JoinTeamModal from './JoinTeamModal';
function TeamsDashboard() {
    const [teamName, setTeamName] = useState('');
    const [userId, setUserId] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJoinModalOpen, setJoinModalOpen] = useState(false);
    const router = useRouter();
    const [userName, setUserName]= useState('');
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                fetchUserTeams(user.uid);
                
                // First try to get displayName
                if (user.displayName) {
                    setUserName(user.displayName);
                } else {
                    // If no displayName, fetch from users collection
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUserName(userData.name || userData.username || 'User'); // fallback to 'User' if no name found
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                        setUserName('User'); // fallback to 'User' if error occurs
                    }
                }
            } else {
                setUserId(null);
                setTeams([]);
                setUserName('');
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUserTeams = async (uid) => {
        try {
            setLoading(true);
            // Get user document
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (!userDoc.exists()) return;

            const userTeamIds = userDoc.data().teams || [];
            
            // Fetch all team documents
            const teamsData = await Promise.all(
                userTeamIds.map(teamId => 
                    getDoc(doc(db, 'teams', teamId))
                )
            );

            const teamsArray = teamsData
                .filter(doc => doc.exists())
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            setTeams(teamsArray);
        } catch (error) {
            console.error('Error fetching teams: ', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            alert('User not authenticated');
            return;
        }

        const newTeam = {
            name: teamName,
            admin: userId,
            employees: []
        };

        try {
            // Create the team
            const teamRef = await addDoc(collection(db, 'teams'), newTeam);
            
            // Update user's teams array
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                teams: arrayUnion(teamRef.id)
            });

            alert('Team created successfully!');
            setTeamName('');
            // Refresh the teams list
            fetchUserTeams(userId);
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('Failed to create team.');
        }
    };

    const handleCopyTeamId = async (teamId) => {
        try {
            await navigator.clipboard.writeText(teamId);
        } catch (err) {
            console.error('Failed to copy team ID:', err);
            alert('Failed to copy team ID');
        }
    };
    const handleViewTeam = (teamId) => {
        router.push(`/teams/${teamId}`);
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        try {
            // Delete team from user's teams array
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                teams: teams.filter(team => team.id !== teamId).map(team => team.id)
            });

            // Delete the team document
            await deleteDoc(doc(db, 'teams', teamId));

            // Update local state
            setTeams(teams.filter(team => team.id !== teamId));
            alert('Team deleted successfully!');
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Failed to delete team.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {userName? userName+`'s`:'Your'} Dashboard 
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Manage your teams and collaborate with your colleagues efficiently.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mb-12 space-x-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!userId}
                        className={`
                            group relative px-6 py-3 rounded-full text-white font-medium
                            transition-all duration-300 ease-in-out transform hover:scale-105
                            shadow-lg hover:shadow-xl
                            ${userId 
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                                : 'bg-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Create New Team</span>
                        </span>
                    </button>

                    <button
                        onClick={() => setJoinModalOpen(true)}
                        disabled={!userId}
                        className={`
                            group relative px-6 py-3 rounded-full text-white font-medium
                            transition-all duration-300 ease-in-out transform hover:scale-105
                            shadow-lg hover:shadow-xl
                            ${userId 
                                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                                : 'bg-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Join a Team</span>
                        </span>
                    </button>

                    <button
                        onClick={() => router.push('/tasks')}
                        disabled={!userId}
                        className={`
                            group relative px-6 py-3 rounded-full text-white font-medium
                            transition-all duration-300 ease-in-out transform hover:scale-105
                            shadow-lg hover:shadow-xl
                            ${userId 
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                                : 'bg-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>Employee Dashboard</span>
                        </span>
                    </button>
                </div>
                <CreateTeamModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userId={userId}
                    onTeamCreated={() => fetchUserTeams(userId)}
                />
                <JoinTeamModal
                    isOpen={isJoinModalOpen}
                    onClose={() => setJoinModalOpen(false)}
                    userId={userId}
                    className="z-50 fixed inset-0"
                />
                
                {/* Teams Grid Section */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-6 text-gray-600 text-lg">Loading your teams...</p>
                    </div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-lg max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-xl">
                        <div className="p-6">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-600 text-lg mb-4">You haven't joined any teams yet.</p>
                            <p className="text-gray-500">Create a new team or join an existing one to get started!</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-8">
                        {teams.map((team, index) => (
                            <div key={team.id} 
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <TeamCard
                                    team={team}
                                    userId={userId}
                                    onCopyTeamId={handleCopyTeamId}
                                    onViewTeam={handleViewTeam}
                                    onDeleteTeam={handleDeleteTeam}
                                    isAdmin={team.admin=== userId}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


export default TeamsDashboard;