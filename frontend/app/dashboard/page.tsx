'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../src/components/ui/button';
import { showInfoToast, toastSnippetCopied } from '../../lib/toast-utils';
import CreateSnippet from './create-snippet';
import SnippetDetail from './snippet-detail';
import FilterBar, { FilterOptions } from './filter-bar';

// Define types matching our backend
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

export default function DashboardPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');
  const [filters, setFilters] = useState<FilterOptions>({
    query: searchParams.get('query') || '',
    language: searchParams.get('language') || '',
    tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Display welcome toast when dashboard loads
  useEffect(() => {
    if (user && isAuthenticated) {
      showInfoToast(`Welcome back, ${user.name}!`);
      console.log('Auth token:', user.token ? `${user.token.substring(0, 15)}...` : 'No token');
      fetchSnippets();
      fetchAvailableTags();
    }
  }, [user, isAuthenticated]);

  // Refetch snippets when sort option or filters change
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchSnippets();
      updateUrlParams();
    }
  }, [sortBy, filters, user, isAuthenticated]);

  // Update URL parameters based on current filters
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    if (sortBy !== 'newest') {
      params.set('sort', sortBy);
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
      
      console.log('Building API request with filters:', filters);
      
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
      console.log('Final API URL:', finalUrl);
      
      const response = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data count:', data.length);
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

  const handleDeleteSnippet = (id: number) => {
    setSnippets(snippets.filter(snippet => snippet.id !== id));
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Demo function to simulate copying a snippet
  const handleCopyDemo = () => {
    // In a real app, this would copy text to clipboard
    toastSnippetCopied();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <Button 
            variant="outline" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-semibold">My Snippets</h2>
              <div className="flex space-x-2 items-center">
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
                <CreateSnippet onSnippetCreated={() => {
                  fetchSnippets();
                  fetchAvailableTags();
                }} />
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
                  : 'You don\'t have any snippets yet. Create your first snippet to get started!'}
              </p>
              <div className="mt-4 flex justify-center space-x-3">
                <Button variant="outline" onClick={handleCopyDemo}>
                  Demo Copy Toast
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {snippets.map((snippet) => (
                <SnippetDetail 
                  key={snippet.id} 
                  snippet={snippet} 
                  onDelete={handleDeleteSnippet}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 