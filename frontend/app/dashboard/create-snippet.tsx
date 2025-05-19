'use client';

import { useState, useEffect } from 'react';
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Textarea } from "../../src/components/ui/textarea";
import { Label } from "../../src/components/ui/label";
import { SyntaxHighlightedCodeEditor } from "../../src/components/ui/code-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select";
import { Check, ChevronsUpDown, FolderIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { showSuccessToast, showErrorToast, toastSnippetCreated } from "../../lib/toast-utils";

// Available programming languages for the dropdown
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'scala', label: 'Scala' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash/Shell' },
];

interface Folder {
  id: number;
  name: string;
}

export default function CreateSnippet({ onSnippetCreated }: { onSnippetCreated?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const { user } = useAuth();

  const resetForm = () => {
    setTitle('');
    setCode('');
    setLanguage('');
    setDescription('');
    setTags('');
    setSelectedFolderIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !code || !language) {
      showErrorToast('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert comma-separated tags to array
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // First create the snippet
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
          tags: tagsArray
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create snippet');
      }
      
      const createdSnippet = await response.json();
      
      // If folders are selected, assign the snippet to those folders
      if (selectedFolderIds.length > 0) {
        const folderResponse = await fetch(`http://localhost:5000/api/snippets/${createdSnippet.id}/folders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({
            folderIds: selectedFolderIds
          })
        });
        
        if (!folderResponse.ok) {
          console.error('Error assigning snippet to folders');
        }
      }
      
      // Success!
      toastSnippetCreated();
      resetForm();
      
      // Trigger refresh of parent component if provided
      if (onSnippetCreated) {
        onSnippetCreated();
      }
    } catch (error) {
      console.error('Error creating snippet:', error);
      showErrorToast('Failed to create snippet', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Enter a title for your snippet"
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
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <SyntaxHighlightedCodeEditor
            id="code"
            value={code}
            language={language || 'plaintext'}
            onChange={setCode}
            placeholder="Paste your code here"
            minHeight="150px"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Add some context about this snippet"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input 
            id="tags" 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            placeholder="e.g. react, hooks, fetch"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Additional tags will be automatically generated based on your code content
          </p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Snippet'}
          </Button>
        </div>
      </form>
    </div>
  );
} 