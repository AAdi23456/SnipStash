'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the code editor with no SSR
const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

// Import Prism styles and language support on the client side
const loadPrismDependencies = () => {
  // Only import Prism styles and languages in the browser
  if (typeof window !== 'undefined') {
    require('prismjs/themes/prism-tomorrow.css');
    require('prismjs/components/prism-javascript');
    require('prismjs/components/prism-typescript');
    require('prismjs/components/prism-jsx');
    require('prismjs/components/prism-tsx');
    require('prismjs/components/prism-css');
    require('prismjs/components/prism-python');
    require('prismjs/components/prism-java');
    require('prismjs/components/prism-c');
    require('prismjs/components/prism-cpp');
    require('prismjs/components/prism-csharp');
    require('prismjs/components/prism-ruby');
    require('prismjs/components/prism-go');
    require('prismjs/components/prism-rust');
    require('prismjs/components/prism-sql');
    require('prismjs/components/prism-bash');
    require('prismjs/components/prism-json');
    require('prismjs/components/prism-yaml');
    require('prismjs/components/prism-markup'); // HTML
    require('prismjs/components/prism-php');
    require('prismjs/components/prism-markdown');
  }
};

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  id?: string;
}

// Function to convert common language names to prism language names
const normalizePrismLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    html: 'markup',
    css: 'css',
    python: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'csharp',
    'c#': 'csharp',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    sql: 'sql',
    bash: 'bash',
    shell: 'bash',
    json: 'json',
    yaml: 'yaml',
    markdown: 'markdown',
    php: 'php',
    other: 'plaintext',
  };
  
  return languageMap[language?.toLowerCase()] || 'plaintext';
};

export function SyntaxHighlightedCodeEditor({
  value,
  language,
  onChange,
  placeholder = 'Enter code here...',
  className = '',
  minHeight = '200px',
  id,
}: CodeEditorProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // No dynamic imports here - these will be handled by the CodeEditor component
  }, []);
  
  // Normalize the language to match PrismJS language definitions
  const prismLanguage = normalizePrismLanguage(language);
  
  if (!isClient) {
    return (
      <div 
        className={`border border-slate-600 bg-slate-800 rounded-md text-slate-400 ${className}`}
        style={{ minHeight }}
      >
        Loading editor...
      </div>
    );
  }
  
  return (
    <CodeEditor
      value={value}
      language={prismLanguage}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      padding={15}
      data-color-mode="dark"
      style={{
        fontSize: '14px',
        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        borderRadius: '6px',
        minHeight: minHeight,
        backgroundColor: '#1e293b', // Tailwind slate-800
        lineHeight: 1.5,
      }}
      className={`border border-slate-600 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 ${className}`}
    />
  );
} 