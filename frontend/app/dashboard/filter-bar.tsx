'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Badge
} from "@/components/ui/badge";
import { X } from "lucide-react";
import debounce from 'lodash.debounce';

// Language options for the dropdown
const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All Languages' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash/Shell' }
];

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableTags: string[];
  initialFilters?: FilterOptions;
}

export interface FilterOptions {
  query: string;
  language: string;
  tags: string[];
}

export default function FilterBar({ onFilterChange, availableTags, initialFilters }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || '');
  const [language, setLanguage] = useState(initialFilters?.language ? initialFilters.language : 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters?.tags || []);
  const [activeTag, setActiveTag] = useState('');

  // Apply initial filters if they change externally
  useEffect(() => {
    if (initialFilters) {
      setSearchQuery(initialFilters.query || '');
      setLanguage(initialFilters.language || 'all');
      setSelectedTags(initialFilters.tags || []);
    }
  }, [initialFilters]);

  // Create a debounced function for search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onFilterChange({ 
        query, 
        language, 
        tags: selectedTags 
      });
    }, 300),
    [language, selectedTags, onFilterChange]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle language selection
  const handleLanguageChange = (value: string) => {
    // We want to send 'all' to the API
    setLanguage(value);
    console.log('Language selected:', value);
    onFilterChange({
      query: searchQuery,
      language: value,
      tags: selectedTags
    });
  };

  // Handle adding a tag to the filter
  const handleAddTag = () => {
    if (activeTag && !selectedTags.includes(activeTag)) {
      const newTags = [...selectedTags, activeTag];
      setSelectedTags(newTags);
      setActiveTag('');
      onFilterChange({
        query: searchQuery,
        language,
        tags: newTags
      });
    }
  };

  // Handle tag selection in dropdown
  const handleTagSelect = (tag: string) => {
    setActiveTag(tag);
  };

  // Handle removing a tag from the filter
  const handleRemoveTag = (tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
    onFilterChange({
      query: searchQuery,
      language,
      tags: newTags
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setLanguage('all');
    setSelectedTags([]);
    onFilterChange({
      query: '',
      language: '',
      tags: []
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1">
          <Input
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        
        {/* Language dropdown */}
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Tag selection */}
        <div className="flex gap-2">
          <Select value={activeTag} onValueChange={handleTagSelect}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Select Tag" />
            </SelectTrigger>
            <SelectContent>
              {availableTags
                .filter(tag => !selectedTags.includes(tag) && tag !== null && tag !== undefined)
                .map((tag) => (
                  <SelectItem key={tag} value={String(tag)}>
                    {tag}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleAddTag}
            disabled={!activeTag}
          >
            Add
          </Button>
          
          {(searchQuery || language || selectedTags.length > 0) && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear All
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X 
                size={14} 
                className="cursor-pointer" 
                onClick={() => handleRemoveTag(tag)} 
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 