'use client'

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { 
  Clock, 
  Users, 
  Music, 
  CheckCircle, 
  Star, 
  Shield, 
  BarChart3, 
  Send,
  Menu,
  X,
  ArrowRight,
  Mail,
  ChevronDown
} from "lucide-react"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [activeScenario, setActiveScenario] = useState(2)

  useEffect(() => {
    setIsVisible(true)
    
    const handleScroll = () => {
      const header = document.getElementById('header')
      if (window.scrollY > 50) {
        header?.classList.add('shadow-md')
        header?.classList.add('bg-white/95')
      } else {
        header?.classList.remove('shadow-md')
        header?.classList.remove('bg-white/95')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header - Premium feel */}
      <header id="header" className="fixed top-0 left-0 right-0 backdrop-blur-sm z-50 transition-all duration-300 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            {/* Empty div to push navigation to the right */}
            <div></div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-[#D4AF37] transition-colors font-light">
                Funktioner
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-[#D4AF37] transition-colors font-light">
                Hur det fungerar
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-[#D4AF37] transition-colors font-light">
                Prissättning
              </button>
              <Link 
                href="/admin" 
                className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-full hover:bg-[#B8941F] transition-all duration-300 font-medium shadow-lg shadow-[#D4AF37]/20"
              >
                Logga in
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-700 hover:text-[#D4AF37] py-2 font-light">
                Funktioner
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-gray-700 hover:text-[#D4AF37] py-2 font-light">
                Hur det fungerar
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-gray-700 hover:text-[#D4AF37] py-2 font-light">
                Prissättning
              </button>
              <Link 
                href="/admin" 
                className="block w-full text-center px-6 py-3 bg-[#D4AF37] text-white rounded-full hover:bg-[#B8941F] transition-colors font-medium mt-4"
              >
                Logga in
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Elegant with Logo */}
      <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-[#D4AF37]/5" />
        </div>
        
        <div className="max-w-7xl mx-auto w-full">
          {/* Logo at top - MUCH Larger */}
          <div className={`text-center mb-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <Image 
              src="/stagesub-logo-white.png" 
              alt="StageSub" 
              width={800} 
              height={320}
              className="h-56 md:h-64 lg:h-80 xl:h-96 w-auto mx-auto opacity-90"
              priority
            />
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-4 transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              Hitta rätt vikarie.
              <span className="block text-[#D4AF37] font-normal mt-1">Varje gång.</span>
            </h1>
            <p className={`text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-light leading-relaxed transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              Den intelligenta lösningen för professionella orkestrar. 
              Automatisera vikariehanteringen och fokusera på musiken.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <button 
                onClick={() => scrollToSection('demo')}
                className="group px-8 py-4 bg-[#D4AF37] text-white rounded-full hover:bg-[#B8941F] transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl shadow-[#D4AF37]/25 hover:shadow-2xl"
              >
                Boka Demo
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="px-8 py-4 bg-white text-gray-900 rounded-full border-2 border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300 font-medium text-lg"
              >
                Se Prissättning
              </button>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Problem Section - Clean design */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-center mb-20 text-gray-800">
            Hur många timmar lägger din orkester på att...
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              "Ringa runt till vikarier?",
              "Hålla koll på vem som tackat ja eller nej?",
              "Skicka ut noter och information?",
              "Hantera sena återbud?"
            ].map((problem, index) => (
              <div key={index} className="text-center group">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-100 transition-colors duration-300">
                  <X className="w-12 h-12 text-red-400" />
                </div>
                <p className="text-lg text-gray-700 font-light">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section - Elegant */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-8 py-4 bg-[#D4AF37]/10 rounded-full mb-10">
            <p className="text-6xl md:text-7xl font-extralight text-[#D4AF37] mb-2">90%</p>
            <p className="text-lg font-medium text-gray-700">tidsbesparing</p>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-8 text-gray-800">
            StageSub automatiserar hela vikarieprocessen
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-16 font-light leading-relaxed">
            Från första kontakten till notdistribution - allt sker automatiskt 
            baserat på dina preferenser och rankningslistor.
          </p>
          
          <div className="grid md:grid-cols-3 gap-12 mt-20">
            <div className="text-center group">
              <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D4AF37]/20 transition-all duration-300 group-hover:scale-110">
                <Clock className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-800">Spara tid</h3>
              <p className="text-gray-600 font-light">Automatiska förfrågningar enligt dina regler</p>
            </div>
            <div className="text-center group">
              <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D4AF37]/20 transition-all duration-300 group-hover:scale-110">
                <Users className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-800">Rätt kompetens</h3>
              <p className="text-gray-600 font-light">Rankningslistor säkerställer kvalitet</p>
            </div>
            <div className="text-center group">
              <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D4AF37]/20 transition-all duration-300 group-hover:scale-110">
                <Music className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-800">Digital distribution</h3>
              <p className="text-gray-600 font-light">Noter skickas automatiskt vid bekräftelse</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium feel */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-6 text-gray-800">
            Kraftfulla funktioner
          </h2>
          <p className="text-xl text-gray-600 text-center mb-20 max-w-3xl mx-auto font-light">
            Allt du behöver för effektiv vikariehantering, samlat i ett intelligent system
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: <Star className="w-10 h-10" />,
                title: "Smart Rankningssystem",
                description: "A/B/C-listor per instrument för att alltid få rätt kompetens"
              },
              {
                icon: <Send className="w-10 h-10" />,
                title: "Intelligenta Strategier",
                description: "Sequential, Parallel eller First-come - välj vad som passar bäst"
              },
              {
                icon: <Music className="w-10 h-10" />,
                title: "Automatisk Notdistribution",
                description: "Rätt filer till rätt person vid rätt tillfälle"
              },
              {
                icon: <BarChart3 className="w-10 h-10" />,
                title: "Realtidsövervakning",
                description: "Se status för varje förfrågan och projekt i realtid"
              },
              {
                icon: <Shield className="w-10 h-10" />,
                title: "Säker Musikerportal",
                description: "Professionell hantering av svar och kommunikation"
              },
              {
                icon: <CheckCircle className="w-10 h-10" />,
                title: "Omfattande Statistik",
                description: "Data och insikter för bättre beslut"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 font-light leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section - Clean steps */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-20 text-gray-800">
            Så enkelt fungerar det
          </h2>
          
          <div className="grid md:grid-cols-4 gap-10">
            {[
              {
                step: "1",
                title: "Skapa projekt",
                description: "Lägg in konsert eller repetition med datum och behov"
              },
              {
                step: "2",
                title: "Välj musiker",
                description: "Systemet väljer från dina rankningslistor"
              },
              {
                step: "3",
                title: "Skicka förfrågningar",
                description: "Automatiska mail enligt din valda strategi"
              },
              {
                step: "4",
                title: "Få bekräftelser",
                description: "Musiker svarar och får noter automatiskt"
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative group">
                <div className="w-20 h-20 bg-[#D4AF37] text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-light group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{item.title}</h3>
                <p className="text-gray-600 font-light">{item.description}</p>
                {index < 3 && (
                  <ArrowRight className="hidden md:block absolute top-10 -right-5 w-10 h-10 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Example Section - Compelling scenario */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-6 text-gray-800">
            Ett verkligt exempel
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto font-light">
            Se hur StageSub löser en av de vanligaste utmaningarna
          </p>
          
          {/* Scenario Tabs */}
          <div className="flex flex-col items-center mb-10 space-y-4">
            <div className="inline-flex bg-gray-100 rounded-full p-1.5">
              {[
                { id: 1, name: 'Kvalitet först', strategy: 'Sequential', time: '3-5 dagar', desc: 'När varje plats är viktig' },
                { id: 2, name: 'Effektiv', strategy: 'Parallel', time: '12-24h', desc: 'REKOMMENDERAD', highlight: true },
                { id: 3, name: 'Snabbt', strategy: 'First Come', time: '1-3h', desc: 'När tiden är knapp' }
              ].map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenario(scenario.id)}
                  className={`px-8 py-4 rounded-full font-medium transition-all duration-300 relative ${
                    activeScenario === scenario.id
                      ? 'bg-white text-gray-900 shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {scenario.highlight && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      ⭐
                    </span>
                  )}
                  <div className="text-base">{scenario.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{scenario.strategy} • {scenario.time}</div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 font-light">
              {activeScenario === 1 && "Respekterar rankningsordningen - kontaktar en musiker i taget för bästa möjliga ensemble"}
              {activeScenario === 2 && "Håller flera förfrågningar aktiva samtidigt - 95% fyllt inom 24 timmar"}
              {activeScenario === 3 && "Alla får förfrågan samtidigt - de snabbaste får platsen"}
            </p>
          </div>
          
          {/* Scenario Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] p-8 text-white">
              <h3 className="text-2xl font-medium mb-2">Behöver 3 violinister till nästa veckas konsert</h3>
              <p className="text-white/90 font-light">Mahlers symfoni nr 5 - repetitioner startar om 6 dagar</p>
            </div>
            
            <div className="p-10">
              {activeScenario === 1 && (
                <>
                  {/* Scenario 1: Sequential Strategy */}
                  <div className="grid md:grid-cols-2 gap-10 mb-12">
                {/* Before */}
                <div className="relative">
                  <div className="absolute -top-4 left-6 bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-medium">
                    Förr - Manuellt arbete
                  </div>
                  <div className="border-2 border-red-200 rounded-2xl p-8 bg-red-50/30">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 font-semibold">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Ring Anna</p>
                          <p className="text-sm text-gray-600">"Tyvärr, har redan annat..."</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 font-semibold">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Ring Erik</p>
                          <p className="text-sm text-gray-600">"Kan du ringa imorgon?"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 font-semibold">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Ring Maria</p>
                          <p className="text-sm text-gray-600">"Jag återkommer..."</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 font-semibold">4</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Ring Jonas, Sofia, Lars...</p>
                          <p className="text-sm text-gray-600">Dag 3, fortfarande 0/3 fyllda</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-red-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-semibold text-red-600">14</p>
                          <p className="text-sm text-gray-600">dagar</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-red-600">15+</p>
                          <p className="text-sm text-gray-600">samtal</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-red-600">∞</p>
                          <p className="text-sm text-gray-600">stress</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* After */}
                <div className="relative">
                  <div className="absolute -top-4 left-6 bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
                    Nu - Med StageSub
                  </div>
                  <div className="border-2 border-green-200 rounded-2xl p-8 bg-green-50/30">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-600 font-semibold">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Ett klick</p>
                          <p className="text-sm text-gray-600">Du trycker "Skicka"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-600 font-semibold">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Automatisk process</p>
                          <p className="text-sm text-gray-600">Systemet kontaktar musiker</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-600 font-semibold">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Svar kommer in</p>
                          <p className="text-sm text-gray-600">Musiker bekräftar direkt</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-600 font-semibold">4</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Klart!</p>
                          <p className="text-sm text-gray-600">Noter skickas automatiskt</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-green-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-semibold text-green-600">5</p>
                          <p className="text-sm text-gray-600">dagar</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-green-600">1</p>
                          <p className="text-sm text-gray-600">klick</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-green-600">100%</p>
                          <p className="text-sm text-gray-600">automatiskt</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline Visualization */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <h4 className="text-lg font-medium text-gray-800 mb-6 text-center">Så här går det till - Sequential strategi:</h4>
                
                {/* Visual Strategy Representation */}
                <div className="mb-8 p-6 bg-white rounded-xl">
                  <div className="flex justify-center items-center space-x-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mb-2">
                        <Send className="w-8 h-8 text-[#D4AF37]" />
                      </div>
                      <p className="text-xs text-gray-600">En musiker<br/>kontaktas</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Clock className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600">Väntar på<br/>svar</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600">Nästa om<br/>nej/timeout</p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-300"></div>
                  
                  {/* Timeline events */}
                  <div className="space-y-8">
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          0h
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="font-medium text-gray-800">Du trycker "Skicka förfrågningar"</p>
                        <p className="text-sm text-gray-600 mt-1">Systemet kontaktar Anna Lindström (rankad #1)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          12h
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="font-medium text-gray-800">Anna tackar nej - har redan bokningar</p>
                        <p className="text-sm text-gray-600 mt-1">Systemet kontaktar nu Erik Johansson (#2)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          24h
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="font-medium text-gray-800">Erik svarar inte inom 12h</p>
                        <p className="text-sm text-gray-600 mt-1">Timeout - systemet går vidare till Maria Berg (#3)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          36h
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="font-medium text-gray-800">Maria accepterar! 🎉</p>
                        <p className="text-sm text-gray-600 mt-1">1/3 platser fyllda. Systemet kontaktar Jonas Svensson (#4)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          5d
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="font-medium text-gray-800">Efter 7 musiker - Fullt bemannat!</p>
                        <p className="text-sm text-gray-600 mt-1">Maria, Jonas och Sofia har tackat ja. Klart efter 5 dagar.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Success metrics */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center justify-center space-x-8 p-6 bg-[#D4AF37]/10 rounded-2xl">
                  <div>
                    <p className="text-3xl font-semibold text-[#D4AF37]">5d</p>
                    <p className="text-sm text-gray-600">genomsnitt</p>
                  </div>
                  <div className="w-px h-12 bg-[#D4AF37]/30"></div>
                  <div>
                    <p className="text-3xl font-semibold text-[#D4AF37]">#1-3</p>
                    <p className="text-sm text-gray-600">högst rankade</p>
                  </div>
                  <div className="w-px h-12 bg-[#D4AF37]/30"></div>
                  <div>
                    <p className="text-3xl font-semibold text-[#D4AF37]">100%</p>
                    <p className="text-sm text-gray-600">respekterar hierarkin</p>
                  </div>
                </div>
              </div>
                </>
              )}

              {activeScenario === 2 && (
                <>
                  {/* Scenario 2: Parallel Strategy */}
                  <div className="grid md:grid-cols-2 gap-10 mb-12">
                    {/* Before */}
                    <div className="relative">
                      <div className="absolute -top-4 left-6 bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-medium">
                        Förr - Manuellt arbete
                      </div>
                      <div className="border-2 border-red-200 rounded-2xl p-8 bg-red-50/30">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">1</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ring Anna</p>
                              <p className="text-sm text-gray-600">"Tyvärr, redan bokat..."</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">2</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ring Erik</p>
                              <p className="text-sm text-gray-600">Telefonsvarare...</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">3</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ring Maria igen</p>
                              <p className="text-sm text-gray-600">"Fortfarande osäker..."</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">4</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ring Jonas, Sofia...</p>
                              <p className="text-sm text-gray-600">15+ samtal senare...</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-red-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-semibold text-red-600">2-3</p>
                              <p className="text-sm text-gray-600">dagar</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-red-600">15+</p>
                              <p className="text-sm text-gray-600">samtal</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-red-600">∞</p>
                              <p className="text-sm text-gray-600">stress</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* After */}
                    <div className="relative">
                      <div className="absolute -top-4 left-6 bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
                        Nu - Med StageSub
                      </div>
                      <div className="border-2 border-green-200 rounded-2xl p-8 bg-green-50/30">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">1</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ett klick</p>
                              <p className="text-sm text-gray-600">Starta processen</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">2</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Parallella förfrågningar</p>
                              <p className="text-sm text-gray-600">3 musiker kontaktas samtidigt</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">3</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Smart påfyllning</p>
                              <p className="text-sm text-gray-600">Vid nej - nästa automatiskt</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">4</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Snabbt klart!</p>
                              <p className="text-sm text-gray-600">Fullt bemannat på 12h</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-green-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-semibold text-green-600">12h</p>
                              <p className="text-sm text-gray-600">klart</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-green-600">1</p>
                              <p className="text-sm text-gray-600">klick</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-green-600">100%</p>
                              <p className="text-sm text-gray-600">automatiskt</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Visualization */}
                  <div className="bg-gray-50 rounded-2xl p-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-6 text-center">Så här går det till - Parallel strategi:</h4>
                    
                    {/* Visual Strategy Representation */}
                    <div className="mb-8 p-6 bg-white rounded-xl">
                      <div className="flex justify-center items-center space-x-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mb-2">
                            <Send className="w-8 h-8 text-[#D4AF37]" />
                          </div>
                          <p className="text-xs text-gray-600">3 förfrågningar<br/>skickas direkt</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-xs text-gray-600">Automatisk<br/>påfyllning</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="text-xs text-gray-600">3 bekräftade<br/>inom 12h</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-300"></div>
                      
                      {/* Timeline events */}
                      <div className="space-y-8">
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              0h
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Du trycker "Skicka förfrågningar"</p>
                            <p className="text-sm text-gray-600 mt-1">Systemet kontaktar Anna, Erik och Maria samtidigt (top 3)</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              3h
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Maria svarar snabbt - Accepterar! 🎉</p>
                            <p className="text-sm text-gray-600 mt-1">1/3 platser fyllda. Anna och Erik har inte svarat än.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              6h
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Erik accepterar också! 🎉</p>
                            <p className="text-sm text-gray-600 mt-1">2/3 fyllda. Anna tackar nej - systemet kontaktar Jonas (#4) automatiskt</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              12h
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Jonas accepterar - Fullt bemannat! 🎯</p>
                            <p className="text-sm text-gray-600 mt-1">Alla 3 platser fyllda på 12 timmar. Effektivt och smidigt!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success metrics */}
                  <div className="mt-10 text-center">
                    <div className="inline-flex items-center justify-center space-x-8 p-6 bg-[#D4AF37]/10 rounded-2xl">
                      <div>
                        <p className="text-3xl font-semibold text-[#D4AF37]">12h</p>
                        <p className="text-sm text-gray-600">fullt bemannat</p>
                      </div>
                      <div className="w-px h-12 bg-[#D4AF37]/30"></div>
                      <div>
                        <p className="text-3xl font-semibold text-[#D4AF37]">75%</p>
                        <p className="text-sm text-gray-600">acceptansgrad</p>
                      </div>
                      <div className="w-px h-12 bg-[#D4AF37]/30"></div>
                      <div>
                        <p className="text-3xl font-semibold text-[#D4AF37]">4</p>
                        <p className="text-sm text-gray-600">musiker kontaktade</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeScenario === 3 && (
                <>
                  {/* Scenario 3: First Come Strategy */}
                  <div className="grid md:grid-cols-2 gap-10 mb-12">
                    {/* Before */}
                    <div className="relative">
                      <div className="absolute -top-4 left-6 bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-medium">
                        Förr - Manuellt arbete
                      </div>
                      <div className="border-2 border-red-200 rounded-2xl p-8 bg-red-50/30">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">1</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Maila ut till alla</p>
                              <p className="text-sm text-gray-600">Vänta på svar...</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">2</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">3 svarar snabbt ja</p>
                              <p className="text-sm text-gray-600">Perfekt! Men vänta...</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">3</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">2 till svarar också ja</p>
                              <p className="text-sm text-gray-600">Nu har du 5 som vill!</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 font-semibold">4</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ring och avboka 2</p>
                              <p className="text-sm text-gray-600">Pinsamma samtal...</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-red-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-semibold text-red-600">∞</p>
                              <p className="text-sm text-gray-600">förvirring</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-red-600">5+</p>
                              <p className="text-sm text-gray-600">samtal</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-red-600">2</p>
                              <p className="text-sm text-gray-600">besvikna</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* After */}
                    <div className="relative">
                      <div className="absolute -top-4 left-6 bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
                        Nu - Med StageSub
                      </div>
                      <div className="border-2 border-green-200 rounded-2xl p-8 bg-green-50/30">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">1</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Ett klick</p>
                              <p className="text-sm text-gray-600">Skicka till alla</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">2</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Först till kvarn</p>
                              <p className="text-sm text-gray-600">De snabbaste får platsen</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">3</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Automatisk avisering</p>
                              <p className="text-sm text-gray-600">"Tyvärr fylld" till övriga</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 font-semibold">4</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Rekordsnabbt!</p>
                              <p className="text-sm text-gray-600">Klart på 90 minuter</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-green-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-semibold text-green-600">90</p>
                              <p className="text-sm text-gray-600">minuter</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-green-600">0</p>
                              <p className="text-sm text-gray-600">konflikter</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold text-green-600">100%</p>
                              <p className="text-sm text-gray-600">automatiskt</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Visualization */}
                  <div className="bg-gray-50 rounded-2xl p-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-6 text-center">Så här går det till - First Come strategi:</h4>
                    
                    {/* Visual Strategy Representation */}
                    <div className="mb-8 p-6 bg-white rounded-xl">
                      <div className="flex justify-center items-center space-x-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mb-2">
                            <Send className="w-8 h-8 text-[#D4AF37]" />
                          </div>
                          <p className="text-xs text-gray-600">Skicka till<br/>5 musiker</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                            <Clock className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-xs text-gray-600">Först till kvarn<br/>gäller</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="text-xs text-gray-600">Automatisk<br/>avisering</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-300"></div>
                      
                      {/* Timeline events */}
                      <div className="space-y-8">
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              0h
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Du trycker "Skicka förfrågningar"</p>
                            <p className="text-sm text-gray-600 mt-1">Anna, Erik, Maria, Jonas och Sofia får förfrågan samtidigt</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              45min
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Maria svarar snabbt - JA! 🎉</p>
                            <p className="text-sm text-gray-600 mt-1">"Perfekt, jag är ledig!" 1/3 platser fyllda.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              1.5h
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Jonas och Anna accepterar också!</p>
                            <p className="text-sm text-gray-600 mt-1">3/3 platser fyllda! Erik och Sofia får automatiskt besked att tjänsten är tillsatt.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                              ✓
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="font-medium text-gray-800">Klart på 90 minuter! ⚡</p>
                            <p className="text-sm text-gray-600 mt-1">Snabbast möjliga bemanning - ingen väntan, inga uppföljningssamtal.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success metrics */}
                  <div className="mt-10 text-center">
                    <div className="inline-flex items-center justify-center space-x-8 p-6 bg-[#D4AF37]/10 rounded-2xl">
                      <div>
                        <p className="text-3xl font-semibold text-[#D4AF37]">90min</p>
                        <p className="text-sm text-gray-600">rekordsnabbt</p>
                      </div>
                      <div className="w-px h-12 bg-[#D4AF37]/30"></div>
                      <div>
                        <p className="text-3xl font-semibold text-[#D4AF37]">0</p>
                        <p className="text-sm text-gray-600">manuell hantering</p>
                      </div>
                      <div className="w-px h-12 bg-[#D4AF37]/30"></div>
                      <div>
                        <p className="text-3xl font-semibold text-[#D4AF37]">100%</p>
                        <p className="text-sm text-gray-600">transparent</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-xl text-gray-700 mb-6 font-light">
              Sluta jaga vikarier. Låt systemet göra jobbet.
            </p>
            <button 
              onClick={() => scrollToSection('demo')}
              className="group px-10 py-4 bg-[#D4AF37] text-white rounded-full hover:bg-[#B8941F] transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl shadow-[#D4AF37]/25 hover:shadow-2xl"
            >
              Spara 90% av din tid - Starta idag
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonial Section - Elegant */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center space-x-1 mb-10">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-7 h-7 fill-[#D4AF37] text-[#D4AF37]" />
            ))}
          </div>
          <blockquote className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-700 mb-10 leading-relaxed">
            "StageSub har revolutionerat hur vi arbetar. 
            Det som tidigare tog dagar tar nu minuter."
          </blockquote>
          <cite className="text-lg text-gray-600 not-italic font-light">
            Anna Lindberg, Orkesterchef
          </cite>
        </div>
      </section>

      {/* Pricing Section - Clean layout */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-6 text-gray-800">
            Välj rätt plan för din orkester
          </h2>
          <p className="text-xl text-gray-600 text-center mb-20 max-w-3xl mx-auto font-light">
            Transparent prissättning utan dolda kostnader
          </p>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                name: "Sommarfestivaler",
                price: "499 kr",
                period: "/månad",
                description: "För ensembler & festivaler",
                features: [
                  "Upp till 25 musiker",
                  "3 aktiva projekt",
                  "Grundläggande statistik",
                  "Email-support"
                ],
                cta: "Kom igång",
                highlight: false
              },
              {
                name: "Professional",
                price: "2999 kr",
                period: "/månad",
                description: "För små ensembler",
                features: [
                  "Upp till 50 musiker",
                  "12 aktiva projekt",
                  "Avancerad statistik",
                  "Prioriterad support"
                ],
                cta: "Starta gratis test",
                highlight: true
              },
              {
                name: "Institution",
                price: "Kontakta oss",
                description: "För stora institutioner",
                features: [
                  "Obegränsat antal musiker",
                  "White label",
                  "SLA och dedikerad support",
                  "Anpassningar",
                  "Anpassade mallar",
                  "Utbildning ingår"
                ],
                cta: "Kontakta oss",
                highlight: false
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl p-10 transition-all duration-300 ${
                  plan.highlight 
                    ? 'ring-2 ring-[#D4AF37] shadow-2xl scale-105 hover:scale-110' 
                    : 'border border-gray-200 hover:shadow-xl hover:scale-105'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-5 left-0 right-0 text-center">
                    <span className="bg-[#D4AF37] text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                      Mest populär
                    </span>
                  </div>
                )}
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800">{plan.name}</h3>
                  <p className="text-gray-600 mb-6 font-light">{plan.description}</p>
                  <div className="text-5xl font-light text-gray-800">
                    {plan.price}
                    {plan.period && <span className="text-lg text-gray-600 font-normal">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full py-3 rounded-full font-medium transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-[#D4AF37] text-white hover:bg-[#B8941F] shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium feel */}
      <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-6">
            Redo att effektivisera din orkester?
          </h2>
          <p className="text-xl text-gray-300 mb-12 font-light">
            Kom igång på några minuter. Ingen kreditkort krävs.
          </p>
          
          <form className="max-w-md mx-auto" onSubmit={(e) => {
            e.preventDefault()
            alert(`Demo bokad för: ${email}`)
          }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  className="w-full pl-12 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-[#D4AF37] text-white rounded-full hover:bg-[#B8941F] transition-all duration-300 font-medium shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Starta Gratis Test
              </button>
            </div>
          </form>
          
          <p className="mt-8 text-sm text-gray-400 font-light">
            14 dagars gratis testperiod • Ingen bindningstid • Avsluta när som helst
          </p>
        </div>
      </section>

      {/* Footer - Clean and elegant */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Image 
                src="/stagesub-logo-white.png" 
                alt="StageSub" 
                width={160} 
                height={64}
                className="h-14 w-auto"
              />
              <p className="text-sm text-gray-600 mt-3 font-light">
                © 2025 StageSub. Alla rättigheter förbehållna.
              </p>
            </div>
            <div className="flex space-x-8 text-sm text-gray-600 font-light">
              <a href="#" className="hover:text-[#D4AF37] transition-colors">Integritetspolicy</a>
              <a href="#" className="hover:text-[#D4AF37] transition-colors">Villkor</a>
              <a href="#" className="hover:text-[#D4AF37] transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}