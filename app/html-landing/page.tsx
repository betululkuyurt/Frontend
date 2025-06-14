import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fluxmind - HTML Landing',
  description: 'Fluxmind explores the intersection of consciousness, AI, and digital innovation.',
}

export default function HtmlLandingPage() {
  return (
    <div className="w-full h-screen">
      <iframe 
        src="/landing.html" 
        className="w-full h-full border-0"
        title="Fluxmind Landing Page"
      />
    </div>
  )
}