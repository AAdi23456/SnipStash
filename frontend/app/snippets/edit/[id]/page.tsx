'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Textarea } from '../../../../src/components/ui/textarea';
import { SyntaxHighlightedCodeEditor } from '../../../../src/components/ui/code-editor';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../../src/components/ui/card';
import { Label } from '../../../../src/components/ui/label';
import { showSuccessToast, showErrorToast } from '../../../../lib/toast-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../src/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

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

export default function EditSnippetPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');
  
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
  
  const fetchSnippet = async () => {
    setIsContentLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/snippets/${snippetId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data: Snippet = await response.json();
        setSnippet(data);
        
        // Populate form fields
        setTitle(data.title);
        setCode(data.code);
        setLanguage(data.language);
        setDescription(data.description || '');
        setTags(data.Tags.map(tag => tag.name).join(', '));
      } else {
        showErrorToast('Failed to load snippet');
        router.push('/snippets');
      }
    } catch (error) {
      console.error('Error fetching snippet:', error);
      showErrorToast('Error loading snippet');
      router.push('/snippets');
    } finally {
      setIsContentLoading(false);
    }
  };
  
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
      const response = await fetch(`http://localhost:5000/api/snippets/${snippetId}`, {
        method: 'PUT',
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
      
      if (response.ok) {
        showSuccessToast('Snippet updated successfully');
        router.push('/snippets');
      } else {
        const data = await response.json();
        showErrorToast(data.message || 'Failed to update snippet');
      }
    } catch (error) {
      console.error('Error updating snippet:', error);
      showErrorToast('Error updating snippet');
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
          <h1 className="text-2xl font-bold">Edit Snippet</h1>
        </div>
        
        {isContentLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading snippet...</p>
          </div>
        ) : (
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Update Snippet</CardTitle>
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
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
} 