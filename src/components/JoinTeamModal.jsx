import { useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function JoinTeamModal({ isOpen, onClose, userId }) {
  const [teamId, setTeamId] = useState('');
  const [joinTeamError, setJoinTeamError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setJoinTeamError(null);
    setIsLoading(true);
    
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        setJoinTeamError('Invalid team ID');
        return;
      }

      await updateDoc(teamRef, {
        employees: arrayUnion(userId)
      });

      setTeamId('');
      onClose();
    } catch (error) {
      console.error('Error joining team:', error);
      setJoinTeamError('Failed to join team. Please try again.');
    } finally {
      setIsLoading(false);
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-4">Join Team</h2>
            <form onSubmit={handleJoinTeam}>
              <div className="mb-4">
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Team ID
                </label>
                <input
                  type="text"
                  id="teamId"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              {joinTeamError && (
                <p className="text-red-500 text-sm mb-4">{joinTeamError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors relative"
                >
                  {isLoading ? (
                    <>
                      <span className="opacity-0">Join</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : (
                    'Join'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}