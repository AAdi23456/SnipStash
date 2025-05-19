'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showInfoToast, toastSnippetCopied, showSuccessToast, showErrorToast } from '../../lib/toast-utils';
import FilterBar, { FilterOptions } from '../dashboard/filter-bar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../src/components/ui/dialog';
import { CheckCircle2, Code, Folder, PlusCircle } from 'lucide-react';
import { Checkbox } from '../../src/components/ui/checkbox';
import { Label } from '../../src/components/ui/label';

// Define types matching our backend
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

export default function SnippetsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'newest');
  const [filters, setFilters] = useState<FilterOptions>({
    query: searchParams.get('query') || '',
    language: searchParams.get('language') || '',
    tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  // Track which snippets are currently being copied
  const [copyingSnippets, setCopyingSnippets] = useState<{ [key: number]: boolean }>({});
  
  // For folder management
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [isSubmittingFolders, setIsSubmittingFolders] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load snippets and tags on initial load
  useEffect(() => {
    if (user && isAuthenticated) {
      showInfoToast('Snippets loaded');
      fetchSnippets();
      fetchAvailableTags();
      fetchFolders();
    }
  }, [user, isAuthenticated]);

  // Refetch snippets when sort option or filters change
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchSnippets();
      updateUrlParams();
    }
  }, [sortBy, filters, user, isAuthenticated]);

  // Fetch all available folders
  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/folders', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // Update URL parameters based on current filters
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    if (sortBy !== 'newest') {
      params.set('sortBy', sortBy);
    }
    
    if (filters.query) {
      params.set('query', filters.query);
    }
    
    if (filters.language) {
      params.set('language', filters.language);
    }
    
    if (filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    
    const paramsString = params.toString();
    const url = paramsString ? `?${paramsString}` : '';
    
    // Replace the current URL with the new parameters
    window.history.replaceState(null, '', `${window.location.pathname}${url}`);
  };

  // Fetch all available tags for the filter dropdown
  const fetchAvailableTags = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/tags', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags.map((tag: { name: string }) => tag.name));
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchSnippets = async () => {
    if (!user) return;
    
    setIsLoadingSnippets(true);
    try {
      // Build URL with query parameters
      let url = new URL('http://localhost:5000/api/snippets');
      
      // Add sorting parameter
      if (sortBy === 'most-used') {
        url.searchParams.append('sortBy', 'most-used');
      } else if (sortBy === 'recently-used') {
        url.searchParams.append('sortBy', 'recently-used');
      }
      
      // Add filter parameters
      if (filters.language) {
        url.searchParams.append('language', filters.language);
      }
      
      if (filters.query) {
        url.searchParams.append('query', filters.query);
      }
      
      if (filters.tags.length > 0) {
        url.searchParams.append('tags', filters.tags.join(','));
        console.log('Sending tags to API:', filters.tags.join(','));
      }
      
      const finalUrl = url.toString();
      console.log('Final API URL:', finalUrl);
      
      const response = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSnippets(data);
      } else {
        console.error('API error response:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching snippets:', error);
    } finally {
      setIsLoadingSnippets(false);
    }
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Copy snippet code to clipboard
  const handleCopyCode = async (snippet: Snippet) => {
    // Prevent multiple rapid clicks
    if (copyingSnippets[snippet.id]) return;
    
    // Set the current snippet as being copied
    setCopyingSnippets(prev => ({ ...prev, [snippet.id]: true }));
    
    try {
      // Copy to clipboard
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
          
          // Update the snippet in the local state without refetching all snippets
          setSnippets(prevSnippets => 
            prevSnippets.map(s => 
              s.id === snippet.id 
                ? { 
                    ...s, 
                    copyCount: data.copyCount, 
                    lastCopiedAt: data.lastCopiedAt 
                  } 
                : s
            )
          );
        }
      } catch (err) {
        console.error('Could not log copy operation', err);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    } finally {
      // Reset the copying state after a short delay
      setTimeout(() => {
        setCopyingSnippets(prev => ({ ...prev, [snippet.id]: false }));
      }, 500);
    }
  };
  
  // Open folder management dialog for a snippet
  const handleManageFolders = (snippet: Snippet) => {
    setSelectedSnippet(snippet);
    setSelectedFolderIds(snippet.Folders?.map(f => f.id) || []);
    setShowFolderDialog(true);
  };
  
  // Toggle folder selection
  const toggleFolderSelection = (folderId: number) => {
    setSelectedFolderIds(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
  };
  
  // Save folder assignments for a snippet
  const saveFolderAssignments = async () => {
    if (!selectedSnippet || !user) return;
    
    setIsSubmittingFolders(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/snippets/${selectedSnippet.id}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ folderIds: selectedFolderIds })
      });
      
      if (response.ok) {
        const updatedSnippet = await response.json();
        // Update the snippet in the local state
        setSnippets(prev => 
          prev.map(s => 
            s.id === selectedSnippet.id ? updatedSnippet : s
          )
        );
        showSuccessToast('Folders assigned successfully');
        setShowFolderDialog(false);
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to assign folders');
      }
    } catch (error) {
      console.error('Error assigning folders:', error);
      showErrorToast('Error assigning folders');
    } finally {
      setIsSubmittingFolders(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Snippets Library</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-semibold">All Snippets</h2>
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  variant={sortBy === 'newest' ? 'default' : 'outline'} 
                  onClick={() => handleSortChange('newest')}
                >
                  Newest
                </Button>
                <Button 
                  size="sm" 
                  variant={sortBy === 'most-used' ? 'default' : 'outline'} 
                  onClick={() => handleSortChange('most-used')}
                >
                  Most Used
                </Button>
                <Button 
                  size="sm" 
                  variant={sortBy === 'recently-used' ? 'default' : 'outline'} 
                  onClick={() => handleSortChange('recently-used')}
                >
                  Recently Copied
                </Button>
              </div>
            </div>
            
            {/* Filter Bar */}
            <FilterBar 
              onFilterChange={handleFilterChange} 
              availableTags={availableTags}
              initialFilters={filters}
            />
          </div>
          
          {isLoadingSnippets ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading snippets...</p>
            </div>
          ) : snippets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {(filters.query || filters.language || filters.tags.length > 0) 
                  ? 'No snippets match your search criteria. Try adjusting your filters.'
                  : 'You don\'t have any snippets yet. Go to the Dashboard to create your first snippet!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mt-6">
              {snippets.map((snippet) => (
                <Card key={snippet.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{snippet.title}</CardTitle>
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
                  <CardContent>
                    <div className="bg-muted/50 rounded p-2 font-mono text-sm overflow-hidden line-clamp-5 whitespace-pre-wrap">
                      {snippet.code}
                    </div>
                    {snippet.description && (
                      <p className="text-sm text-muted-foreground mt-2">{snippet.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4">
                      <span>Created: {formatDate(snippet.createdAt)}</span>
                      {snippet.lastCopiedAt && <span>Last copied: {formatDate(snippet.lastCopiedAt)}</span>}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 pt-2 flex justify-between">
                    <Button 
                      onClick={() => handleManageFolders(snippet)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Folder className="h-4 w-4" />
                      Manage Folders
                    </Button>
                    <Button 
                      onClick={() => handleCopyCode(snippet)}
                      size="sm"
                      disabled={copyingSnippets[snippet.id]}
                    >
                      {copyingSnippets[snippet.id] ? 'Copying...' : 'Copy Code'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Folder Assignment Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Assign to Additional Folders
            </DialogTitle>
            <DialogDescription>
              Select folders to add this snippet to. Snippets remain in previously assigned folders.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {folders.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No folders available. Create folders in the dashboard first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {folders.map(folder => (
                  <div key={folder.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`folder-${folder.id}`} 
                      checked={selectedFolderIds.includes(folder.id)} 
                      onCheckedChange={() => toggleFolderSelection(folder.id)}
                    />
                    <Label 
                      htmlFor={`folder-${folder.id}`}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <Folder className="h-4 w-4" />
                      {folder.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowFolderDialog(false)}
              disabled={isSubmittingFolders}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveFolderAssignments} 
              disabled={isSubmittingFolders || folders.length === 0}
            >
              {isSubmittingFolders ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 