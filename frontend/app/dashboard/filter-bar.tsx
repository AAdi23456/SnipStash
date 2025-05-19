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

// All possible auto-tag options from autoTagger.js
const AUTO_TAG_OPTIONS = [
  'loop',
  'API',
  'error handling',
  'array ops',
  'debugging',
  'async',
  'DOM',
  'react',
  'condition',
  'function',
  'timing',
  'OOP',
  'module',
  'MongoDB',
  'Express',
  'SQL',
  'auth',
  'security',
  'AI',
  'Machine Learning'
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
  // Combine available tags with auto tag options
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([]);

  // Combine user's existing tags with auto-tag options
  useEffect(() => {
    const combinedTags = [...new Set([...availableTags, ...AUTO_TAG_OPTIONS])];
    setAllAvailableTags(combinedTags.sort());
  }, [availableTags]);

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
          <SelectContent position="popper" side="bottom" align="start">
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
            <SelectContent position="popper" side="bottom" align="start">
              {allAvailableTags
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

      {/* Selected tag badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-2 py-1 pr-1 flex items-center">
              <span>{tag}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="ml-1 p-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 