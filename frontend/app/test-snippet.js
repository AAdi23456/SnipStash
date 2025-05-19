// Test script for creating snippets from the browser
// Paste this into browser console to run

async function testCreateSnippet() {
  // Get token from localStorage
  const userDataStr = localStorage.getItem('user');
  if (!userDataStr) {
    console.error('No user data found in localStorage');
    return;
  }
  
  let userData;
  try {
    userData = JSON.parse(userDataStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
    return;
  }
  
  if (!userData.token) {
    console.error('No token found in user data');
    return;
  }
  
  const token = userData.token;
  console.log('Using token:', token);
  
  // Test snippet data
  const testSnippet = {
    title: 'Test Snippet from Browser',
    code: 'console.log("Hello from browser");',
    language: 'javascript',
    description: 'A test snippet created via browser console',
    tags: ['test', 'browser']
  };
  
  try {
    console.log('Sending request to create snippet...');
    console.log('Request data:', testSnippet);
    
    const response = await fetch('https://snipstash-9tms.onrender.com/api/snippets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testSnippet)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      console.log('Snippet created successfully!');
      try {
        const data = JSON.parse(responseText);
        console.log('Created snippet ID:', data.id);
      } catch (e) {
        console.error('Error parsing response JSON:', e);
      }
    } else {
      console.error('Failed to create snippet');
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.testCreateSnippet = testCreateSnippet;
  console.log('Test function ready: call testCreateSnippet() to run');
} 