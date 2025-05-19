/**
 * Script to directly test the snippet creation API
 * Run with: node src/test-api.js
 */

const fetch = require('node-fetch');

const testCreateSnippet = async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhYWRpamhhMTJAZ21haWwuY29tIiwiaWF0IjoxNzQ3NjU3NzM3LCJleHAiOjE3NTAyNDk3Mzd9.SOP9UfsP4oneQFteBKc2ze6spV9n6_P--yvxL33NfN4';
  
  const snippetData = {
    title: 'Test Snippet',
    code: 'console.log("Hello World");',
    language: 'javascript',
    description: 'A test snippet created via API',
    tags: ['test', 'api']
  };
  
  console.log('Sending request to create snippet...');
  console.log('Request data:', snippetData);
  
  try {
    const response = await fetch('https://snipstash-9tms.onrender.com/api/snippets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(snippetData)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Snippet created successfully!');
      console.log('Created snippet ID:', data.id);
    } else {
      console.error('Failed to create snippet:', responseText);
    }
  } catch (error) {
    console.error('Error creating snippet:', error);
  }
};

testCreateSnippet(); 