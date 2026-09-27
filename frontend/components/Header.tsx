'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
}

export default function Header({ user: propUser }: HeaderProps) {
  const [user, setUser] = useState<{ name?: string; email?: string; avatar?: string } | null>(propUser || null);
  const router = useRouter();

  // Sync with prop if it changes, otherwise fallback to localStorage
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }
    }
  }, [propUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="font-bold text-lg text-indigo-600">ReachInbox Scheduler</div>

      {user && (
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar || 'https://via.placeholder.com/40'}
            alt={user.name || 'User Avatar'}
            className="w-9 h-9 rounded-full border border-gray-300"
          />
          <div className="text-sm text-left">
            <div className="font-semibold text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-4 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}