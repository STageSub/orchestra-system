import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900">StageSub</h1>
            </Link>
            <span className="ml-3 text-sm text-gray-500">Orchestra Management System</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/#features" className="text-gray-600 hover:text-gray-900">
              Funktioner
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Prissättning
            </Link>
            <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">
              Logga in
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Kom igång
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}