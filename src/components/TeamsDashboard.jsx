'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import CreateTeamModal from './CreateTeamModal';
import TeamCard from './TeamCard';

function TeamsDashboard() {
    const [teamName, setTeamName] = useState('');
    const [userId, setUserId] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();
    const [userName, setUserName]= useState('');
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                fetchUserTeams(user.uid);
                setUserName(user.displayName);
            } else {
                setUserId(null);
                setTeams([]);
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

                {/* Action Button */}
                <div className="flex justify-center mb-12">
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
                </div>

                <CreateTeamModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userId={userId}
                    onTeamCreated={() => fetchUserTeams(userId)}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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