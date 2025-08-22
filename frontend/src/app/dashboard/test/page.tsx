'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 Test Dashboard: Checking authentication...');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    console.log('👤 User data:', userData ? 'Present' : 'Missing');
    
    if (!token || !userData) {
      console.log('❌ Test Dashboard: Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    console.log('✅ Test Dashboard: User authenticated');
    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🎉 Test Dashboard - Working!</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Display Name:</strong> {user.displayName}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Access Token:</strong> {localStorage.getItem('accessToken') ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>Refresh Token:</strong> {localStorage.getItem('refreshToken') ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>User Data:</strong> {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Go to Full Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}