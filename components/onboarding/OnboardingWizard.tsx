'use client'

import { useState } from 'react'
import { CheckCircle, Users, Calendar, Settings, ArrowRight, X } from 'lucide-react'
import WelcomeStep from './steps/WelcomeStep'
import AddMusiciansStep from './steps/AddMusiciansStep'
import CreateProjectStep from './steps/CreateProjectStep'
import SettingsStep from './steps/SettingsStep'
import CompleteStep from './steps/CompleteStep'

interface OnboardingWizardProps {
  orchestraName: string
  onComplete: () => void
  onSkip: () => void
}

export default function OnboardingWizard({ 
  orchestraName, 
  onComplete, 
  onSkip 
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps = [
    { 
      title: 'Välkommen', 
      icon: CheckCircle,
      component: WelcomeStep 
    },
    { 
      title: 'Lägg till musiker', 
      icon: Users,
      component: AddMusiciansStep 
    },
    { 
      title: 'Skapa projekt', 
      icon: Calendar,
      component: CreateProjectStep 
    },
    { 
      title: 'Anpassa inställningar', 
      icon: Settings,
      component: SettingsStep 
    },
    { 
      title: 'Klart!', 
      icon: CheckCircle,
      component: CompleteStep 
    }
  ]

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Kom igång med StageSub</h2>
            <button
              onClick={onSkip}
              className="text-white/80 hover:text-white"
              title="Hoppa över"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = completedSteps.includes(index)
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full
                      ${isActive ? 'bg-white text-blue-600' : 
                        isCompleted ? 'bg-green-500 text-white' : 
                        'bg-blue-500 text-blue-200'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-full h-1 mx-2
                        ${index < currentStep ? 'bg-green-500' : 'bg-blue-500'}
                      `} style={{ width: '60px' }} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <span 
                  key={index} 
                  className={`
                    text-xs
                    ${index === currentStep ? 'text-white font-semibold' : 'text-blue-200'}
                  `}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <CurrentStepComponent
            orchestraName={orchestraName}
            onNext={handleNext}
            onSkip={handleSkipStep}
          />
        </div>
      </div>
    </div>
  )
}