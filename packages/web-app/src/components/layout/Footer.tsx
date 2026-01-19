export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white shadow-lg" role="contentinfo">
      <div className="px-4 py-3">
        <p className="text-center text-xs text-gray-500">
          © {currentYear} Stepzy
        </p>
      </div>
    </footer>
  )
}