'use client'

interface StrategyTooltipProps {
  strategy: string
}

export default function StrategyTooltip({ strategy }: StrategyTooltipProps) {
  const getExplanation = () => {
    switch (strategy) {
      case 'sequential':
        return (
          <div>
            <div className="font-semibold mb-1">Sekventiell strategi</div>
            <div className="text-xs leading-relaxed opacity-90">
              Skickar förfrågan till en musiker åt gången. Väntar på svar innan nästa musiker kontaktas.
            </div>
          </div>
        )
      case 'parallel':
        return (
          <div>
            <div className="font-semibold mb-1">Parallell strategi</div>
            <div className="text-xs leading-relaxed opacity-90">
              Skickar förfrågningar till flera musiker samtidigt. Antalet aktiva förfrågningar = antal positioner som behövs.
            </div>
          </div>
        )
      case 'first_come':
        return (
          <div>
            <div className="font-semibold mb-1">Först till kvarn</div>
            <div className="text-xs leading-relaxed opacity-90">
              Skickar förfrågan till ett visst antal musiker samtidigt. De första som accepterar får positionerna.
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-56">
      {getExplanation()}
    </div>
  )
}