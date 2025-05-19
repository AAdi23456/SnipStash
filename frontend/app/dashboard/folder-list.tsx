'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Folder, FolderPlus, FolderX, MoreVertical, Edit, Trash2, RefreshCw, Plus } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../lib/toast-utils';
import CreateFolder from './create-folder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "../../lib/utils";

interface FolderData {
  id: number;
  name: string;
  Snippets?: any[];
}

interface FolderListProps {
  selectedFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  onFoldersChanged: () => void;
}

export default function FolderList({ selectedFolderId, onFolderSelect, onFoldersChanged }: FolderListProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editFolder, setEditFolder] = useState<FolderData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://snipstash-9tms.onrender.com/api/folders', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      } else {
        showErrorToast('Failed to load folders');
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      showErrorToast('Error loading folders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user, fetchFolders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFolders();
  };

  const handleFolderCreated = () => {
    fetchFolders();
    if (onFoldersChanged) {
      onFoldersChanged();
    }
  };

  const handleEditClick = (folder: FolderData) => {
    setEditFolder(folder);
    setEditName(folder.name);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (folder: FolderData) => {
    setFolderToDelete(folder);
    setDeleteConfirmOpen(true);
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolder || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://snipstash-9tms.onrender.com/api/folders/${editFolder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ name: editName })
      });

      if (response.ok) {
        showSuccessToast('Folder updated successfully');
        fetchFolders();
        if (onFoldersChanged) {
          onFoldersChanged();
        }
        setIsEditOpen(false);
      } else {
        const data = await response.json();
        showErrorToast(data.message || 'Failed to update folder');
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      showErrorToast('Error updating folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://snipstash-9tms.onrender.com/api/folders/${folderToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        showSuccessToast('Folder deleted successfully');
        
        // If the deleted folder was selected, reset selection
        if (selectedFolderId === folderToDelete.id) {
          onFolderSelect(null);
        }
        
        fetchFolders();
        if (onFoldersChanged) {
          onFoldersChanged();
        }
        setDeleteConfirmOpen(false);
      } else {
        const data = await response.json();
        showErrorToast(data.message || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      showErrorToast('Error deleting folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Folders</h3>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
          </Button>
          <CreateFolder onFolderCreated={handleFolderCreated}>
            <Button variant="outline" size="sm" className="h-8">
              <Plus size={14} className="mr-1" />
              New
            </Button>
          </CreateFolder>
        </div>
      </div>

      <div className="space-y-1.5">
        <Button 
          variant={selectedFolderId === null ? "default" : "ghost"} 
          className="w-full justify-start font-medium" 
          onClick={() => onFolderSelect(null)}
        >
          <Folder size={16} className="mr-2" />
          All Folders
          <Badge variant="outline" className="ml-auto">
            {folders.length}
          </Badge>
        </Button>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : folders.length === 0 ? (
          <div className="py-6 text-center rounded-lg border border-dashed">
            <FolderX size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No folders yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id} className="group flex items-center">
                <Button 
                  variant={selectedFolderId === folder.id ? "default" : "ghost"} 
                  className="flex-1 justify-start text-sm font-medium"
                  onClick={() => onFolderSelect(folder.id)}
                >
                  <FolderPlus size={16} className={cn("mr-2", selectedFolderId === folder.id ? "text-primary-foreground" : "text-primary")} />
                  <span className="truncate">{folder.name}</span>
                  {folder.Snippets && folder.Snippets.length > 0 && (
                    <Badge 
                      variant={selectedFolderId === folder.id ? "secondary" : "outline"} 
                      className="ml-auto opacity-80"
                    >
                      {folder.Snippets.length}
                    </Badge>
                  )}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={() => handleEditClick(folder)} className="cursor-pointer">
                      <Edit size={14} className="mr-2" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteClick(folder)} className="text-destructive cursor-pointer">
                      <Trash2 size={14} className="mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Rename your folder to better organize your content.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateFolder} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Folder Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full"
                required
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this folder? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium flex items-center">
              <FolderX size={16} className="mr-2 text-destructive" />
              {folderToDelete?.name}
            </p>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteFolder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 