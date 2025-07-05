import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testMetricsAPI() {
  console.log('Testing /api/superadmin/metrics endpoint...\n')
  
  try {
    // Note: This will test locally. In production, you'd need to use the actual URL
    const response = await fetch('http://localhost:3001/api/superadmin/metrics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()))

    const text = await response.text()
    console.log('\nRaw response:')
    console.log(text)

    if (response.ok) {
      try {
        const data = JSON.parse(text)
        console.log('\nParsed data:')
        console.log('Orchestras:', data.orchestras?.length || 0)
        
        if (data.orchestras) {
          data.orchestras.forEach((o: any) => {
            console.log(`\n${o.name} (${o.orchestraId}):`)
            console.log(`  Status: ${o.status}`)
            console.log(`  Metrics:`, o.metrics?.[0] || 'No metrics')
          })
        }
        
        console.log('\nTotal metrics:', data.metrics)
      } catch (e) {
        console.log('Failed to parse JSON:', e)
      }
    }

  } catch (error: any) {
    console.error('Request failed:', error.message)
  }
}

// Check if running directly
if (require.main === module) {
  console.log('Note: Make sure the dev server is running on http://localhost:3001')
  console.log('You can start it with: npm run dev\n')
  
  testMetricsAPI()
}