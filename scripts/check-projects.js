const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkProjects() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        projectNeeds: {
          include: {
            requests: true
          }
        }
      }
    })
    
    console.log(`Found ${projects.length} projects:\n`)
    
    projects.forEach(project => {
      const totalRequests = project.projectNeeds.reduce((sum, need) => sum + need.requests.length, 0)
      const acceptedRequests = project.projectNeeds.reduce((sum, need) => 
        sum + need.requests.filter(r => r.status === 'accepted').length, 0)
      
      console.log(`${project.id}. ${project.name} (${project.type || 'No type'})`)
      console.log(`   Needs: ${project.projectNeeds.length}, Requests: ${totalRequests}, Accepted: ${acceptedRequests}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjects()