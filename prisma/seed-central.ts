import { prismaCentral } from '../lib/prisma-central'

async function main() {
  console.log('🌱 Seeding central database...')

  // Create test orchestras
  const orchestras = await Promise.all([
    prismaCentral.orchestra.create({
      data: {
        orchestraId: 'GOT',
        name: 'Göteborgs Symfoniker',
        subdomain: 'goteborg',
        databaseUrl: 'postgresql://dummy@localhost/goteborg',
        status: 'active'
      }
    }),
    prismaCentral.orchestra.create({
      data: {
        orchestraId: 'STO',
        name: 'Stockholms Filharmoniker',
        subdomain: 'stockholm',
        databaseUrl: 'postgresql://dummy@localhost/stockholm',
        status: 'active'
      }
    }),
    prismaCentral.orchestra.create({
      data: {
        orchestraId: 'MAL',
        name: 'Malmö Symfoniorkester',
        subdomain: 'malmo',
        databaseUrl: 'postgresql://dummy@localhost/malmo',
        status: 'active'
      }
    })
  ])

  console.log('✅ Created orchestras')

  // Create subscriptions
  for (const orchestra of orchestras) {
    await prismaCentral.subscription.create({
      data: {
        orchestraId: orchestra.id,
        plan: orchestra.orchestraId === 'GOT' ? 'enterprise' : 'medium',
        status: 'active',
        pricePerMonth: orchestra.orchestraId === 'GOT' ? 15000 : 4990,
        currency: 'SEK',
        startedAt: new Date('2024-01-01'),
        nextBillingAt: new Date('2025-08-01'),
        maxMusicians: orchestra.orchestraId === 'GOT' ? 1000 : 200,
        maxProjects: orchestra.orchestraId === 'GOT' ? 100 : 20,
        maxRequests: orchestra.orchestraId === 'GOT' ? 10000 : 1000,
        maxStorageGB: orchestra.orchestraId === 'GOT' ? 100 : 10
      }
    })
  }

  console.log('✅ Created subscriptions')

  // Create some metrics data
  const today = new Date()
  for (const orchestra of orchestras) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      await prismaCentral.orchestraMetrics.create({
        data: {
          orchestraId: orchestra.id,
          date: date,
          totalMusicians: Math.floor(Math.random() * 50) + 100,
          activeMusicians: Math.floor(Math.random() * 30) + 70,
          totalProjects: Math.floor(Math.random() * 10) + 5,
          activeProjects: Math.floor(Math.random() * 5) + 2,
          totalRequests: Math.floor(Math.random() * 100) + 50,
          acceptedRequests: Math.floor(Math.random() * 50) + 25,
          declinedRequests: Math.floor(Math.random() * 20) + 5,
          pendingRequests: Math.floor(Math.random() * 30) + 10,
          emailsSent: Math.floor(Math.random() * 200) + 50,
          storageUsedMB: Math.floor(Math.random() * 1000) + 500,
          apiCalls: Math.floor(Math.random() * 1000) + 100
        }
      })
    }
  }

  console.log('✅ Created metrics data')

  // Create some system events
  const eventTypes = [
    { type: 'orchestra_created', severity: 'info', title: 'New orchestra created' },
    { type: 'subscription_changed', severity: 'info', title: 'Subscription upgraded' },
    { type: 'payment_received', severity: 'info', title: 'Payment received' },
    { type: 'error', severity: 'warning', title: 'API rate limit exceeded' }
  ]

  for (const orchestra of orchestras) {
    for (const eventType of eventTypes) {
      await prismaCentral.systemEvent.create({
        data: {
          orchestraId: orchestra.id,
          type: eventType.type,
          severity: eventType.severity,
          title: `${eventType.title} - ${orchestra.name}`,
          description: `${eventType.title} for ${orchestra.name}`,
          metadata: {
            orchestraName: orchestra.name,
            timestamp: new Date().toISOString()
          }
        }
      })
    }
  }

  console.log('✅ Created system events')

  // Create superadmin user
  await prismaCentral.user.create({
    data: {
      email: 'superadmin@stagesub.com',
      name: 'Super Admin',
      role: 'superadmin'
    }
  })

  console.log('✅ Created superadmin user')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCentral.$disconnect()
  })