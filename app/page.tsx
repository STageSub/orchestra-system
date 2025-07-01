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
  ChevronDown,
  Globe,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
  Calendar,
  Bell
} from "lucide-react"

type Language = 'sv' | 'en'

interface TextContent {
  sv: {
    [key: string]: any
  }
  en: {
    [key: string]: any
  }
}

const content: TextContent = {
  sv: {
    nav: {
      features: "Funktioner",
      howItWorks: "Hur det fungerar",
      pricing: "Prissättning",
      login: "Logga in"
    },
    hero: {
      title: "Den intelligenta lösningen för professionella orkestrar.",
      subtitle: "Automatisera vikariehanteringen",
      description: "Spara tid, minska stress och få de bästa musikerna till varje framträdande.",
      cta: "Kom igång",
      demo: "Boka demo",
      stats: {
        musicians: "10,000+",
        musiciansLabel: "Musiker",
        orchestras: "50+",
        orchestrasLabel: "Orkestrar",
        requests: "100,000+",
        requestsLabel: "Förfrågningar"
      }
    },
    features: {
      title: "Allt du behöver för professionell vikariehantering",
      subtitle: "Kraftfulla funktioner som förenklar din vardag",
      realtime: {
        title: "Realtidsöversikt",
        desc: "Håll koll på alla förfrågningar, svar och bemanningsstatus i realtid. Se direkt vem som accepterat och vem som tackat nej."
      },
      strategies: {
        title: "Olika utskicksstrategier",
        desc: "Välj den som passar bäst. Anpassa hur förfrågningar skickas ut baserat på dina behov och tidsramar."
      },
      ranking: {
        title: "Smarta rankningslistor",
        desc: "Organisera musiker i A-, B- och C-listor för varje instrument. Systemet kontaktar automatiskt musiker i rätt ordning."
      },
      security: {
        title: "Säker datahantering",
        desc: "Integritet är vår högsta prioritet – vi följer GDPR och skyddar din data med största omsorg."
      }
    },
    howItWorks: {
      title: "Så enkelt fungerar det",
      subtitle: "Från behov till bemanning på några minuter",
      step1: {
        title: "Skapa projekt",
        desc: "Lägg upp konsert eller repetition med datum, repertoar och vilka musiker som behövs."
      },
      step2: {
        title: "Skicka förfrågningar",
        desc: "Välj utskicksstrategi och låt systemet automatiskt kontakta musiker enligt dina rankningslistor."
      },
      step3: {
        title: "Få svar direkt",
        desc: "Musiker svarar med ett klick. Du ser status i realtid och systemet fyller automatiskt alla platser."
      }
    },
    pricing: {
      title: "StageSub – Prisplaner",
      subtitle: "Välj rätt nivå för er ensemble, produktion eller institution",
      contact: "Kontakta oss om du är osäker på vad som passar dig!",
      microEnsemble: {
        name: "Micro Ensemble",
        icon: "🟪",
        price: "59",
        currency: "kr",
        period: "instrument/mån",
        capacity1: "1 aktivt projekt",
        capacity2: "25 musiker/instrument",
        suitedFor: "Små ensembler, kvartetter, körledare",
        cta: "Välj Micro"
      },
      smallEnsemble: {
        name: "Small Ensemble", 
        icon: "🟩",
        price: "690",
        priceYear: "6 900",
        discount: "17% rabatt",
        currency: "kr",
        period: "mån",
        periodYear: "år",
        popular: true,
        capacity1: "2 aktiva projekt",
        capacity2: "10 instrument (utbyggbart)",
        suitedFor: "Mindre ensembler med regelbunden verksamhet",
        cta: "Välj Small"
      },
      projectPass: {
        name: "Project Pass",
        icon: "🟦", 
        price: "1 490",
        currency: "kr",
        period: "projekt (60 dagar)",
        capacity1: "1 projekt",
        capacity2: "30 musiker",
        suitedFor: "Engångsproduktioner, festivaler, kyrkor",
        cta: "Välj Project Pass"
      },
      institution: {
        name: "Institution",
        icon: "🏛️",
        price: "Offert",
        currency: "",
        period: "",
        capacity1: "Obegränsat instrument, projekt, musiker",
        capacity2: "",
        suitedFor: "Stora orkestrar, operahus, institutioner",
        cta: "Kontakta oss"
      }
    },
    footer: {
      tagline: "Den intelligenta lösningen för professionella orkestrar",
      copyright: "© 2025 StageSub. Alla rättigheter förbehållna."
    }
  },
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      login: "Log in"
    },
    hero: {
      title: "The intelligent solution for professional orchestras.",
      subtitle: "Automate substitute management",
      description: "Save time, reduce stress, and get the best musicians for every performance.",
      cta: "Get started",
      demo: "Book a demo",
      stats: {
        musicians: "10,000+",
        musiciansLabel: "Musicians",
        orchestras: "50+",
        orchestrasLabel: "Orchestras",
        requests: "100,000+",
        requestsLabel: "Requests"
      }
    },
    features: {
      title: "Everything you need for professional substitute management",
      subtitle: "Powerful features that simplify your daily work",
      realtime: {
        title: "Real-time overview",
        desc: "Keep track of all requests, responses, and staffing status in real-time. See immediately who has accepted and who has declined."
      },
      strategies: {
        title: "Different dispatch strategies",
        desc: "Choose what suits you best. Customize how requests are sent based on your needs and timeframes."
      },
      ranking: {
        title: "Smart ranking lists",
        desc: "Organize musicians in A, B, and C lists for each instrument. The system automatically contacts musicians in the right order."
      },
      security: {
        title: "Secure data handling",
        desc: "Privacy is our highest priority – we follow GDPR and protect your data with the utmost care."
      }
    },
    howItWorks: {
      title: "How it works",
      subtitle: "From need to staffing in minutes",
      step1: {
        title: "Create project",
        desc: "Set up concert or rehearsal with dates, repertoire, and which musicians are needed."
      },
      step2: {
        title: "Send requests",
        desc: "Choose dispatch strategy and let the system automatically contact musicians according to your ranking lists."
      },
      step3: {
        title: "Get responses instantly",
        desc: "Musicians respond with one click. You see status in real-time and the system automatically fills all positions."
      }
    },
    pricing: {
      title: "StageSub – Pricing Plans",
      subtitle: "Choose the right level for your ensemble, production or institution",
      contact: "Contact us if you're unsure what suits you!",
      microEnsemble: {
        name: "Micro Ensemble",
        icon: "🟪",
        price: "59",
        currency: "SEK",
        period: "instrument/month",
        capacity1: "1 active project",
        capacity2: "25 musicians/instrument",
        suitedFor: "Small ensembles, quartets, choir conductors",
        cta: "Choose Micro"
      },
      smallEnsemble: {
        name: "Small Ensemble",
        icon: "🟩", 
        price: "690",
        priceYear: "6,900",
        discount: "17% discount",
        currency: "SEK",
        period: "month",
        periodYear: "year",
        popular: true,
        capacity1: "2 active projects",
        capacity2: "10 instruments (expandable)",
        suitedFor: "Smaller ensembles with regular activities",
        cta: "Choose Small"
      },
      projectPass: {
        name: "Project Pass",
        icon: "🟦",
        price: "1,490",
        currency: "SEK",
        period: "project (60 days)",
        capacity1: "1 project",
        capacity2: "30 musicians",
        suitedFor: "One-time productions, festivals, churches",
        cta: "Choose Project Pass"
      },
      institution: {
        name: "Institution",
        icon: "🏛️",
        price: "Quote",
        currency: "",
        period: "",
        capacity1: "Unlimited instruments, projects, musicians",
        capacity2: "",
        suitedFor: "Large orchestras, opera houses, institutions",
        cta: "Contact us"
      }
    },
    footer: {
      tagline: "The intelligent solution for professional orchestras",
      copyright: "© 2025 StageSub. All rights reserved."
    }
  }
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [activeScenario, setActiveScenario] = useState(2)
  const [language, setLanguage] = useState<Language>('sv')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem('preferredLanguage') as Language
    if (savedLang && (savedLang === 'sv' || savedLang === 'en')) {
      setLanguage(savedLang)
    }
    
    setIsVisible(true)
    
    const handleScroll = () => {
      setScrollY(window.scrollY)
      const header = document.getElementById('header')
      if (window.scrollY > 50) {
        header?.classList.add('shadow-lg')
        header?.classList.add('bg-white/90')
        header?.classList.add('backdrop-blur-xl')
      } else {
        header?.classList.remove('shadow-lg')
        header?.classList.remove('bg-white/90')
        header?.classList.remove('backdrop-blur-xl')
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

  const toggleLanguage = () => {
    const newLang = language === 'sv' ? 'en' : 'sv'
    setLanguage(newLang)
    localStorage.setItem('preferredLanguage', newLang)
  }

  const t = content[language]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 overflow-x-hidden">
      {/* Animated Background Elements - More subtle and professional */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-gradient-to-tl from-amber-100/30 to-orange-100/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Modern Glass Design */}
      <header id="header" className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Empty space where logo was */}
            <div></div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-indigo-600 transition-colors font-medium text-sm">
                {t.nav.features}
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-indigo-600 transition-colors font-medium text-sm">
                {t.nav.howItWorks}
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-indigo-600 transition-colors font-medium text-sm">
                {t.nav.pricing}
              </button>
              
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{language === 'sv' ? 'EN' : 'SV'}</span>
              </button>
              
              <Link 
                href="/admin" 
                className="relative px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
              >
                <span className="relative z-10">{t.nav.login}</span>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-indigo-600 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t shadow-2xl">
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2 font-medium">
                {t.nav.features}
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2 font-medium">
                {t.nav.howItWorks}
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2 font-medium">
                {t.nav.pricing}
              </button>
              
              <div className="pt-4 space-y-3">
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{language === 'sv' ? 'English' : 'Svenska'}</span>
                </button>
                
                <Link 
                  href="/admin" 
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full font-medium shadow-lg"
                >
                  {t.nav.login}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Clean and Professional */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Content */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              
              {/* Large StageSub Logo */}
              <div className="mb-12">
                <Image 
                  src="/stagesub-logo-white.png" 
                  alt="StageSub" 
                  width={400} 
                  height={120}
                  className="mx-auto h-24 md:h-32 lg:h-40 w-auto"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 max-w-5xl mx-auto">
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {t.hero.title}
                </span>
              </h1>
              <h2 className="text-2xl md:text-3xl font-light text-indigo-600 mb-6">
                {t.hero.subtitle}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                {t.hero.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link 
                  href="/signup"
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full text-lg font-medium shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    {t.hero.cta}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full text-lg font-medium hover:bg-white transition-all duration-300 shadow-xl border border-gray-200/50"
                >
                  {t.hero.demo}
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Features Section - Modern Cards with Hover Effects */}
      <section id="features" className="py-24 relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {t.features.title}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className={`group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.features.realtime.title}</h3>
                <p className="text-gray-600 leading-relaxed">{t.features.realtime.desc}</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={`group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '100ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.features.strategies.title}</h3>
                <p className="text-gray-600 leading-relaxed">{t.features.strategies.desc}</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={`group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.features.ranking.title}</h3>
                <p className="text-gray-600 leading-relaxed">{t.features.ranking.desc}</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className={`group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.features.security.title}</h3>
                <p className="text-gray-600 leading-relaxed">{t.features.security.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Modern Timeline */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {t.howItWorks.title}
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-blue-600 transform -translate-y-1/2 hidden md:block"></div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{t.howItWorks.step1.title}</h3>
                  <p className="text-gray-600 text-center">{t.howItWorks.step1.desc}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{t.howItWorks.step2.title}</h3>
                  <p className="text-gray-600 text-center">{t.howItWorks.step2.desc}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{t.howItWorks.step3.title}</h3>
                  <p className="text-gray-600 text-center">{t.howItWorks.step3.desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - New 4-Tier Structure */}
      <section id="pricing" className="py-24 relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {t.pricing.title}
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t.pricing.subtitle}
            </p>
          </div>

          {/* Pricing Cards Grid - 4 tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Micro Ensemble */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">{t.pricing.microEnsemble.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t.pricing.microEnsemble.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{t.pricing.microEnsemble.price}</span>
                  <span className="text-gray-600 ml-1">{t.pricing.microEnsemble.currency}</span>
                  <div className="text-sm text-gray-500">{t.pricing.microEnsemble.period}</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm font-medium text-gray-900">{t.pricing.microEnsemble.capacity1}</div>
                <div className="text-sm font-medium text-gray-900">{t.pricing.microEnsemble.capacity2}</div>
                <div className="text-sm text-gray-600 italic">{t.pricing.microEnsemble.suitedFor}</div>
              </div>
              
              <Link
                href="/signup?plan=micro-ensemble"
                className="block w-full py-2 px-4 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium text-sm"
              >
                {t.pricing.microEnsemble.cta}
              </Link>
            </div>

            {/* Small Ensemble - Featured */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-indigo-200 relative">
              {t.pricing.smallEnsemble.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    POPULÄR
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">{t.pricing.smallEnsemble.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t.pricing.smallEnsemble.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{t.pricing.smallEnsemble.price}</span>
                  <span className="text-gray-600 ml-1">{t.pricing.smallEnsemble.currency}/{t.pricing.smallEnsemble.period}</span>
                  <div className="text-sm text-gray-500">{t.pricing.smallEnsemble.priceYear} {t.pricing.smallEnsemble.currency}/{t.pricing.smallEnsemble.periodYear} <span className="text-green-600 font-medium">({t.pricing.smallEnsemble.discount})</span></div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm font-medium text-gray-900">{t.pricing.smallEnsemble.capacity1}</div>
                <div className="text-sm font-medium text-gray-900">{t.pricing.smallEnsemble.capacity2}</div>
                <div className="text-sm text-gray-600 italic">{t.pricing.smallEnsemble.suitedFor}</div>
              </div>
              
              <Link
                href="/signup?plan=small-ensemble"
                className="block w-full py-2 px-4 text-center bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium text-sm"
              >
                {t.pricing.smallEnsemble.cta}
              </Link>
            </div>

            {/* Project Pass */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">{t.pricing.projectPass.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t.pricing.projectPass.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{t.pricing.projectPass.price}</span>
                  <span className="text-gray-600 ml-1">{t.pricing.projectPass.currency}</span>
                  <div className="text-sm text-gray-500">{t.pricing.projectPass.period}</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm font-medium text-gray-900">{t.pricing.projectPass.capacity1}</div>
                <div className="text-sm font-medium text-gray-900">{t.pricing.projectPass.capacity2}</div>
                <div className="text-sm text-gray-600 italic">{t.pricing.projectPass.suitedFor}</div>
              </div>
              
              <Link
                href="/signup?plan=project-pass"
                className="block w-full py-2 px-4 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium text-sm"
              >
                {t.pricing.projectPass.cta}
              </Link>
            </div>

            {/* Institution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">{t.pricing.institution.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t.pricing.institution.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{t.pricing.institution.price}</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm font-medium text-gray-900">{t.pricing.institution.capacity1}</div>
                <div className="text-sm text-gray-600 italic">{t.pricing.institution.suitedFor}</div>
              </div>
              
              <Link
                href="/contact"
                className="block w-full py-2 px-4 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium text-sm"
              >
                {t.pricing.institution.cta}
              </Link>
            </div>
          </div>


          {/* Contact CTA */}
          <div className="text-center mt-8">
            <p className="text-lg text-gray-600">
              👉 {t.pricing.contact}
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Modern Minimalist */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Image 
                src="/stagesub-logo-white.png" 
                alt="StageSub" 
                width={160} 
                height={48}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-lg text-gray-600 font-light">{t.footer.tagline}</p>
          </div>
          
          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-gray-500 text-sm">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}