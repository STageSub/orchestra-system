#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Calculate ISO week number (Swedish standard)
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

async function checkProjects() {
  try {
    const now = new Date()
    const pastProjects = await prisma.project.findMany({
      where: {
        startDate: { lt: now }
      },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            projectNeeds: true
          }
        }
      }
    })
    
    console.log('📅 GENOMFÖRDA PROJEKT (Past Projects):')
    console.log('=====================================')
    
    pastProjects.forEach(project => {
      const monthsAgo = Math.round((now - new Date(project.startDate)) / (1000 * 60 * 60 * 24 * 30))
      const weekNumber = getISOWeekNumber(new Date(project.startDate))
      console.log(`\n${project.name}`)
      console.log(`  Vecka: ${weekNumber} (ursprunglig: ${project.weekNumber})`)
      console.log(`  Datum: ${new Date(project.startDate).toLocaleDateString('sv-SE')}`)
      console.log(`  ${monthsAgo} månader sedan`)
      console.log(`  Behov: ${project._count.projectNeeds}`)
    })
    
    console.log(`\nTotalt: ${pastProjects.length} genomförda projekt`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjects()