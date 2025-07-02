'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [subdomain, setSubdomain] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verifieringslänk saknas')
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/public/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setSubdomain(data.subdomain)
        // Redirect to tenant login after 3 seconds
        setTimeout(() => {
          window.location.href = `https://${data.subdomain}.stagesub.com/admin/login`
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verifiering misslyckades')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Ett fel uppstod vid verifiering')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">
                Verifierar din e-postadress...
              </h2>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                E-post verifierad!
              </h2>
              <p className="text-gray-600 mb-6">
                Ditt konto har aktiverats. Du omdirigeras till inloggningssidan...
              </p>
              <p className="text-sm text-gray-500">
                Om du inte omdirigeras automatiskt, klicka{' '}
                <a 
                  href={`https://${subdomain}.stagesub.com/admin/login`}
                  className="text-blue-600 hover:text-blue-500"
                >
                  här
                </a>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verifiering misslyckades
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <Link 
                href="/signup"
                className="text-blue-600 hover:text-blue-500"
              >
                Tillbaka till registrering
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifierar...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}