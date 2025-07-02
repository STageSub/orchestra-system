'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

const PLAN_DETAILS = {
  small_ensemble: {
    name: 'Small Ensemble',
    price: 79,
    features: ['50 musiker', '5 projekt', '10 instrument']
  },
  medium_ensemble: {
    name: 'Medium Ensemble', 
    price: 499,
    features: ['200 musiker', '20 projekt', 'Obegränsat instrument']
  },
  institution: {
    name: 'Institution',
    price: 1500,
    features: ['Obegränsat', 'Dedikerad databas', 'Prioriterad support']
  }
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan') || 'medium_ensemble'
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form data
  const [formData, setFormData] = useState({
    // Organization info
    organizationName: '',
    subdomain: '',
    plan: selectedPlan,
    
    // Admin user info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Contact info
    phone: '',
    acceptTerms: false
  })

  // Check subdomain availability
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  
  useEffect(() => {
    if (formData.subdomain.length > 2) {
      const timer = setTimeout(() => {
        checkSubdomainAvailability()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.subdomain])

  const checkSubdomainAvailability = async () => {
    setSubdomainStatus('checking')
    try {
      const response = await fetch(`/api/public/check-subdomain?subdomain=${formData.subdomain}`)
      const data = await response.json()
      setSubdomainStatus(data.available ? 'available' : 'taken')
    } catch (error) {
      console.error('Subdomain check failed:', error)
      setSubdomainStatus('idle')
    }
  }

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {}
    
    if (stepNumber === 1) {
      if (!formData.organizationName) newErrors.organizationName = 'Organisationsnamn krävs'
      if (!formData.subdomain) newErrors.subdomain = 'Subdomain krävs'
      if (subdomainStatus === 'taken') newErrors.subdomain = 'Denna subdomain är redan tagen'
      if (!/^[a-z0-9-]+$/.test(formData.subdomain)) newErrors.subdomain = 'Endast små bokstäver, siffror och bindestreck'
    }
    
    if (stepNumber === 2) {
      if (!formData.firstName) newErrors.firstName = 'Förnamn krävs'
      if (!formData.lastName) newErrors.lastName = 'Efternamn krävs'
      if (!formData.email) newErrors.email = 'E-post krävs'
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Ogiltig e-postadress'
      if (!formData.password) newErrors.password = 'Lösenord krävs'
      if (formData.password.length < 8) newErrors.password = 'Lösenord måste vara minst 8 tecken'
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Lösenorden matchar inte'
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Du måste acceptera villkoren'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/public/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const data = await response.json()
        // Redirect to verification page
        router.push(`/signup/verify?email=${encodeURIComponent(formData.email)}`)
      } else {
        const error = await response.json()
        setErrors({ general: error.message || 'Något gick fel' })
      }
    } catch (error) {
      setErrors({ general: 'Kunde inte skapa konto. Försök igen.' })
    } finally {
      setIsLoading(false)
    }
  }

  const planDetails = PLAN_DETAILS[formData.plan as keyof typeof PLAN_DETAILS]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Link>
        
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Skapa ditt StageSub-konto
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          30 dagars gratis prövotid • Inget kreditkort krävs
        </p>
        
        {/* Progress indicator */}
        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Selected plan */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-900">Vald plan</p>
                <p className="text-lg font-semibold text-blue-900">{planDetails.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">${planDetails.price}</p>
                <p className="text-sm text-blue-700">/månad</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {planDetails.features.map((feature, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Organisationsinformation</h3>
              
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organisationsnamn
                </label>
                <input
                  type="text"
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                    errors.organizationName ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Göteborgs Symfoniker"
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
                )}
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Välj din subdomain
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    className={`flex-1 px-3 py-2 border ${
                      errors.subdomain ? 'border-red-300' : 'border-gray-300'
                    } rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="goteborg"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    .stagesub.com
                  </span>
                </div>
                {errors.subdomain && (
                  <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
                )}
                {subdomainStatus === 'checking' && (
                  <p className="mt-1 text-sm text-gray-500">Kontrollerar tillgänglighet...</p>
                )}
                {subdomainStatus === 'available' && (
                  <p className="mt-1 text-sm text-green-600">✓ Tillgänglig!</p>
                )}
                {subdomainStatus === 'taken' && (
                  <p className="mt-1 text-sm text-red-600">✗ Redan tagen, välj en annan</p>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={subdomainStatus === 'checking'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
                >
                  Nästa
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Administratörskonto</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Förnamn
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Efternamn
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-postadress
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefon (valfritt)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Lösenord
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Bekräfta lösenord
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                  Jag accepterar{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    användarvillkoren
                  </Link>{' '}
                  och{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    integritetspolicyn
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tillbaka
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Skapar konto...
                    </>
                  ) : (
                    'Skapa konto'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}