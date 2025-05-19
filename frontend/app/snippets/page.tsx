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
import { CheckCircle2, Code, Copy, Edit, Folder, FolderClosed, PlusCircle, Search, SlidersHorizontal, Filter } from 'lucide-react';
import { Checkbox } from '../../src/components/ui/checkbox';
import { Label } from '../../src/components/ui/label';
import { Skeleton } from '../../src/components/ui/skeleton';

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
  
  // For UI controls
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load snippets and tags on initial load
  useEffect(() => {
    if (user && isAuthenticated) {
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
      }
      
      const finalUrl = url.toString();
      
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

  // Toggle filter visibility
  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with gradient background */}
        <div className="rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Snippets Library</h1>
              <p className="text-slate-300 mt-1">Manage and organize your code snippets</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => router.push('/snippets/create')}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="h-4 w-4" />
                Create Snippet
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="text-white border-white/20 hover:bg-white/10 hover:text-white"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border border-border">
          {/* Filter and Sort Controls */}
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Code className="h-5 w-5 mr-2 text-primary" />
                    All Snippets
                    <Badge className="ml-2">{snippets.length}</Badge>
                  </h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex space-x-1 rounded-md overflow-hidden border">
                    <Button 
                      size="sm" 
                      variant={sortBy === 'newest' ? 'default' : 'outline'} 
                      onClick={() => handleSortChange('newest')}
                      className={sortBy === 'newest' ? 'rounded-none' : 'rounded-none border-0'}
                    >
                      Newest
                    </Button>
                    <Button 
                      size="sm" 
                      variant={sortBy === 'most-used' ? 'default' : 'outline'} 
                      onClick={() => handleSortChange('most-used')}
                      className={sortBy === 'most-used' ? 'rounded-none' : 'rounded-none border-0 border-x'}
                    >
                      Most Used
                    </Button>
                    <Button 
                      size="sm" 
                      variant={sortBy === 'recently-used' ? 'default' : 'outline'} 
                      onClick={() => handleSortChange('recently-used')}
                      className={sortBy === 'recently-used' ? 'rounded-none' : 'rounded-none border-0'}
                    >
                      Recently Copied
                    </Button>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={toggleFilterVisibility}
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                </div>
              </div>
              
              {/* Filter Bar */}
              {isFilterVisible && (
                <div className="border-t pt-4 mt-2">
                  <FilterBar 
                    onFilterChange={handleFilterChange} 
                    availableTags={availableTags}
                    initialFilters={filters}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Loading State */}
          {isLoadingSnippets ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-4 w-full mt-3" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : snippets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No snippets found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {(filters.query || filters.language || filters.tags.length > 0) 
                  ? 'No snippets match your search criteria. Try adjusting your filters.'
                  : 'You don\'t have any snippets yet. Create your first snippet!'}
              </p>
              {!(filters.query || filters.language || filters.tags.length > 0) && (
                <Button
                  onClick={() => router.push('/snippets/create')}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Snippet
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {snippets.map((snippet) => (
                  <Card key={snippet.id} className="overflow-hidden group transition-all duration-300 hover:shadow-md border border-border hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{snippet.title}</CardTitle>
                        <Badge variant="outline" className="bg-primary/5">{formatLanguage(snippet.language)}</Badge>
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
                          <div className="flex items-center">
                            <FolderClosed className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mr-1">Folders:</span>
                          </div>
                          {snippet.Folders.map((folder) => (
                            <Badge key={folder.id} variant="outline" className="text-xs flex items-center gap-1">
                              {folder.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="bg-muted/50 rounded p-3 font-mono text-sm overflow-hidden line-clamp-5 whitespace-pre-wrap border border-border/50">
                        {snippet.code}
                      </div>
                      
                      {snippet.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{snippet.description}</p>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-3 flex flex-wrap gap-x-4">
                        <span className="flex items-center">
                          Created: {formatDate(snippet.createdAt)}
                        </span>
                        {snippet.copyCount > 0 && (
                          <span className="flex items-center">
                            <Copy className="h-3 w-3 mr-1" />
                            {snippet.copyCount} {snippet.copyCount === 1 ? 'copy' : 'copies'}
                          </span>
                        )}
                        {snippet.lastCopiedAt && (
                          <span>Last copied: {formatDate(snippet.lastCopiedAt)}</span>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t bg-muted/10 pt-3 flex flex-wrap justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => handleManageFolders(snippet)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 h-8"
                        >
                          <Folder className="h-3 w-3" />
                          <span className="hidden sm:inline">Folders</span>
                        </Button>
                        <Button 
                          onClick={() => router.push(`/snippets/${snippet.id}`)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 h-8"
                        >
                          <Code className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button 
                          onClick={() => router.push(`/snippets/edit/${snippet.id}`)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 h-8"
                        >
                          <Edit className="h-3 w-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                      <Button 
                        onClick={() => handleCopyCode(snippet)}
                        size="sm"
                        disabled={copyingSnippets[snippet.id]}
                        className="h-8"
                      >
                        {copyingSnippets[snippet.id] ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 animate-pulse" />
                            <span>Copied!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </div>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
              Assign to Folders
            </DialogTitle>
            <DialogDescription>
              Select folders to organize this snippet. You can assign a snippet to multiple folders.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {folders.length === 0 ? (
              <div className="py-6 text-center border border-dashed rounded-lg">
                <FolderClosed className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground">No folders available.</p>
                <p className="text-xs text-muted-foreground mt-1">Create folders in the dashboard to organize your snippets.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {folders.map(folder => (
                  <div key={folder.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                    <Checkbox 
                      id={`folder-${folder.id}`} 
                      checked={selectedFolderIds.includes(folder.id)} 
                      onCheckedChange={() => toggleFolderSelection(folder.id)}
                    />
                    <Label 
                      htmlFor={`folder-${folder.id}`}
                      className="flex items-center gap-2 cursor-pointer text-sm w-full"
                    >
                      <Folder className="h-4 w-4 text-primary/70" />
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
              className="gap-1"
            >
              {isSubmittingFolders ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-r-transparent animate-spin rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 