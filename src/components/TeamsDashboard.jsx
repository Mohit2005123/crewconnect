'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
function TeamsDashboard() {
    const [teamName, setTeamName] = useState('');
    const [userId, setUserId] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                fetchUserTeams(user.uid);
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
            alert('Team ID copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy team ID:', err);
            alert('Failed to copy team ID');
        }
    };
    const handleViewTeam = (teamId) => {
        router.push(`/teams/${teamId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Team</h1>
                    <p className="text-gray-600">Set up your team and start collaborating</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                            Team Name
                        </label>
                        <input
                            id="teamName"
                            type="text"
                            placeholder="Enter your team name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!userId}
                        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors
                            ${userId 
                                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
                                : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                        {userId ? 'Create Team' : 'Please login to create team'}
                    </button>
                </form>
            </div>
            
            {/* Teams List Section */}
            <div className="max-w-3xl mx-auto mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Teams</h2>
                
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading teams...</p>
                    </div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow">
                        <p className="text-gray-600">You haven't joined any teams yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {teams.map(team => (
                            <div 
                                key={team.id} 
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                            >
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {team.name}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {team.employees?.length || 0} members
                                </p>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                            team.admin === userId 
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {team.admin === userId ? 'Admin' : 'Member'}
                                        </span>
                                        <button 
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={()=>{handleViewTeam(team.id)}}
                                        >
                                            View Details →
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleCopyTeamId(team.id)}
                                        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Team ID
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamsDashboard;