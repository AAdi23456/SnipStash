'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, FolderIcon, ClipboardCopy, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { toastSnippetCopied, toastSnippetDeleted, showSuccessToast, showErrorToast } from "../../lib/toast-utils";
import dynamic from 'next/dynamic';

// Dynamically import the code editor component with no SSR
const SyntaxHighlightedCodeEditor = dynamic(
  () => import('../../src/components/ui/code-editor').then((mod) => mod.SyntaxHighlightedCodeEditor),
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

export default function SnippetDetail({ 
  snippet: initialSnippet, 
  onDelete,
  onSnippetUpdate
}: { 
  snippet: Snippet;
  onDelete?: (id: number) => void;
  onSnippetUpdate?: (snippet: Snippet) => void;
}) {
  const [snippet, setSnippet] = useState<Snippet>(initialSnippet);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>(
    initialSnippet.Folders?.map(f => f.id) || []
  );
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isSavingFolders, setIsSavingFolders] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const { user } = useAuth();

  // Load folders when the dialog is opened
  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open]);

  // Set client ready state for the code editor
  useEffect(() => {
    setClientReady(true);
  }, []);

  const fetchFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const response = await fetch('https://snipstash-9tms.onrender.com/api/folders', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Format language name for display
  const formatLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Copy snippet code to clipboard
  const handleCopyCode = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(snippet.code);
      toastSnippetCopied();
      
      // Update the copy count on the server
      const response = await fetch(`https://snipstash-9tms.onrender.com/api/snippets/${snippet.id}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const updatedSnippet = await response.json();
        setSnippet(updatedSnippet);
        
        // Update the snippet in the parent component if provided
        if (onSnippetUpdate) {
          onSnippetUpdate(updatedSnippet);
        }
      }
    } catch (error) {
      console.error('Error copying snippet:', error);
      showErrorToast('Failed to copy snippet to clipboard');
    } finally {
      setIsCopying(false);
    }
  };

  // Delete the snippet
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this snippet? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`https://snipstash-9tms.onrender.com/api/snippets/${snippet.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        toastSnippetDeleted();
        setOpen(false);
        
        // Call the onDelete handler if provided
        if (onDelete) {
          onDelete(snippet.id);
        }
      } else {
        throw new Error('Failed to delete snippet');
      }
    } catch (error) {
      console.error('Error deleting snippet:', error);
      showErrorToast('Failed to delete snippet');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFolder = (folderId: number) => {
    setSelectedFolderIds(current => 
      current.includes(folderId)
        ? current.filter(id => id !== folderId)
        : [...current, folderId]
    );
  };

  const handleSaveFolders = async () => {
    setIsSavingFolders(true);
    try {
      const response = await fetch(`https://snipstash-9tms.onrender.com/api/snippets/${snippet.id}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          folderIds: selectedFolderIds
        })
      });
      
      if (response.ok) {
        const updatedSnippet = await response.json();
        setSnippet(updatedSnippet);
        
        if (onSnippetUpdate) {
          onSnippetUpdate(updatedSnippet);
        }
        
        showSuccessToast('Folders updated successfully');
      } else {
        const data = await response.json();
        showErrorToast(data.message || 'Failed to update folders');
      }
    } catch (error) {
      console.error('Error updating folders:', error);
      showErrorToast('Error updating folders');
    } finally {
      setIsSavingFolders(false);
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
          {snippet.Folders && snippet.Folders.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <FolderIcon size={12} />
              <span>{snippet.Folders.length === 1 ? '1 folder' : `${snippet.Folders.length} folders`}</span>
            </div>
          )}
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
              className="flex items-center gap-1"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              {isCopying ? 'Copying...' : 'Copy Code'}
            </Button>
          </div>
          {clientReady ? (
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
            <pre className="bg-card border border-border rounded-md p-4 overflow-x-auto font-mono text-sm whitespace-pre">
              {snippet.code}
            </pre>
          )}
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

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Folders</h4>
          <div className="flex flex-col space-y-2">
            <Popover open={foldersOpen} onOpenChange={setFoldersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={foldersOpen}
                  className="w-full justify-between"
                  disabled={isLoadingFolders}
                >
                  {isLoadingFolders 
                    ? "Loading folders..." 
                    : selectedFolderIds.length > 0
                      ? `${selectedFolderIds.length} folder${selectedFolderIds.length !== 1 ? 's' : ''} selected`
                      : "Select folders"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search folders..." />
                  <CommandEmpty>No folders found</CommandEmpty>
                  <CommandGroup>
                    {folders.map((folder) => (
                      <CommandItem
                        key={folder.id}
                        value={folder.name}
                        onSelect={() => toggleFolder(folder.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFolderIds.includes(folder.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <FolderIcon className="mr-2 h-4 w-4" />
                        {folder.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Button 
              size="sm"
              onClick={handleSaveFolders}
              disabled={isSavingFolders}
            >
              {isSavingFolders ? 'Saving...' : 'Save Folder Selection'}
            </Button>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1"
          >
            <Trash className="h-3.5 w-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete Snippet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 