'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { SyntaxHighlightedCodeEditor } from '../../../src/components/ui/code-editor';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../src/components/ui/card';
import { Label } from '../../../src/components/ui/label';
import { showSuccessToast, showErrorToast } from '../../../lib/toast-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../src/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateSnippetPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Validate form
    if (!title || !code || !language) {
      showErrorToast('Title, code, and language are required');
      setIsSaving(false);
      return;
    }
    
    // Split the tags string into an array and trim whitespace
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    try {
      console.log('Submitting snippet with token:', user?.token);
      console.log('Request payload:', {
        title,
        code,
        language,
        description,
        tags: tagArray
      });

      const response = await fetch('http://localhost:5000/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          title,
          code,
          language,
          description,
          tags: tagArray
        })
      });
      
      // Log response status
      console.log('Response status:', response.status);
      
      // Only try to get text if there's a response
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Response text:', responseText);
      } catch (err) {
        console.error('Error reading response:', err);
      }
      
      if (response.ok) {
        try {
          // Only try to parse if we have response text
          const data = responseText ? JSON.parse(responseText) : {};
          showSuccessToast('Snippet created successfully');
          router.push('/snippets');
        } catch (e) {
          console.error('Error parsing successful response:', e);
          showSuccessToast('Snippet created successfully, but response data could not be parsed');
          router.push('/snippets');
        }
      } else {
        let errorMessage = 'Failed to create snippet';
        try {
          if (responseText) {
            // Try to parse the response as JSON
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // Response wasn't valid JSON
          console.error('Error parsing error response:', e);
          errorMessage = responseText || errorMessage;
        }
        showErrorToast(errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating snippet:', error);
      showErrorToast('Error creating snippet: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
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
          <h1 className="text-2xl font-bold">Create New Snippet</h1>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Create Snippet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter snippet title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="shell">Shell/Bash</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <SyntaxHighlightedCodeEditor 
                  id="code" 
                  value={code} 
                  language={language || 'plaintext'}
                  onChange={setCode}
                  placeholder="Enter your code snippet here"
                  minHeight="200px"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Add a description for this snippet"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Comma Separated)</Label>
                <Input 
                  id="tags" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="e.g. react, hooks, state-management"
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas. Additional tags may be auto-generated based on code content.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Create Snippet'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 