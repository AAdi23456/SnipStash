/**
 * Test script for auto-tagging functionality
 * Run with: node src/utils/test-autotagger.js
 */

const { autoTagCode } = require('./autoTagger');

// Test cases with different code examples covering various patterns
const testCases = [
  {
    name: 'JavaScript Loop',
    code: `
    for (let i = 0; i < 10; i++) {
      console.log('Iteration: ' + i);
    }`,
    manualTags: ['javascript'],
    description: 'Simple for loop'
  },
  {
    name: 'API Call',
    code: `
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }`,
    manualTags: [],
    description: 'Fetch data from an API'
  },
  {
    name: 'React Component',
    code: `
    import React, { useState, useEffect } from 'react';
    
    function UserProfile({ userId }) {
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        const fetchUser = async () => {
          try {
            const response = await fetch(\`/api/users/\${userId}\`);
            const data = await response.json();
            setUser(data);
          } catch (error) {
            console.error('Error:', error);
          } finally {
            setLoading(false);
          }
        };
        
        fetchUser();
      }, [userId]);
      
      if (loading) return <div>Loading...</div>;
      
      return (
        <div className="user-profile">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      );
    }`,
    manualTags: ['component'],
    description: 'User profile component with data fetching'
  },
  {
    name: 'SQL Query',
    code: `
    const getUsersWithPosts = async (db) => {
      const query = \`
        SELECT u.id, u.name, u.email, p.title as post_title, p.content
        FROM users u
        JOIN posts p ON u.id = p.user_id
        WHERE u.active = true
        ORDER BY u.created_at DESC
      \`;
      
      return await db.query(query);
    }`,
    manualTags: ['database'],
    description: 'SQL query to get users and their posts'
  },
  {
    name: 'Description Only',
    code: '',
    manualTags: ['utility'],
    description: 'This is a MongoDB aggregation pipeline for user analytics'
  }
];

// Run the tests
console.log('===== TESTING AUTO-TAGGER =====\n');

testCases.forEach((test, index) => {
  console.log(`\n[Test ${index + 1}] ${test.name}`);
  console.log(`Code length: ${test.code?.length || 0} chars`);
  console.log(`Description: ${test.description}`);
  console.log(`Manual tags: ${test.manualTags.join(', ') || 'none'}`);
  console.log('----- Results -----');
  
  const tags = autoTagCode(test.code, test.manualTags, test.description);
  
  console.log('\nFinal tags:', tags);
  console.log('-----------------------\n');
});

console.log('===== AUTO-TAGGER TESTING COMPLETE ====='); 