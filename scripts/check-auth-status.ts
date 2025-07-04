// This script checks the authentication status when accessing the logs page

async function checkAuthStatus() {
  const baseUrl = 'http://localhost:3001'
  
  console.log('=== Checking Authentication Status for Logs Page ===\n')
  
  try {
    // First, check if we can access the logs API
    console.log('1. Testing /api/system-logs endpoint...')
    const response = await fetch(`${baseUrl}/api/system-logs`, {
      credentials: 'include', // Include cookies
      headers: {
        'Cookie': process.env.AUTH_COOKIE || '' // You can set this if you have the cookie
      }
    })
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (response.status === 401) {
      console.log('   ❌ Authentication required - You need to be logged in')
      console.log('   → Solution: Log in at /admin/login')
    } else if (response.status === 403) {
      console.log('   ❌ Forbidden - You need admin or superadmin role')
      console.log('   → Solution: Use an account with admin privileges')
    } else if (response.status === 200) {
      const data = await response.json()
      console.log('   ✅ Successfully authenticated!')
      console.log(`   → Found ${data.logs?.length || 0} logs`)
      console.log(`   → Total logs in database: ${data.total || 0}`)
    } else {
      console.log('   ❓ Unexpected response:', await response.text())
    }
    
  } catch (error) {
    console.log('   ❌ Error connecting to server:', error)
    console.log('   → Make sure the development server is running (npm run dev)')
  }
  
  console.log('\n2. To fix authentication issues:')
  console.log('   a) Make sure you are logged in at /admin/login')
  console.log('   b) Your user needs to have role = "admin" or "superadmin"')
  console.log('   c) Check your browser cookies for "orchestra-admin-session"')
}

checkAuthStatus()