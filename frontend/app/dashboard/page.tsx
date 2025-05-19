'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../src/components/ui/button';
import { showInfoToast, showErrorToast } from '../../lib/toast-utils';
import FolderList from './folder-list';
import { 
  LayoutDashboard, 
  LogOut, 
  User, 
  ArrowRight,
  Folder,
  FolderPlus,
  Settings,
  Code,
  Copy,
  Clipboard,
  Clock,
  Edit,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../src/components/ui/card';

interface Folder {
  id: number;
  name: string;
  createdAt: string;
  Snippets?: any[];
}

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
  copyCount: number;
  lastCopiedAt: string | null;
  Tags?: { id: number; name: string }[];
  Folders?: Folder[];
}

interface Activity {
  type: string;
  description: string;
  date: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [folderSnippets, setFolderSnippets] = useState<Snippet[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [folderStats, setFolderStats] = useState({
    total: 0,
    recent: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Display welcome toast when dashboard loads
  useEffect(() => {
    if (user && isAuthenticated) {
      showInfoToast(`Welcome back, ${user.name}!`);
    }
  }, [user, isAuthenticated]);

  // Fetch snippets when folder is selected
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchFolderSnippets();
    }
  }, [selectedFolderId, user, isAuthenticated]);

  // Fetch folder stats and recent activities
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchFolderStats();
      fetchRecentActivities();
    }
  }, [user, isAuthenticated]);

  const fetchFolderStats = async () => {
    if (!user) return;
    
    try {
      // Get all folders
      const response = await fetch('https://snipstash-9tms.onrender.com/api/folders', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const folders = await response.json() as Folder[];
        
        // Calculate total folders
        const totalFolders = folders.length;
        
        // Calculate recently added folders (created in the last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentFolders = folders.filter((folder: Folder) => {
          const createdAt = new Date(folder.createdAt);
          return createdAt > oneWeekAgo;
        }).length;
        
        setFolderStats({
          total: totalFolders,
          recent: recentFolders
        });
      }
    } catch (error) {
      console.error('Error fetching folder stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    if (!user) return;
    
    setIsLoadingActivities(true);
    try {
      // Fetch latest snippets to determine recent activity
      const snippetsResponse = await fetch('https://snipstash-9tms.onrender.com/api/snippets', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      // Fetch folders to track folder activities
      const foldersResponse = await fetch('https://snipstash-9tms.onrender.com/api/folders', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (snippetsResponse.ok && foldersResponse.ok) {
        const snippets = await snippetsResponse.json() as Snippet[];
        const folders = await foldersResponse.json() as Folder[];
        
        const activities: Activity[] = [];
        
        // Recent snippet creations
        const recentSnippets = snippets
          .sort((a: Snippet, b: Snippet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
          
        recentSnippets.forEach((snippet: Snippet) => {
          activities.push({
            type: 'snippet_created',
            description: `Snippet "${snippet.title}" created`,
            date: snippet.createdAt
          });
        });
        
        // Recent snippet usages (copies)
        const recentlyUsedSnippets = snippets
          .filter(snippet => snippet.lastCopiedAt)
          .sort((a: Snippet, b: Snippet) => 
            new Date(b.lastCopiedAt || '').getTime() - new Date(a.lastCopiedAt || '').getTime()
          )
          .slice(0, 3);
          
        recentlyUsedSnippets.forEach((snippet: Snippet) => {
          activities.push({
            type: 'snippet_copied',
            description: `Snippet "${snippet.title}" copied`,
            date: snippet.lastCopiedAt as string
          });
        });
        
        // Recent folder creations
        const recentFolders = folders
          .sort((a: Folder, b: Folder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
          
        recentFolders.forEach((folder: Folder) => {
          activities.push({
            type: 'folder_created',
            description: `Folder "${folder.name}" created`,
            date: folder.createdAt
          });
        });
        
        // Sort all activities by date (newest first) and take top 5
        const sortedActivities = activities
          .sort((a: Activity, b: Activity) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        setRecentActivities(sortedActivities);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const fetchFolderSnippets = async () => {
    if (!user) return;
    
    setIsLoadingSnippets(true);
    try {
      // Build URL with query parameters
      let url = new URL('https://snipstash-9tms.onrender.com/api/snippets');
      
      // Add folder filter if a folder is selected
      if (selectedFolderId !== null) {
        url.searchParams.append('folderId', selectedFolderId.toString());
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFolderSnippets(data);
      } else {
        showErrorToast('Failed to load snippets');
      }
    } catch (error) {
      console.error('Error fetching snippets:', error);
      showErrorToast('Error loading snippets');
    } finally {
      setIsLoadingSnippets(false);
    }
  };

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
  };
  
  const handleFoldersChanged = () => {
    // Update folder stats when folders change
    fetchFolderStats();
    fetchRecentActivities();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const formatLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };
  
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showInfoToast('Code copied to clipboard!');
    } catch (error) {
      console.error('Error copying code:', error);
      showErrorToast('Failed to copy code');
    }
  };

  const navigateToSnippetDetail = (snippetId: number) => {
    router.push(`/snippets/${snippetId}`);
  };

  const navigateToCreateSnippet = () => {
    router.push('/snippets/create');
  };

  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Within last week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} days ago`;
    }
    
    // Older than a week
    return date.toLocaleDateString();
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'snippet_created':
        return <PlusCircle className="w-2 h-2 text-primary" />;
      case 'snippet_copied':
        return <Copy className="w-2 h-2 text-primary" />;
      case 'folder_created':
        return <FolderPlus className="w-2 h-2 text-primary" />;
      default:
        return <Clock className="w-2 h-2 text-primary" />;
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Will redirect via useEffect
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-xl">SnipStash</span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/snippets')} className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              <span className="hidden md:inline">Snippets</span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Folder Management</CardTitle>
                <CardDescription>
                  Organize and manage your content with folders
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-1">
                <div className="h-[calc(100vh-240px)] overflow-y-auto pr-2">
                  <FolderList 
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={handleFolderSelect}
                    onFoldersChanged={handleFoldersChanged}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Overview of your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Total Folders</span>
                    </div>
                    <span className="font-semibold">{folderStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FolderPlus className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Recently Added</span>
                    </div>
                    <span className="font-semibold">{folderStats.recent}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Welcome, {user?.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedFolderId === null 
                      ? "Manage your folders and stay organized" 
                      : `Viewing snippets in selected folder`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={navigateToCreateSnippet} variant="default" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Snippet
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/snippets')}>
                    <Code className="h-4 w-4 mr-2" />
                    View Snippets
                  </Button>
                 
                </div>
              </div>
            </CardHeader>
          </Card>
          
          {selectedFolderId === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    Quick actions to organize your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between group" 
                      size="lg"
                      onClick={navigateToCreateSnippet}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <PlusCircle className="h-5 w-5 text-primary" />
                        </div>
                        <span>Create New Snippet</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between group" 
                      size="lg"
                      onClick={() => router.push('/snippets')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Code className="h-5 w-5 text-primary" />
                        </div>
                        <span>Manage Snippets</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                    
                    
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Helpful Tips</CardTitle>
                  <CardDescription>
                    Make the most of your folder organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3 bg-card/50">
                      <h4 className="font-medium text-sm mb-1">Organize by Projects</h4>
                      <p className="text-sm text-muted-foreground">
                        Group related content by creating project-specific folders.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3 bg-card/50">
                      <h4 className="font-medium text-sm mb-1">Use Naming Conventions</h4>
                      <p className="text-sm text-muted-foreground">
                        Create a consistent naming system for your folders to make finding content easier.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest actions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No recent activity found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Activity will appear here as you use the app
                      </p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-[28px] p-1 bg-background border rounded-full">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          </div>
                          <div className="mb-1 text-sm font-medium">{activity.description}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(activity.date)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                {recentActivities.length > 0 && (
                  <CardFooter className="pt-0">
                    
                  </CardFooter>
                )}
              </Card>
            </div>
          ) : (
            <div>
              {isLoadingSnippets ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading snippets...</span>
                </div>
              ) : folderSnippets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No snippets found in this folder</h3>
                    <p className="text-muted-foreground mb-6">
                      This folder doesn't contain any snippets yet.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={navigateToCreateSnippet}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Snippet
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/snippets')}>
                        Manage Snippets
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Found {folderSnippets.length} snippet{folderSnippets.length !== 1 && 's'} in this folder
                    </div>
                    <Button onClick={navigateToCreateSnippet} size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Snippet
                    </Button>
                  </div>
                  
                  {folderSnippets.map(snippet => (
                    <Card key={snippet.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{snippet.title}</CardTitle>
                            <CardDescription>
                              {formatLanguage(snippet.language)} snippet • 
                              {snippet.Tags && snippet.Tags.length > 0 && (
                                <span className="ml-1">
                                  {snippet.Tags.map(tag => tag.name).join(', ')}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8"
                              onClick={() => navigateToSnippetDetail(snippet.id)}
                            >
                              <Code className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8"
                              onClick={() => router.push(`/snippets/edit/${snippet.id}`)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8"
                              onClick={() => handleCopyCode(snippet.code)}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="relative bg-muted rounded-md p-3 overflow-x-auto max-h-[200px]">
                          <pre className="text-sm">
                            <code>{snippet.code}</code>
                          </pre>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-3">
                        <div className="flex items-center">
                          <Clipboard className="h-3 w-3 mr-1" />
                          <span>Copied {snippet.copyCount} times</span>
                        </div>
                        {snippet.lastCopiedAt && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Last copied {new Date(snippet.lastCopiedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 