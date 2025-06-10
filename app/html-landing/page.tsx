import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MyGen-AI Suite - HTML Landing',
  description: 'MyGen-AI Suite explores the intersection of consciousness, AI, and digital innovation.',
}

export default function HtmlLandingPage() {
  return (
    <div className="w-full h-screen">
      <iframe 
        src="/landing.html" 
        className="w-full h-full border-0"
        title="MyGen-AI Suite Landing Page"
      />
    </div>
  )
}