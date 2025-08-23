'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'initializing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  const checkDatabaseStatus = async () => {
    setStatus('checking');
    setMessage('Checking database status...');
    
    try {
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/setup/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setDetails(data);
      
      if (data.success) {
        setStatus('success');
        setMessage('Database status checked successfully');
      } else {
        setStatus('error');
        setMessage('Failed to check database status');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error checking database status');
      console.error('Database status check failed:', error);
    }
  };

  const initializeDatabase = async () => {
    setStatus('initializing');
    setMessage('Initializing database... This may take a few minutes.');
    
    try {
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/setup/init-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setDetails(data);
      
      if (data.success) {
        setStatus('success');
        setMessage('Database initialized successfully! All tables created and ready to use.');
      } else {
        setStatus('error');
        setMessage(`Database initialization failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error initializing database');
      console.error('Database initialization failed:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'initializing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
      case 'initializing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Halo Database Setup
            </CardTitle>
            <CardDescription>
              Initialize and configure the database for Halo social media platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Display */}
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
              {getStatusIcon()}
              <span className={getStatusColor()}>{message || 'Ready to check database status'}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={checkDatabaseStatus}
                disabled={status === 'checking' || status === 'initializing'}
                variant="outline"
              >
                {status === 'checking' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Database Status'
                )}
              </Button>
              
              <Button 
                onClick={initializeDatabase}
                disabled={status === 'checking' || status === 'initializing'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {status === 'initializing' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Initialize Database'
                )}
              </Button>
            </div>

            {/* Details Display */}
            {details && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Database Details:</h3>
                <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Instructions:</strong>
                <br />
                1. First click "Check Database Status" to see current state
                <br />
                2. If database needs initialization, click "Initialize Database"
                <br />
                3. Wait for the process to complete
                <br />
                4. After successful initialization, you can register/login
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}