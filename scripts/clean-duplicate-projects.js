#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanDuplicates() {
  try {
    // Find duplicate projects by name
    const projects = await prisma.project.findMany({
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            projectNeeds: true
          }
        }
      }
    })
    
    const projectsByName = {}
    const toDelete = []
    
    projects.forEach(project => {
      if (!projectsByName[project.name]) {
        projectsByName[project.name] = []
      }
      projectsByName[project.name].push(project)
    })
    
    // Keep only the first (oldest) of each duplicate
    Object.entries(projectsByName).forEach(([name, projects]) => {
      if (projects.length > 1) {
        console.log(`\nFound ${projects.length} duplicates of: ${name}`)
        // Keep the first one (oldest), delete the rest
        for (let i = 1; i < projects.length; i++) {
          toDelete.push(projects[i])
          console.log(`  Will delete: ${projects[i].projectId} (created ${projects[i].createdAt.toLocaleDateString()})`)
        }
      }
    })
    
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} duplicate projects...`)
      
      for (const project of toDelete) {
        await prisma.project.delete({
          where: { id: project.id }
        })
        console.log(`  ✓ Deleted ${project.name}`)
      }
      
      console.log('\n✅ Cleanup complete!')
    } else {
      console.log('\n✅ No duplicates found!')
    }
    
    // Show summary
    const remaining = await prisma.project.count()
    console.log(`\n📊 Total projects remaining: ${remaining}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDuplicates()