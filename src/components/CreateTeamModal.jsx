import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

function CreateTeamModal({ isOpen, onClose, userId, onTeamCreated }) {
    const [teamName, setTeamName] = useState('');

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
            const teamRef = await addDoc(collection(db, 'teams'), newTeam);
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                teams: arrayUnion(teamRef.id)
            });

            alert('Team created successfully!');
            setTeamName('');
            onTeamCreated();
            onClose();
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('Failed to create team.');
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative top-20 mx-auto p-8 border w-[450px] shadow-xl rounded-xl bg-white"
                    >
                        <div className="mt-2">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Create a New Team</h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-700"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    className="flex justify-end gap-4"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                                    >
                                        Create Team
                                    </button>
                                </motion.div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CreateTeamModal;