import React, { useState } from 'react';

function TeamCard({ team, userId, onCopyTeamId, onViewTeam }) {
    const [copying, setCopying] = useState(false);

    const handleCopy = (teamId) => {
        setCopying(true);
        onCopyTeamId(teamId);
        setTimeout(() => setCopying(false), 1000); // Reset after 1 second
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                        onClick={() => onViewTeam(team.id)}
                    >
                        View Details →
                    </button>
                </div>
                <button
                    onClick={() => handleCopy(team.id)}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    {copying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                    {copying ? 'Copied!' : 'Copy Team ID'}
                </button>
            </div>
        </div>
    );
}

export default TeamCard;