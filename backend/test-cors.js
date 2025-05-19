/**
 * Simple script to test CORS and API functionality
 */
const fetch = require('node-fetch');

// Test token - replace with your own valid token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhYWRpamhhMTJAZ21haWwuY29tIiwiaWF0IjoxNzQ3NjU3NzM3LCJleHAiOjE3NTAyNDk3Mzd9.SOP9UfsP4oneQFteBKc2ze6spV9n6_P--yvxL33NfN4';

// Test data for creating a snippet
const testData = {
  title: 'Test CORS',
  code: 'console.log("Testing CORS")',
  language: 'javascript',
  description: 'This is a test snippet to verify CORS is working',
  tags: ['test', 'cors']
};

// Function to test getting snippets
async function testGetSnippets() {
  try {
    console.log('Testing GET /api/snippets endpoint...');
    const response = await fetch('https://snipstash-9tms.onrender.com/api/snippets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET /api/snippets succeeded!');
      console.log(`Found ${data.length} snippets`);
    } else {
      const text = await response.text();
      console.error('❌ GET /api/snippets failed!', response.status, text);
    }
  } catch (error) {
    console.error('Error testing GET /api/snippets:', error);
  }
}

// Function to test creating a snippet
async function testCreateSnippet() {
  try {
    console.log('Testing POST /api/snippets endpoint...');
    console.log('Request payload:', testData);
    
    const response = await fetch('https://snipstash-9tms.onrender.com/api/snippets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ POST /api/snippets succeeded!');
      console.log('Created snippet ID:', data.id);
    } else {
      const text = await response.text();
      console.error('❌ POST /api/snippets failed!', response.status, text);
    }
  } catch (error) {
    console.error('Error testing POST /api/snippets:', error);
  }
}

// Run tests
async function runTests() {
  console.log('=== Starting API Tests ===');
  await testGetSnippets();
  console.log('-------------------------');
  await testCreateSnippet();
  console.log('=== Tests Completed ===');
}

runTests(); 