import { SupabaseManagementService } from '@/lib/supabase-management'

async function checkProjects() {
  console.log('🔍 Kontrollerar Supabase-projekt...\n')
  
  try {
    const api = new SupabaseManagementService()
    const projects = await api.listProjects()
    
    console.log(`Antal projekt: ${projects.length}`)
    console.log('========================')
    
    for (const project of projects) {
      console.log(`\nNamn: ${project.name}`)
      console.log(`ID: ${project.id}`)
      console.log(`Region: ${project.region}`)
      console.log(`Status: ${project.status}`)
      console.log(`Skapad: ${new Date(project.created_at).toLocaleDateString('sv-SE')}`)
      
      // Get project details for database info
      const details = await api.getProject(project.id)
      console.log(`Database host: ${details.database?.host || 'N/A'}`)
    }
    
    console.log('\n\n💡 Tips:')
    console.log('- Varje orkester behöver sitt eget Supabase-projekt')
    console.log('- Free tier tillåter bara 2 projekt')
    console.log('- Du kan uppgradera eller ta bort oanvända projekt')
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

checkProjects()