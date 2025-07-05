'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ToastContainer } from '@/components/toast'
import EventListener from '@/components/event-listener'
import { LogInitializer } from '@/components/log-initializer'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

const navigation = [
  { name: 'Översikt', href: '/admin' },
  { name: 'Projekt', href: '/admin/projects' },
  { name: 'Musiker', href: '/admin/musicians' },
  { name: 'Instrument', href: '/admin/instruments' },
  { name: 'Rankningar', href: '/admin/rankings' },
  { name: 'Gruppmail', href: '/admin/group-email' },
]

interface UserInfo {
  user: {
    id: string
    username: string
    email: string
    role: string
    orchestraId?: string
  }
  orchestra?: {
    id: string
    name: string
    orchestraId: string
    subdomain: string
    logoUrl?: string
    plan: string
    status: string
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch user info
  useEffect(() => {
    // Skip fetching user info on login page
    if (pathname === '/admin/login') {
      setLoadingUserInfo(false)
      return
    }

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          console.log('User info fetched:', data)
          setUserInfo(data)
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      } finally {
        setLoadingUserInfo(false)
      }
    }

    fetchUserInfo()
  }, [pathname])

  // Check if this is first time login
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        // Check if onboarding has been completed
        const hasCompletedOnboarding = localStorage.getItem('onboarding_completed')
        if (hasCompletedOnboarding) return

        // Check if there are any musicians or projects
        const [musiciansRes, projectsRes] = await Promise.all([
          fetch('/api/musicians'),
          fetch('/api/projects')
        ])

        if (musiciansRes.ok && projectsRes.ok) {
          const musicians = await musiciansRes.json()
          const projects = await projectsRes.json()

          // If no musicians and no projects, show onboarding
          if (musicians.length === 0 && projects.length === 0) {
            setShowOnboarding(true)
          }
        }
      } catch (error) {
        console.error('Failed to check first time user:', error)
      }
    }

    checkFirstTimeUser()
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setShowOnboarding(false)
    // Redirect to dashboard
    window.location.href = '/admin'
  }

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboarding_completed', 'skipped')
    setShowOnboarding(false)
  }


  // Return minimal layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
                {loadingUserInfo ? (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <>
                    {userInfo?.orchestra?.logoUrl && (
                      <img 
                        src={userInfo.orchestra.logoUrl} 
                        alt="" 
                        className="h-7 w-7 object-contain rounded"
                      />
                    )}
                    <span className="text-sm text-gray-900 font-semibold">
                      {userInfo ? `${userInfo.user.username} - ${userInfo.orchestra?.name || 'Admin'}` : 'Admin'}
                    </span>
                  </>
                )}
            </div>
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-light tracking-wider text-gray-900">
                StageSub
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Inställningar"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href="/admin/templates"
                        onClick={() => setShowSettings(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        E-postmallar
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setShowSettings(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Systeminställningar
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <Link
                        href="/admin/test-requests"
                        onClick={() => setShowSettings(false)}
                        className="block px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                      >
                        🧪 Test Requests (Dev)
                      </Link>
                      <Link
                        href="/admin/test-email"
                        onClick={() => setShowSettings(false)}
                        className="block px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                      >
                        📧 Test E-post
                      </Link>
                      <Link
                        href="/admin/logs"
                        onClick={() => setShowSettings(false)}
                        className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                      >
                        🔥 Logs (Dev)
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.href = '/admin/login'
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logga ut
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <nav className="w-48 bg-white shadow-sm border-r border-gray-200">
          <div className="p-4">
            {/* Logo Section */}
            <div className="mb-4 text-center border-b border-gray-200 pb-3">
              <img 
                src="/stagesub-logo-white.png" 
                alt="StageSub" 
                className="h-24 w-auto mx-auto"
              />
            </div>
            
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
      <EventListener />
      <LogInitializer />
      
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          orchestraName="Din Orkester"
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  )
}