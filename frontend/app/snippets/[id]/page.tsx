'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../src/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../src/components/ui/card';
import { Badge } from '../../../src/components/ui/badge';
import { toastSnippetCopied, showErrorToast } from '../../../lib/toast-utils';
import { ArrowLeft, Edit, Copy, Folder, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the code editor component with no SSR
const SyntaxHighlightedCodeEditor = dynamic(
  () => import('../../../src/components/ui/code-editor').then((mod) => mod.SyntaxHighlightedCodeEditor),
  { ssr: false }
);

interface Tag {
  id: number;
  name: string;
}

interface Folder {
  id: number;
  name: string;
}

interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  description: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  Tags: Tag[];
  Folders?: Folder[];
  copyCount: number;
  lastCopiedAt: string | null;
}

interface PageParams {
  id: string;
}

export default function SnippetDetailPage({ params }: { params: PageParams }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  
  // Snippet ID from the URL
  const snippetId = params.id;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Fetch snippet data on load
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchSnippet();
    }
  }, [user, isAuthenticated, snippetId]);

  // Set client ready state for the code editor
  useEffect(() => {
    setClientReady(true);
  }, []);
  
  const fetchSnippet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/snippets/${snippetId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data: Snippet = await response.json();
        setSnippet(data);
      } else {
        showErrorToast('Failed to load snippet');
        router.push('/snippets');
      }
    } catch (error) {
      console.error('Error fetching snippet:', error);
      showErrorToast('Error loading snippet');
      router.push('/snippets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!snippet) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(snippet.code);
      toastSnippetCopied();
      
      // Update copy count on the server
      await fetch(`http://localhost:5000/api/snippets/${snippetId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      // Refresh snippet data to get updated copy count
      fetchSnippet();
    } catch (error) {
      console.error('Error copying snippet:', error);
      showErrorToast('Failed to copy snippet');
    } finally {
      setIsCopying(false);
    }
  };

  const formatLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="p-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Snippet Details</h1>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading snippet...</p>
          </div>
        ) : snippet ? (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl">{snippet.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formatLanguage(snippet.language)}</Badge>
                  {snippet.copyCount > 0 && (
                    <Badge variant="secondary">
                      {snippet.copyCount} {snippet.copyCount === 1 ? 'copy' : 'copies'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {snippet.Tags?.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
              {snippet.Folders && snippet.Folders.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Folders:</span>
                  {snippet.Folders.map((folder) => (
                    <Badge key={folder.id} variant="outline" className="text-xs flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {folder.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {clientReady && snippet ? (
                <div className="rounded-md overflow-hidden">
                  <SyntaxHighlightedCodeEditor
                    value={snippet.code}
                    language={snippet.language}
                    onChange={() => {}} // Read-only mode
                    className="w-full"
                    minHeight="auto"
                  />
                </div>
              ) : (
                <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-auto whitespace-pre-wrap">
                  {snippet?.code}
                </div>
              )}
              
              {snippet.description && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">{snippet.description}</p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created: {formatDate(snippet.createdAt)}
                </div>
                {snippet.lastCopiedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last copied: {formatDate(snippet.lastCopiedAt)}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-muted/20 pt-4 flex flex-wrap gap-3 justify-end">
              <Button 
                onClick={() => router.push('/snippets')}
                variant="outline"
              >
                Back to Snippets
              </Button>
              <Button 
                onClick={() => router.push(`/snippets/edit/${snippet.id}`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Snippet
              </Button>
              <Button 
                onClick={handleCopyCode}
                disabled={isCopying}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {isCopying ? 'Copying...' : 'Copy Code'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Snippet not found</p>
            <Button 
              onClick={() => router.push('/snippets')}
              variant="outline"
              className="mt-4"
            >
              Back to Snippets
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 