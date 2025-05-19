'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toastSnippetCopied, showSuccessToast, showErrorToast } from '../../lib/toast-utils';
import FilterBar, { FilterOptions } from '../dashboard/filter-bar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../src/components/ui/dialog';
import {
  CheckCircle2,
  Code,
  Copy,
  Edit,
  Folder,
  FolderClosed,
  PlusCircle,
  Search,
  Filter,
  Clipboard,
  ArrowUpRight,
  Tags,
  Clock,
  ChevronDown,
  Settings,
  LayoutGrid,
  List,
  SortAsc,
  BookOpen,
  X,
  Terminal,
  Settings2
} from 'lucide-react';
import { Checkbox } from '../../src/components/ui/checkbox';
import { Label } from '../../src/components/ui/label';
import { Skeleton } from '../../src/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

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

// Wrapper for the actual page content using SearchParams
function SnippetsPageContent() {
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
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  
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
      const url = new URL('http://localhost:5000/api/snippets');
      
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
        console.error('Failed to fetch snippets');
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
  
  // Handle copying snippet code to clipboard
  const handleCopyCode = async (snippet: Snippet) => {
    // Set the copy status for this snippet to true
    setCopyingSnippets(prev => ({ ...prev, [snippet.id]: true }));
    
    try {
      await navigator.clipboard.writeText(snippet.code);
      toastSnippetCopied();
      
      // Update copy count on the server
      try {
        await fetch(`http://localhost:5000/api/snippets/${snippet.id}/copy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });
        
        // Refresh snippet data to get updated copy count
        fetchSnippets();
      } catch (error) {
        console.error('Error updating copy count:', error);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showErrorToast('Failed to copy snippet to clipboard');
    } finally {
      // Reset the copy status after a short delay
      setTimeout(() => {
        setCopyingSnippets(prev => ({ ...prev, [snippet.id]: false }));
      }, 500);
    }
  };
  
  // Open the folder management dialog
  const handleManageFolders = (snippet: Snippet) => {
    setSelectedSnippet(snippet);
    setSelectedFolderIds(snippet.Folders?.map(f => f.id) || []);
    setShowFolderDialog(true);
  };
  
  // Toggle folder selection in the dialog
  const toggleFolderSelection = (folderId: number) => {
    setSelectedFolderIds(current => 
      current.includes(folderId)
        ? current.filter(id => id !== folderId)
        : [...current, folderId]
    );
  };
  
  // Save the folder assignments for the selected snippet
  const saveFolderAssignments = async () => {
    if (!selectedSnippet) return;
    
    setIsSubmittingFolders(true);
    try {
      const response = await fetch(`http://localhost:5000/api/snippets/${selectedSnippet.id}/folders`, {
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
        showSuccessToast('Folders updated successfully');
        fetchSnippets(); // Reload snippets with updated folder info
        setShowFolderDialog(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update folders');
      }
    } catch (error) {
      console.error('Error updating folders:', error);
      showErrorToast('Failed to update folders');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Toggle filter bar visibility
  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  // Get language icon based on language name
  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return <Terminal className="h-4 w-4" />;
      case 'html':
      case 'css':
        return <Code className="h-4 w-4" />;
      case 'python':
      case 'java':
      case 'ruby':
      case 'go':
      case 'rust':
      case 'csharp':
      case 'php':
        return <Terminal className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Handle language filter from the top tabs
  const handleLanguageFilter = (language: string) => {
    setSelectedLanguage(language);
    handleFilterChange({
      ...filters,
      language: language === selectedLanguage ? '' : language
    });
  };

  // Get most used languages from snippets
  const getTopLanguages = () => {
    const languageCount: Record<string, number> = {};
    snippets.forEach(snippet => {
      if (!languageCount[snippet.language]) {
        languageCount[snippet.language] = 0;
      }
      languageCount[snippet.language]++;
    });
    
    return Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([language]) => language);
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section with New Stylish Header */}
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl mb-6 p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                Your Code Snippets
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your collection of {snippets.length} reusable code snippets
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilterVisibility}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                {isFilterVisible ? 'Hide Filters' : 'Refine Search'}
              </Button>
              <Button 
                onClick={() => router.push('/snippets/create')}
                className="flex items-center gap-1"
                size="sm"
              >
                <PlusCircle className="h-4 w-4" />
                New Snippet
              </Button>
            </div>
          </div>
          
          {/* Quick Search */}
          <div className="mt-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search snippets by name, language, or content..."
                className="w-full bg-background/80 backdrop-blur-sm border-input pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.query}
                onChange={(e) => handleFilterChange({...filters, query: e.target.value})}
              />
              {filters.query && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleFilterChange({...filters, query: ''})}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Bar with Tools */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          {/* View Toggle and Popular Languages */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={toggleViewMode}
            >
              {viewMode === 'grid' 
                ? <List className="h-4 w-4" /> 
                : <LayoutGrid className="h-4 w-4" />
              }
            </Button>
            <div className="text-sm text-muted-foreground hidden md:block">
              View as {viewMode === 'grid' ? 'Grid' : 'List'}
            </div>
            
            <div className="h-6 w-px bg-border mx-2"></div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <SortAsc className="h-4 w-4" />
                  <span className="hidden md:inline">Sort by:</span>
                  <span className="font-medium">
                    {sortBy === 'newest' 
                      ? 'Newest' 
                      : sortBy === 'most-used' 
                        ? 'Most Used' 
                        : 'Recently Used'
                    }
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleSortChange('newest')}
                  className={cn(sortBy === 'newest' && "bg-accent")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSortChange('most-used')}
                  className={cn(sortBy === 'most-used' && "bg-accent")}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  Most Used
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSortChange('recently-used')}
                  className={cn(sortBy === 'recently-used' && "bg-accent")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Recently Used
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Tags and Filters */}
          <div className="flex items-center gap-2">
            {filters.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tags className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {filters.tags.length} tag{filters.tags.length !== 1 ? 's' : ''} selected
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => handleFilterChange({...filters, tags: []})}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.language && (
              <div className="flex items-center gap-1">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatLanguage(filters.language)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => handleFilterChange({...filters, language: ''})}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {(filters.tags.length > 0 || filters.language || filters.query) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleFilterChange({query: '', language: '', tags: []})}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        {/* Language Quick Filters */}
        <div className="mb-6">
          <div className="flex items-center overflow-x-auto pb-2 gap-1">
            <Button 
              variant={!selectedLanguage ? "default" : "outline"} 
              size="sm" 
              className="rounded-full"
              onClick={() => handleLanguageFilter('')}
            >
              All Languages
            </Button>
            
            {getTopLanguages().map(language => (
              <Button 
                key={language}
                variant={selectedLanguage === language ? "default" : "outline"}
                size="sm"
                className="rounded-full flex items-center gap-1"
                onClick={() => handleLanguageFilter(language)}
              >
                {getLanguageIcon(language)}
                {formatLanguage(language)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Advanced Filter Section */}
        {isFilterVisible && (
          <div className="mb-6 bg-muted/30 p-4 rounded-lg border border-border/50">
            <FilterBar 
              initialFilters={filters}
              availableTags={availableTags}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
        
        {/* Snippets Display */}
        <div className="space-y-6">
          {isLoadingSnippets ? (
            // Loading skeletons
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className={`overflow-hidden ${viewMode === 'list' ? 'border-l-4 border-l-primary/20' : ''}`}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-full mb-2" />
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : snippets.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {snippets.map(snippet => (
                <Card 
                  key={snippet.id} 
                  className={`group overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-md 
                    ${viewMode === 'list' 
                      ? 'border-l-4 border-l-primary/50 hover:border-l-primary' 
                      : 'hover:border-primary/50'}
                  `}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl truncate group-hover:text-primary transition-colors">
                        {snippet.title}
                      </CardTitle>
                      <Badge variant="outline" className="bg-primary/5 flex items-center gap-1">
                        {getLanguageIcon(snippet.language)}
                        {formatLanguage(snippet.language)}
                      </Badge>
                    </div>
                    
                    {/* Meta info row */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(snippet.createdAt)}
                      </div>
                      
                      {snippet.copyCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Clipboard className="h-3 w-3" />
                          {snippet.copyCount} {snippet.copyCount === 1 ? 'copy' : 'copies'}
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {snippet.Tags?.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Folders */}
                    {snippet.Folders && snippet.Folders.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {snippet.Folders.map((folder) => (
                          <Badge key={folder.id} variant="outline" className="text-xs flex items-center gap-1">
                            <FolderClosed className="h-3 w-3" />
                            {folder.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="bg-muted/50 rounded-md p-2 font-mono text-xs overflow-hidden whitespace-pre-wrap line-clamp-4 border border-border/50">
                      {snippet.code}
                    </div>
                    
                    {snippet.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{snippet.description}</p>
                    )}
                  </CardContent>
                  
                  <CardFooter className="mt-auto pt-4 flex gap-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleManageFolders(snippet)}
                      title="Manage folders"
                    >
                      <Folder className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/snippets/${snippet.id}`)}
                      title="View details"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/snippets/edit/${snippet.id}`)}
                      title="Edit snippet"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleCopyCode(snippet)}
                      disabled={copyingSnippets[snippet.id]}
                      title="Copy code"
                      className="px-3"
                    >
                      {copyingSnippets[snippet.id] ? (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Copy
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">
                {filters.query || filters.language || filters.tags.length > 0 
                  ? 'No snippets match your current filters'
                  : 'Your snippet collection is empty'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {filters.query || filters.language || filters.tags.length > 0 
                  ? 'Try changing your search criteria or clearing filters'
                  : 'Save code snippets for easy reuse across your projects'}
              </p>
              <Button 
                onClick={() => router.push('/snippets/create')}
                className="mt-2"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Snippet
              </Button>
            </div>
          )}
        </div>
        
        {/* Folder Management Dialog */}
        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Folders</DialogTitle>
              <DialogDescription>
                Add this snippet to folders for better organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {folders.length > 0 ? (
                folders.map(folder => (
                  <div key={folder.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`folder-${folder.id}`} 
                      checked={selectedFolderIds.includes(folder.id)}
                      onCheckedChange={() => toggleFolderSelection(folder.id)}
                    />
                    <Label htmlFor={`folder-${folder.id}`} className="flex items-center">
                      <FolderClosed className="mr-2 h-4 w-4" />
                      {folder.name}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FolderClosed className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No folders found</p>
                  <p className="text-xs text-muted-foreground mt-1">Create folders in the dashboard to organize your snippets.</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={saveFolderAssignments}
                disabled={isSubmittingFolders}
              >
                {isSubmittingFolders ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Export the main page component with Suspense boundary
export default function SnippetsPage() {
  return (
    <Suspense fallback={<div>Loading snippets...</div>}>
      <SnippetsPageContent />
    </Suspense>
  );
} 