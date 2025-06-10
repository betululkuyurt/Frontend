import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const htmlPath = path.join(process.cwd(), 'public', 'index.html')
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(htmlPath)) {
      console.log('HTML file not found at:', htmlPath)
      return new NextResponse('HTML file not found', { status: 404 })
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error reading HTML file:', error)
    return new NextResponse('Error loading HTML file', { status: 500 })
  }
}