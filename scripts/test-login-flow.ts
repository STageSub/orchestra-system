import fetch from 'node-fetch'

async function testLoginFlow() {
  console.log('🔄 Testing superadmin login flow...\n')
  
  const baseUrl = 'http://localhost:3001'
  
  // Step 1: Login
  console.log('1️⃣ Attempting login...')
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: 'admin123'
    })
  })
  
  const loginData = await loginResponse.json()
  const cookies = loginResponse.headers.get('set-cookie')
  
  console.log('Login response:', loginData)
  console.log('Cookie received:', cookies ? 'Yes' : 'No')
  
  if (!cookies) {
    console.error('❌ No cookie received!')
    return
  }
  
  // Extract cookie value
  const cookieValue = cookies.split(';')[0]
  
  // Step 2: Wait a bit (simulate browser delay)
  console.log('\n2️⃣ Waiting 300ms (simulating browser)...')
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Step 3: Verify authentication
  console.log('\n3️⃣ Verifying authentication...')
  const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
    headers: { 'Cookie': cookieValue }
  })
  
  const verifyData = await verifyResponse.json()
  console.log('Verification result:', verifyData)
  
  // Step 4: Try to access superadmin page
  console.log('\n4️⃣ Attempting to access /superadmin...')
  const pageResponse = await fetch(`${baseUrl}/superadmin`, {
    headers: { 'Cookie': cookieValue },
    redirect: 'manual'
  })
  
  console.log('Response status:', pageResponse.status)
  console.log('Location header:', pageResponse.headers.get('location') || 'No redirect')
  
  if (pageResponse.status === 200) {
    console.log('✅ Successfully accessed /superadmin on first try!')
  } else if (pageResponse.status === 307 || pageResponse.status === 302) {
    console.log('❌ Redirected - login might have failed')
  }
  
  console.log('\n✅ Test complete!')
}

testLoginFlow().catch(console.error)