export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Inställningar</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Systemkonfiguration</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700">E-postkonfiguration</h3>
            <p className="text-sm text-gray-600 mt-1">Provider: Resend</p>
            <p className="text-sm text-gray-600">Domän: stagesub.com</p>
            <p className="text-sm text-gray-600">Från-adress: no-reply@stagesub.com</p>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700">Databasarkitektur</h3>
            <p className="text-sm text-gray-600 mt-1">Typ: Separata databaser per kund</p>
            <p className="text-sm text-gray-600">Routing: Subdomän-baserad</p>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700">Säkerhet</h3>
            <p className="text-sm text-gray-600 mt-1">Admin-lösenord: Konfigurerat</p>
            <p className="text-sm text-gray-600">Superadmin-lösenord: Konfigurerat</p>
            <p className="text-sm text-gray-600">JWT-sessioner: 24 timmar</p>
          </div>
        </div>
      </div>
    </div>
  )
}