'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  Circle, 
  Users, 
  Music, 
  Mail, 
  Sparkles,
  Upload,
  ArrowRight,
  ChevronRight,
  X
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  action?: () => void
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    fetchUserInfo()
    checkOnboardingStatus()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      if (response.ok) {
        const data = await response.json()
        setCompletedSteps(data.completedSteps || [])
        if (data.completed) {
          router.push('/admin')
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error)
    }
  }

  const markStepComplete = async (stepId: string) => {
    try {
      await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId })
      })
      
      setCompletedSteps([...completedSteps, stepId])
      
      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Failed to mark step complete:', error)
    }
  }

  const completeOnboarding = async () => {
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST'
      })
      router.push('/admin')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const steps: OnboardingStep[] = [
    {
      id: 'add_musicians',
      title: 'Lägg till musiker',
      description: 'Importera eller lägg till dina första musiker i systemet',
      icon: Users,
      completed: completedSteps.includes('add_musicians'),
      action: () => router.push('/admin/musicians/new')
    },
    {
      id: 'create_instruments',
      title: 'Konfigurera instrument',
      description: 'Granska och anpassa instrumentlistan för din orkester',
      icon: Music,
      completed: completedSteps.includes('create_instruments'),
      action: () => router.push('/admin/instruments')
    },
    {
      id: 'setup_emails',
      title: 'Anpassa e-postmallar',
      description: 'Personifiera mallarna för förfrågningar och bekräftelser',
      icon: Mail,
      completed: completedSteps.includes('setup_emails'),
      action: () => router.push('/admin/settings/email-templates')
    },
    {
      id: 'create_project',
      title: 'Skapa ditt första projekt',
      description: 'Testa systemet genom att skapa ett projekt',
      icon: Sparkles,
      completed: completedSteps.includes('create_project'),
      action: () => router.push('/admin/projects/new')
    }
  ]

  const progress = (completedSteps.length / steps.length) * 100

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Välkommen till StageSub, {userInfo?.firstName}! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Låt oss hjälpa dig komma igång med din orkesterhantering. 
              Det tar bara några minuter att konfigurera allt.
            </p>

            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">Vad vi kommer göra:</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Importera eller lägga till musiker</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Konfigurera instrument för din orkester</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Anpassa e-postmallar</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Skapa ditt första projekt</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  completeOnboarding()
                }}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Hoppa över
              </button>
              <button
                onClick={() => setShowWelcome(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Kom igång
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Kom igång med StageSub</h1>
            <button
              onClick={() => {
                if (confirm('Är du säker på att du vill hoppa över introduktionen?')) {
                  completeOnboarding()
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Din progress</span>
            <span className="text-sm font-medium text-gray-900">{completedSteps.length} av {steps.length} steg klara</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Steps sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Steg att slutföra</h2>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentStep === index ? 'bg-blue-50 border-2 border-blue-500' : 
                      step.completed ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 mr-3" />
                      )}
                      <span className={`font-medium ${
                        step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current step detail */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {currentStep < steps.length ? (
                <>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      {React.createElement(steps[currentStep].icon, { 
                        className: "w-6 h-6 text-blue-600" 
                      })}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {steps[currentStep].title}
                      </h3>
                      <p className="text-gray-600">
                        Steg {currentStep + 1} av {steps.length}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-8">
                    {steps[currentStep].description}
                  </p>

                  {/* Special content for musician import */}
                  {steps[currentStep].id === 'add_musicians' && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                      <h4 className="font-medium text-gray-900 mb-4">Välj hur du vill lägga till musiker:</h4>
                      <div className="space-y-4">
                        <button
                          onClick={() => router.push('/admin/musicians/import')}
                          className="w-full text-left p-4 bg-white rounded-lg border hover:border-blue-500 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Upload className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="font-medium text-gray-900">Importera från fil</p>
                                <p className="text-sm text-gray-600">Ladda upp CSV eller Excel-fil</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            markStepComplete(steps[currentStep].id)
                            steps[currentStep].action?.()
                          }}
                          className="w-full text-left p-4 bg-white rounded-lg border hover:border-blue-500 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="font-medium text-gray-900">Lägg till manuellt</p>
                                <p className="text-sm text-gray-600">Skapa musiker en åt gången</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {currentStep > 0 && (
                      <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Föregående
                      </button>
                    )}
                    
                    <div className="ml-auto flex gap-4">
                      {!steps[currentStep].completed && (
                        <button
                          onClick={() => markStepComplete(steps[currentStep].id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Hoppa över detta steg
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          markStepComplete(steps[currentStep].id)
                          steps[currentStep].action?.()
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        {steps[currentStep].id === 'add_musicians' ? 'Välj metod' : 'Gå till steg'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* All steps completed */
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Grattis! Du är klar! 🎉
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Du har slutfört alla introduktionssteg och är redo att börja använda StageSub.
                  </p>
                  <button
                    onClick={completeOnboarding}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Gå till Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react'