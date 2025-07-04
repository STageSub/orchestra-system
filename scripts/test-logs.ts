import { logger } from '../lib/logger';

console.log('📝 Creating test logs...\n');

// Create various test logs
async function createTestLogs() {
  await logger.info('system', 'System startup test', {
    metadata: { version: '1.0.0', environment: 'development' }
  });

  await logger.debug('api', 'API request test', {
    metadata: { endpoint: '/api/test', method: 'GET' },
    duration: 150
  });

  await logger.warn('auth', 'Authentication warning test', {
    metadata: { attemptCount: 3, ip: '192.168.1.1' },
    userId: 'test-user-123'
  });

  await logger.error('email', 'Email sending failed test', {
    metadata: { 
      error: 'SMTP connection timeout',
      recipient: 'test@example.com'
    }
  });

  await logger.info('test', 'Test category log', {
    metadata: { testId: 'test-123', timestamp: Date.now() }
  });

  // Give time for async database writes
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Test logs created!');
  console.log('\n📌 Now check the logs page at /admin/logs');
  console.log('   You should see the new test logs in the UI');
  
  process.exit(0);
}

createTestLogs().catch(error => {
  console.error('❌ Error creating test logs:', error);
  process.exit(1);
});