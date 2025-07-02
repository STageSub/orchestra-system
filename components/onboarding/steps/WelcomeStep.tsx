'use client'

import { Users, Calendar, Send, Music } from 'lucide-react'

interface WelcomeStepProps {
  orchestraName: string
  onNext: () => void
  onSkip: () => void
}

export default function WelcomeStep({ orchestraName, onNext }: WelcomeStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Välkommen till StageSub, {orchestraName}!
        </h1>
        <p className="text-lg text-gray-600">
          Låt oss hjälpa dig komma igång på bara några minuter. 
          Vi guidar dig genom de viktigaste stegen för att sätta upp ditt system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Hantera musiker</h3>
          <p className="text-sm text-gray-600">
            Organisera alla dina musiker på ett ställe med kvalifikationer och kontaktinfo
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Planera projekt</h3>
          <p className="text-sm text-gray-600">
            Skapa projekt och definiera exakt vilka musiker du behöver
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Send className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Skicka förfrågningar</h3>
          <p className="text-sm text-gray-600">
            Kontakta rätt musiker automatiskt baserat på dina rankningslistor
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          <strong>Tips:</strong> Du kan när som helst hoppa över steg och komma tillbaka senare. 
          All funktionalitet finns tillgänglig från huvudmenyn.
        </p>
      </div>

      <button
        onClick={onNext}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
      >
        Kom igång
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}