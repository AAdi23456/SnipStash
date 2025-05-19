'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../src/components/ui/button';
import { showInfoToast } from '../../lib/toast-utils';
import FolderList from './folder-list';
import { 
  LayoutDashboard, 
  LogOut, 
  User, 
  ArrowRight,
  Folder,
  FolderPlus,
  Settings,
  Code
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../src/components/ui/card';

interface Folder {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [folderStats, setFolderStats] = useState({
    total: 0,
    recent: 0
  });

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

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
  };
  
  const handleFoldersChanged = () => {
    // Could update folder stats here if needed
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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
                    Manage your folders and stay organized
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/snippets')}>
                    <Code className="h-4 w-4 mr-2" />
                    View Snippets
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          
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
                  <Button variant="outline" className="w-full justify-between group" size="lg">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FolderPlus className="h-5 w-5 text-primary" />
                      </div>
                      <span>Create New Folder</span>
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
                  
                  <Button variant="outline" className="w-full justify-between group" size="lg">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <span>Manage Account</span>
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
                <div className="relative pl-6 border-l space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[28px] p-1 bg-background border rounded-full">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="mb-1 text-sm font-medium">New folder created</div>
                    <div className="text-xs text-muted-foreground">Today, 10:30 AM</div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[28px] p-1 bg-background border rounded-full">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="mb-1 text-sm font-medium">Folder renamed</div>
                    <div className="text-xs text-muted-foreground">Yesterday, 2:15 PM</div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[28px] p-1 bg-background border rounded-full">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="mb-1 text-sm font-medium">Account updated</div>
                    <div className="text-xs text-muted-foreground">2 days ago</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="ml-auto">
                  View all activity
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 