'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from '../src/components/ui/button';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Welcome to SnipStash</h1>
        <p className="text-xl mb-8 text-center">Your smart code snippet organizer</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Save Snippets</h2>
            <p>Quickly save and organize your code snippets</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Smart Categories</h2>
            <p>Automatic categorization of your code</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Easy Search</h2>
            <p>Find your snippets instantly</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 w-full">
          <Button 
            className="py-6 text-lg" 
            size="lg" 
            onClick={() => router.push('/login')}
          >
            Login
          </Button>
          <Button 
            className="py-6 text-lg" 
            size="lg" 
            variant="outline" 
            onClick={() => router.push('/register')}
          >
            Register
          </Button>
        </div>
      </div>
    </main>
  );
} 