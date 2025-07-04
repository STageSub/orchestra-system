import dotenv from 'dotenv';

dotenv.config();

async function testLogsAPI() {
  console.log('🔍 Testing /api/system-logs endpoint...\n');
  
  // Get the base URL from environment or use localhost
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    console.log(`📡 Calling: ${baseUrl}/api/system-logs`);
    
    const response = await fetch(`${baseUrl}/api/system-logs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // You might need to add authentication headers here
        // 'Cookie': 'your-session-cookie'
      }
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      
      if (response.ok) {
        console.log(`\n✅ Success! Found ${data.logs?.length || 0} logs`);
        console.log(`   Total count: ${data.total || 0}`);
        
        if (data.logs && data.logs.length > 0) {
          console.log('\n📋 First few logs:');
          data.logs.slice(0, 3).forEach((log: any, index: number) => {
            console.log(`\n${index + 1}. [${log.level}] [${log.category}] ${log.message}`);
            console.log(`   Time: ${log.timestamp}`);
          });
        }
      } else {
        console.log('\n❌ Error response:', data);
        
        if (data.error === 'Authentication required') {
          console.log('\n⚠️  The API requires authentication.');
          console.log('   You need to be logged in as an admin/superadmin to access this endpoint.');
          console.log('   Make sure you\'re logged in when accessing /admin/logs in the browser.');
        } else if (data.error === 'Admin access required') {
          console.log('\n⚠️  The API requires admin privileges.');
          console.log('   The logged-in user must have admin or superadmin role.');
        }
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse response as JSON');
      console.log('   Response:', responseText);
    }
    
  } catch (error) {
    console.error('\n❌ Error calling API:', error);
    console.log('\n💡 Make sure the Next.js server is running on port 3000');
  }
}

testLogsAPI();