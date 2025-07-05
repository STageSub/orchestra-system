import { config } from 'dotenv'
config()

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

// Simulate Safari user agent
const SAFARI_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15'
const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'

async function testAuth(userAgent: string, browserName: string) {
  console.log(`\n🧪 Testing ${browserName} authentication...`)
  console.log('User Agent:', userAgent.substring(0, 50) + '...')
  
  try {
    // 1. Test login
    console.log('\n1. Testing login...')
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent
      },
      body: JSON.stringify({
        username: 'superadmin',
        password: process.env.SUPERADMIN_PASSWORD || 'test'
      })
    })
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status, await loginResponse.text())
      return
    }
    
    // Extract cookie from response
    const setCookie = loginResponse.headers.get('set-cookie')
    console.log('✅ Login successful')
    console.log('Set-Cookie header:', setCookie ? 'Present' : 'Missing')
    
    if (!setCookie) {
      console.error('❌ No cookie set in response')
      return
    }
    
    // Extract cookie value
    const cookieMatch = setCookie.match(/orchestra-admin-session=([^;]+)/)
    if (!cookieMatch) {
      console.error('❌ Could not extract cookie value')
      return
    }
    
    const cookieValue = cookieMatch[1]
    console.log('Cookie value:', cookieValue.substring(0, 50) + '...')
    
    // 2. Test /api/auth/me with cookie
    console.log('\n2. Testing /api/auth/me...')
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Cookie': `orchestra-admin-session=${cookieValue}`,
        'User-Agent': userAgent
      }
    })
    
    if (!meResponse.ok) {
      console.error('❌ /api/auth/me failed:', meResponse.status)
      const errorText = await meResponse.text()
      console.error('Error response:', errorText)
    } else {
      const meData = await meResponse.json()
      console.log('✅ /api/auth/me successful')
      console.log('User:', meData.user?.username, '(', meData.user?.role, ')')
    }
    
    // 3. Test debug endpoint
    console.log('\n3. Testing /api/debug/auth-flow...')
    const debugResponse = await fetch(`${BASE_URL}/api/debug/auth-flow`, {
      headers: {
        'Cookie': `orchestra-admin-session=${cookieValue}`,
        'User-Agent': userAgent
      }
    })
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      console.log('✅ Debug data:')
      console.log('- Browser detected:', debugData.headers.isSafari ? 'Safari' : 'Other')
      console.log('- Cookie found:', debugData.summary.cookieFound)
      console.log('- Token valid:', debugData.summary.tokenValid)
      console.log('- Authentication steps:')
      debugData.authentication.steps.forEach((step: any) => {
        console.log(`  ${step.step}. ${step.action}: ${step.success ? '✅' : '❌'} ${step.details || step.error || ''}`)
      })
      if (debugData.summary.possibleIssues.length > 0) {
        console.log('- Possible issues:', debugData.summary.possibleIssues)
      }
    }
    
    // 4. Test multiple rapid requests (simulate intermittent issue)
    console.log('\n4. Testing rapid requests...')
    const results = []
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Cookie': `orchestra-admin-session=${cookieValue}`,
          'User-Agent': userAgent
        }
      })
      results.push(response.ok)
      process.stdout.write(response.ok ? '✅ ' : '❌ ')
    }
    console.log('')
    
    const successRate = results.filter(r => r).length / results.length * 100
    console.log(`Success rate: ${successRate}% (${results.filter(r => r).length}/${results.length})`)
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

async function main() {
  console.log('🔍 Safari Authentication Debug Test')
  console.log('Base URL:', BASE_URL)
  
  // Test with Chrome user agent
  await testAuth(CHROME_USER_AGENT, 'Chrome')
  
  // Test with Safari user agent
  await testAuth(SAFARI_USER_AGENT, 'Safari')
  
  console.log('\n✅ Test complete')
}

main().catch(console.error)