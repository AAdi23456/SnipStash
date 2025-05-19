'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code, Search, FolderTree } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <div className="w-full px-4 py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-4" variant="outline">Welcome to SnipStash</Badge>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 overflow-hidden">
            <div className="relative">
              <span className="inline-block animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s' }}>Code</span>{' '}
              <span className="inline-block animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>Snippets,</span>
            </div>
            <div className="relative mt-2">
              {['O','r','g','a','n','i','z','e','d',' ','I','n','t','e','l','l','i','g','e','n','t','l','y'].map((char, index) => (
                <span 
                  key={`${char}-${index}`}
                  className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 animate-fade-in-up opacity-0" 
                  style={{ 
                    animationDelay: `${0.5 + index * 0.05}s`
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto animate-fade-in opacity-0" style={{ animationDelay: '1.8s' }}>
            Save, organize and retrieve your code snippets with a powerful and intuitive platform designed for developers.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full animate-fade-in opacity-0" style={{ animationDelay: '2s' }}>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => router.push('/register')}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => router.push('/login')}
            >
              Login to Account
            </Button>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="w-full py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SnipStash?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <CardHeader className="pb-2">
                <Code className="h-10 w-10 mb-2 text-primary" />
                <CardTitle className="text-2xl">Save Snippets</CardTitle>
                <CardDescription>
                  Quickly save and organize your most valuable code snippets in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Store snippets from any language with syntax highlighting and easy access whenever you need them.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <CardHeader className="pb-2">
                <FolderTree className="h-10 w-10 mb-2 text-primary" />
                <CardTitle className="text-2xl">Smart Categories</CardTitle>
                <CardDescription>
                  Automatic categorization of your code snippets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI-powered system can detect patterns in your code and organize them into logical categories.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <CardHeader className="pb-2">
                <Search className="h-10 w-10 mb-2 text-primary" />
                <CardTitle className="text-2xl">Easy Search</CardTitle>
                <CardDescription>
                  Find your snippets instantly with powerful search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fast, intuitive search lets you find the exact snippet you need when you need it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Call to action */}
      <div className="w-full py-16 px-4 bg-gradient-to-t from-primary/5 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of developers who trust SnipStash to manage their code snippets.
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => router.push('/register')}
          >
            Create Free Account
          </Button>
        </div>
      </div>
    </main>
  );
} 