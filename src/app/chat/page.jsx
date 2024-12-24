'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue, push, serverTimestamp, update } from 'firebase/database'; // Add update import
import { db, database } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import ChatBox from '../../components/ChatBox';
import './loader.css'; // Add this import for custom CSS loader

export default function AdminChat() {
  const router = useRouter();
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(320); // Add this state
  const [isLoading, setIsLoading] = useState(true); // Add this state
  

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch all admins
    const fetchAdmins = async () => {
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );

      try {
        const querySnapshot = await getDocs(adminsQuery);
        const adminsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdmins(adminsList);
        setIsLoading(false); // Set loading to false after fetching

        // Remove unread messages count fetching
      } catch (error) {
        console.error('Error fetching admins:', error);
        setIsLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchAdmins();
  }, [user, router]);

  // Listen for messages when an admin is selected
  useEffect(() => {
    if (!selectedAdmin || !user) return;

    const chatRef = ref(database, `chats/${selectedAdmin.id}_${user.uid}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedAdmin, user]);

  const handleAdminSelect = (admin) => {
    setSelectedAdmin(admin);
    setIsChatOpen(true);
  };

  const handleSendMessage = (text) => {
    if (!selectedAdmin || !user) return;

    const chatRef = ref(database, `chats/${selectedAdmin.id}_${user.uid}`);
    push(chatRef, {
      text,
      timestamp: serverTimestamp(),
      isAdmin: false,
      senderId: user.uid
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <div 
          className="transition-all duration-0 ease-in-out w-full"
          style={{ 
            width: isChatOpen ? `calc(100% - ${chatWidth}px)` : '100%',
            marginRight: isChatOpen ? `${chatWidth}px` : '0'
          }}
        >
          <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Chat with Admins</h1>
              {isLoading ? ( // Show loader if loading
                <div className="flex justify-center items-center h-64">
                  <div className="loader"></div> {/* Custom CSS loader */}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      onClick={() => handleAdminSelect(admin)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-800 truncate">{admin.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                          {/* Remove unread messages display */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedAdmin && (
          <ChatBox
            isOpen={isChatOpen}
            onClose={() => {
              setIsChatOpen(false);
              setSelectedAdmin(null);
              setMessages([]);
            }}
            messages={messages}
            onSendMessage={handleSendMessage}
            employeeName={selectedAdmin.name}
            user={user}
            width={chatWidth}
            onWidthChange={setChatWidth}
          />
        )}
      </div>
    </div>
  );
}