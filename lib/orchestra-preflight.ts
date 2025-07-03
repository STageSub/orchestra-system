import { getPrisma } from '@/lib/prisma'
import { getSupabaseManagement } from '@/lib/supabase-management'

export interface PreflightResult {
  canCreate: boolean
  issues: PreflightIssue[]
  suggestions: string[]
}

export interface PreflightIssue {
  type: 'error' | 'warning'
  code: string
  message: string
  details?: any
}

/**
 * Kör omfattande kontroller innan en orkester skapas
 * Detta säkerställer att allt är redo och förhindrar problem
 */
export async function runOrchestraPreflightChecks(
  subdomain: string,
  name: string,
  contactEmail: string
): Promise<PreflightResult> {
  const issues: PreflightIssue[] = []
  const suggestions: string[] = []
  
  console.log('🛫 Kör pre-flight kontroller för ny orkester...')
  
  // 1. Kontrollera subdomain
  console.log('1️⃣ Kontrollerar subdomain...')
  
  // Validera format
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    issues.push({
      type: 'error',
      code: 'INVALID_SUBDOMAIN',
      message: 'Subdomänen får endast innehålla små bokstäver, siffror och bindestreck'
    })
  }
  
  // Kontrollera om den redan finns
  const prismaForCheck = await getPrisma()
  const existingOrchestra = await prismaForCheck.orchestra.findUnique({
    where: { subdomain }
  })
  
  if (existingOrchestra) {
    issues.push({
      type: 'error',
      code: 'SUBDOMAIN_EXISTS',
      message: `Subdomänen "${subdomain}" används redan av ${existingOrchestra.name}`,
      details: { existingOrchestra: existingOrchestra.name }
    })
  }
  
  // 2. Kontrollera Supabase-kvot
  console.log('2️⃣ Kontrollerar Supabase-kvot...')
  
  const hasSupabaseConfig = process.env.SUPABASE_MANAGEMENT_TOKEN && process.env.SUPABASE_ORGANIZATION_ID
  
  if (hasSupabaseConfig) {
    try {
      const prisma = await getPrisma()
      const supabase = getSupabaseManagement()
      const projects = await supabase.listProjects()
      
      // Supabase free tier = 2 projekt
      if (projects.length >= 2) {
        issues.push({
          type: 'warning',
          code: 'SUPABASE_QUOTA_LIMIT',
          message: `Supabase-kvot nådd (${projects.length}/2 projekt). Systemet kommer använda poolad databas.`,
          details: { currentProjects: projects.length, limit: 2 }
        })
        
        suggestions.push('Uppgradera Supabase-kontot för fler projekt')
        suggestions.push('Ta bort oanvända Supabase-projekt')
      }
    } catch (error) {
      issues.push({
        type: 'warning',
        code: 'SUPABASE_CHECK_FAILED',
        message: 'Kunde inte kontrollera Supabase-kvot',
        details: { error: error.message }
      })
    }
  } else {
    issues.push({
      type: 'warning',
      code: 'NO_SUPABASE_CONFIG',
      message: 'Supabase Management API inte konfigurerad. Poolade databaser kommer användas.'
    })
  }
  
  // 3. Kontrollera poolade databaser
  console.log('3️⃣ Kontrollerar tillgängliga databaser...')
  
  const poolDatabases = [
    process.env.DATABASE_URL_POOL_1,
    process.env.DATABASE_URL_POOL_2,
  ].filter(Boolean)
  
  if (!hasSupabaseConfig && poolDatabases.length === 0) {
    issues.push({
      type: 'error',
      code: 'NO_DATABASE_PROVISIONING',
      message: 'Ingen databasprovisionering tillgänglig. Konfigurera Supabase eller poolade databaser.'
    })
  }
  
  // Kontrollera vilka poolade databaser som är lediga
  if (poolDatabases.length > 0) {
    const assignedDatabases = await prisma.orchestra.findMany({
      where: { databaseUrl: { not: null } },
      select: { databaseUrl: true, name: true }
    })
    
    const assignedUrls = assignedDatabases.map(o => o.databaseUrl)
    const availablePoolDbs = poolDatabases.filter(db => !assignedUrls.includes(db))
    
    if (availablePoolDbs.length === 0 && !hasSupabaseConfig) {
      issues.push({
        type: 'error',
        code: 'NO_AVAILABLE_DATABASES',
        message: 'Alla poolade databaser är upptagna och Supabase är inte konfigurerat.'
      })
    } else if (availablePoolDbs.length === 1) {
      issues.push({
        type: 'warning',
        code: 'LOW_DATABASE_AVAILABILITY',
        message: `Endast ${availablePoolDbs.length} poolad databas tillgänglig.`
      })
      
      suggestions.push('Konfigurera fler poolade databaser i .env.local')
    }
  }
  
  // 4. Kontrollera databasisolering
  console.log('4️⃣ Verifierar databasisolering...')
  
  const orchestras = await prisma.orchestra.findMany({
    select: { name: true, databaseUrl: true }
  })
  
  // Gruppera per databas för att hitta delningar
  const dbMap = new Map<string, string[]>()
  
  for (const orch of orchestras) {
    if (orch.databaseUrl) {
      const projectId = orch.databaseUrl.match(/postgres\.(\w+):/)?.[1] || 'unknown'
      
      if (!dbMap.has(projectId)) {
        dbMap.set(projectId, [])
      }
      dbMap.get(projectId)!.push(orch.name)
    }
  }
  
  // Rapportera om någon databas delas
  for (const [db, orchNames] of dbMap) {
    if (orchNames.length > 1) {
      issues.push({
        type: 'error',
        code: 'DATABASE_SHARING_DETECTED',
        message: `KRITISKT: Databas ${db} delas av flera orkestrar!`,
        details: { sharedBy: orchNames }
      })
    }
  }
  
  // 5. Sammanställ resultat
  console.log('5️⃣ Sammanställer resultat...')
  
  const hasErrors = issues.some(i => i.type === 'error')
  
  return {
    canCreate: !hasErrors,
    issues,
    suggestions
  }
}

/**
 * Formatera preflight-resultat för visning
 */
export function formatPreflightResult(result: PreflightResult): string {
  let output = ''
  
  if (result.canCreate) {
    output += '✅ Alla kontroller godkända! Orkestern kan skapas.\n'
  } else {
    output += '❌ Orkestern kan INTE skapas. Åtgärda följande problem:\n'
  }
  
  if (result.issues.length > 0) {
    output += '\nProblem:\n'
    for (const issue of result.issues) {
      const icon = issue.type === 'error' ? '❌' : '⚠️'
      output += `${icon} ${issue.message}\n`
      if (issue.details) {
        output += `   Detaljer: ${JSON.stringify(issue.details)}\n`
      }
    }
  }
  
  if (result.suggestions.length > 0) {
    output += '\n💡 Förslag:\n'
    for (const suggestion of result.suggestions) {
      output += `• ${suggestion}\n`
    }
  }
  
  return output
}