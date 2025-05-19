'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { toastSnippetCopied, toastSnippetDeleted } from "../../lib/toast-utils";

interface Tag {
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
  copyCount: number;
  lastCopiedAt: string | null;
}

export default function SnippetDetail({ 
  snippet: initialSnippet, 
  onDelete 
}: { 
  snippet: Snippet;
  onDelete?: (id: number) => void;
}) {
  const [snippet, setSnippet] = useState<Snippet>(initialSnippet);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const { user } = useAuth();

  // Format language name for display
  const formatLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Copy snippet code to clipboard
  const handleCopyCode = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(snippet.code);
      toastSnippetCopied();
      
      // Call the dedicated copy endpoint
      try {
        const response = await fetch(`http://localhost:5000/api/snippets/${snippet.id}/copy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update local state with new copy count
          setSnippet(prev => ({
            ...prev,
            copyCount: data.copyCount,
            lastCopiedAt: data.lastCopiedAt
          }));
        }
      } catch (err) {
        console.error('Could not log copy operation', err);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    } finally {
      setIsCopying(false);
    }
  };

  // Delete the snippet
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this snippet?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/snippets/${snippet.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        toastSnippetDeleted();
        setOpen(false);
        if (onDelete) {
          onDelete(snippet.id);
        }
      } else {
        throw new Error('Failed to delete snippet');
      }
    } catch (error) {
      console.error('Error deleting snippet:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer border border-border rounded-md p-4 hover:bg-accent/50 transition-colors">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold truncate">{snippet.title}</h3>
            {snippet.copyCount > 0 && (
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10">
                {snippet.copyCount} {snippet.copyCount === 1 ? 'copy' : 'copies'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{formatLanguage(snippet.language)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {snippet.Tags?.map((tag) => (
              <span key={tag.id} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{snippet.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
              {formatLanguage(snippet.language)}
            </span>
            <span className="text-xs text-muted-foreground">
              Created: {formatDate(snippet.createdAt)}
            </span>
            {snippet.copyCount > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                Copied: {snippet.copyCount} {snippet.copyCount === 1 ? 'time' : 'times'}
                {snippet.lastCopiedAt && ` (Last: ${formatDate(snippet.lastCopiedAt)})`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {snippet.description && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{snippet.description}</p>
          </div>
        )}
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Code</h4>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopyCode}
              disabled={isCopying}
            >
              {isCopying ? 'Copying...' : 'Copy Code'}
            </Button>
          </div>
          <pre className="bg-card border border-border rounded-md p-4 overflow-x-auto font-mono text-sm whitespace-pre">
            {snippet.code}
          </pre>
        </div>
        
        {snippet.Tags?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {snippet.Tags.map((tag) => (
                <span key={tag.id} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Snippet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 