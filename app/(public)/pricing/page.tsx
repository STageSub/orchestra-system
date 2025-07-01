import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import PublicHeader from '@/components/public-header'

const plans = [
  {
    id: 'small_ensemble',
    name: 'Small Ensemble',
    price: 79,
    description: 'Perfekt för mindre ensembler och kammarorkestrar',
    features: [
      'Upp till 50 musiker',
      '5 aktiva projekt',
      '10 instrument',
      'E-postsupport',
      'Grundläggande rapporter',
      '30 dagars gratis prövotid'
    ],
    cta: 'Börja gratis prövotid',
    highlighted: false
  },
  {
    id: 'medium_ensemble',
    name: 'Medium Ensemble',
    price: 499,
    description: 'För regionala orkestrar och större ensembler',
    features: [
      'Upp till 200 musiker',
      '20 aktiva projekt',
      'Obegränsat med instrument',
      'Prioriterad e-postsupport',
      'Avancerade rapporter',
      'Egen subdomain',
      'Anpassad logotyp',
      '30 dagars gratis prövotid'
    ],
    cta: 'Börja gratis prövotid',
    highlighted: true
  },
  {
    id: 'institution',
    name: 'Institution',
    price: 1500,
    description: 'För nationalorkestrar och stora institutioner',
    features: [
      'Obegränsat antal musiker',
      'Obegränsat med projekt',
      'Obegränsat med instrument',
      'Dedikerad databas (valfritt)',
      'Full anpassning',
      'API-åtkomst',
      'Prioriterad support (4h)',
      'Dedikerad account manager',
      'Fakturering tillgänglig'
    ],
    cta: 'Kontakta oss',
    highlighted: false
  }
]

export default function PricingPage() {
  return (
    <>
      <PublicHeader />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Enkel och transparent prissättning
            </h1>
            <p className="text-xl text-gray-600">
              Välj planen som passar din orkester bäst. Alla planer inkluderar 30 dagars gratis prövotid.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg ${
                  plan.highlighted
                    ? 'ring-2 ring-blue-600 shadow-xl'
                    : 'border border-gray-200'
                } bg-white p-8 relative`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 left-0 right-0 text-center">
                    <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Mest populär
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">/månad</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'institution' ? (
                  <Link
                    href="/contact"
                    className={`block text-center py-3 px-6 rounded-md font-medium ${
                      plan.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    href={`/signup?plan=${plan.id}`}
                    className={`block text-center py-3 px-6 rounded-md font-medium ${
                      plan.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vanliga frågor
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kan jag byta plan senare?
                </h3>
                <p className="text-gray-600">
                  Absolut! Du kan uppgradera eller nedgradera din plan när som helst. 
                  Ändringar träder i kraft vid nästa faktureringsperiod.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Vad händer efter prövotiden?
                </h3>
                <p className="text-gray-600">
                  Efter 30 dagar börjar din valda prenumeration automatiskt. 
                  Du får en påminnelse innan prövotiden löper ut och kan avsluta när som helst.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Behöver jag kreditkort för prövotiden?
                </h3>
                <p className="text-gray-600">
                  Nej, du behöver inget kreditkort för att starta din gratis prövotid. 
                  Vi ber endast om betalningsuppgifter när du väljer att fortsätta efter prövotiden.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kan jag få hjälp med att migrera från vårt nuvarande system?
                </h3>
                <p className="text-gray-600">
                  Ja! Vi hjälper gärna till med att importera dina musiker och data från ditt 
                  befintliga system. Kontakta oss så ordnar vi det.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <div className="bg-gray-50 rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Redo att komma igång?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Starta din 30 dagars gratis prövotid idag. Inget kreditkort krävs.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 group"
              >
                Kom igång gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}