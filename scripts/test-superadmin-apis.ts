import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  body: any;
  error?: string;
  headers?: any;
}

const results: TestResult[] = [];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(): Promise<string | null> {
  console.log('\n🔐 Attempting to login as superadmin...');
  
  // Try both with username (new system) and without (legacy system)
  const password = process.env.SUPERADMIN_PASSWORD;
  
  if (!password) {
    console.error('❌ SUPERADMIN_PASSWORD not set in environment variables');
    return null;
  }
  
  try {
    // First try with username (database auth)
    let response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Super Admin',  // Using the actual name from DB
        password,
        loginType: 'superadmin'
      })
    });
    
    let data = await response.json();
    console.log(`📊 Login response (with username): ${response.status} ${response.statusText}`);
    console.log('   Response body:', data);
    
    if (!response.ok) {
      // Try legacy login (password only)
      console.log('\n🔐 Trying legacy login (password only)...');
      response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          loginType: 'superadmin'
        })
      });
      
      data = await response.json();
      console.log(`📊 Login response (legacy): ${response.status} ${response.statusText}`);
      console.log('   Response body:', data);
    }
    
    if (response.ok) {
      // Extract cookie from response headers
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const cookie = setCookieHeader.split(';')[0];
        console.log('✅ Login successful! Got cookie:', cookie.substring(0, 50) + '...');
        return cookie;
      } else {
        console.error('❌ No cookie in response headers');
        return null;
      }
    } else {
      console.error('❌ Login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

async function testEndpoint(
  method: string, 
  endpoint: string, 
  cookie: string,
  body?: any
): Promise<void> {
  console.log(`\n📡 Testing ${method} ${endpoint}...`);
  
  try {
    const options: any = {
      method,
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    let responseBody;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }
    
    const result: TestResult = {
      endpoint,
      method,
      status: response.status,
      statusText: response.statusText,
      body: responseBody,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    results.push(result);
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    if (response.status < 300) {
      console.log('✅ Success!');
      if (typeof responseBody === 'object') {
        console.log('   Response preview:', JSON.stringify(responseBody, null, 2).substring(0, 500) + '...');
      } else {
        console.log('   Response:', responseBody);
      }
    } else {
      console.log('❌ Error response:', responseBody);
    }
    
  } catch (error) {
    console.error('❌ Request error:', error);
    results.push({
      endpoint,
      method,
      status: 0,
      statusText: 'Network Error',
      body: null,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing direct database connection...');
  
  try {
    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test User table
    console.log('📊 Checking User table...');
    const userCount = await prisma.user.count();
    console.log(`   Found ${userCount} users in database`);
    
    // List superadmin users using raw query
    const superadmins = await prisma.$queryRaw`
      SELECT id, name, email, role, "createdAt", "lastLoginAt" as "lastLogin"
      FROM "User"
      WHERE role = 'superadmin'
    ` as any[];
    
    console.log(`   Found ${superadmins.length} superadmin users:`);
    superadmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - Created: ${admin.createdAt}`);
    });
    
    // Test Orchestra table
    console.log('\n📊 Checking Orchestra table...');
    const orchestraCount = await prisma.orchestra.count();
    console.log(`   Found ${orchestraCount} orchestras in database`);
    
    const activeOrchestras = await prisma.orchestra.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true
      }
    });
    
    console.log(`   Found ${activeOrchestras.length} active orchestras:`);
    activeOrchestras.forEach(orchestra => {
      console.log(`   - ${orchestra.name} (${orchestra.subdomain}) - ID: ${orchestra.id}`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

async function main() {
  console.log('🚀 Starting Superadmin API Tests');
  console.log('================================\n');
  
  // First test database connection
  await testDatabaseConnection();
  
  // Wait a bit for server to be ready
  await sleep(2000);
  
  // Login first
  const cookie = await login();
  
  if (!cookie) {
    console.error('\n❌ Failed to authenticate. Cannot proceed with API tests.');
    process.exit(1);
  }
  
  // Test all endpoints
  await testEndpoint('GET', '/api/superadmin/health', cookie);
  await testEndpoint('GET', '/api/superadmin/users', cookie);
  await testEndpoint('GET', '/api/superadmin/metrics', cookie);
  
  // Get an orchestra ID for testing PATCH
  console.log('\n🔍 Looking for an orchestra to test status toggle...');
  const orchestrasResponse = await fetch(`${BASE_URL}/api/superadmin/orchestras`, {
    headers: { 'Cookie': cookie }
  });
  
  if (orchestrasResponse.ok) {
    const orchestras = await orchestrasResponse.json();
    if (orchestras.length > 0) {
      const testOrchestra = orchestras[0];
      console.log(`   Testing with orchestra: ${testOrchestra.name} (ID: ${testOrchestra.id})`);
      
      // Test status toggle
      const newStatus = testOrchestra.status === 'active' ? 'inactive' : 'active';
      await testEndpoint(
        'PATCH', 
        `/api/superadmin/orchestras/${testOrchestra.id}`,
        cookie,
        { status: newStatus }
      );
      
      // Toggle back
      await testEndpoint(
        'PATCH', 
        `/api/superadmin/orchestras/${testOrchestra.id}`,
        cookie,
        { status: testOrchestra.status }
      );
    } else {
      console.log('   No orchestras found to test PATCH endpoint');
    }
  }
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('==============\n');
  
  const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
  const errorCount = results.filter(r => r.status >= 400 || r.status === 0).length;
  
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`❌ Failed requests: ${errorCount}`);
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    const icon = result.status < 300 ? '✅' : '❌';
    console.log(`\n${icon} ${result.method} ${result.endpoint}`);
    console.log(`   Status: ${result.status} ${result.statusText}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.status === 401) {
      console.log('   Issue: Authentication failed - check if superadmin role is properly set');
    } else if (result.status === 404) {
      console.log('   Issue: Endpoint not found - check route configuration');
    } else if (result.status === 500) {
      console.log('   Issue: Server error - check server logs for details');
    }
  });
  
  // Check for CORS issues
  const corsIssues = results.filter(r => 
    r.headers && (
      !r.headers['access-control-allow-origin'] ||
      r.headers['access-control-allow-origin'] === '*'
    )
  );
  
  if (corsIssues.length > 0) {
    console.log('\n⚠️  Potential CORS issues detected:');
    console.log('   No specific CORS headers set. This might cause issues in production.');
  }
  
  console.log('\n✅ Test completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});