'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function SignupVerifyPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Link>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Kontrollera din e-post!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Vi har skickat en verifieringslänk till:
            </p>
            
            <p className="text-lg font-medium text-gray-900 mb-6">
              {email}
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Klicka på länken i e-postmeddelandet för att aktivera ditt konto 
                och komma igång med din 30-dagars gratis prövotid.
              </p>
            </div>
            
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                <strong>Hittade du inte e-postmeddelandet?</strong>
              </p>
              <ul className="text-left list-disc list-inside space-y-2">
                <li>Kontrollera din skräppostmapp</li>
                <li>Lägg till no-reply@stagesub.com i din adressbok</li>
                <li>Vänta några minuter och kolla igen</li>
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Behöver du hjälp? Kontakta oss på{' '}
                <a href="mailto:support@stagesub.com" className="text-blue-600 hover:text-blue-500">
                  support@stagesub.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}