import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-gray-50 border-t border-gray-200" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="md:flex md:items-center md:justify-between">
            {/* Links */}
            <div className="flex flex-wrap justify-center md:justify-start space-x-6 md:order-2">
              <Link 
                href="/about" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                À propos
              </Link>
              <Link 
                href="/contact" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Contact
              </Link>
              <Link 
                href="/terms" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Conditions d'utilisation
              </Link>
              <Link 
                href="/privacy" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Politique de confidentialité
              </Link>
            </div>

            {/* Copyright */}
            <div className="mt-4 md:mt-0 md:order-1">
              <p className="text-center md:text-left text-sm text-gray-600">
                © {currentYear} Futsal Réservation. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}