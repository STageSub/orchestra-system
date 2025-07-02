'use client'

import { CheckCircle, ArrowRight, BookOpen, Video, Mail } from 'lucide-react'
import Link from 'next/link'

interface CompleteStepProps {
  orchestraName: string
  onNext: () => void
  onSkip: () => void
}

export default function CompleteStep({ orchestraName, onNext }: CompleteStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Grattis! {orchestraName} är redo att användas
        </h1>
        <p className="text-lg text-gray-600">
          Du har slutfört grundinställningen. Här är några resurser för att hjälpa dig komma igång.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/musicians"
          className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors text-left"
        >
          <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Hantera musiker</h3>
          <p className="text-sm text-gray-600">
            Lägg till fler musiker och organisera dem
          </p>
        </Link>

        <Link
          href="/admin/projects"
          className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors text-left"
        >
          <Video className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Skapa projekt</h3>
          <p className="text-sm text-gray-600">
            Planera konserter och definiera behov
          </p>
        </Link>

        <a
          href="mailto:support@stagesub.com"
          className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors text-left"
        >
          <Mail className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Få support</h3>
          <p className="text-sm text-gray-600">
            Vi finns här om du behöver hjälp
          </p>
        </a>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
        <h3 className="font-semibold text-blue-900 mb-3">🎯 Nästa steg</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-semibold">1.</span>
            <span>Lägg till alla dina musiker (du kan importera från Excel)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">2.</span>
            <span>Skapa rankningslistor för olika instrument</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">3.</span>
            <span>Sätt upp ditt nästa projekt med musikerbehov</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">4.</span>
            <span>Skicka din första automatiska förfrågan!</span>
          </li>
        </ol>
      </div>

      <button
        onClick={onNext}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
      >
        Gå till Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}