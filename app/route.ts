import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// JWT token validation function (same as middleware)
function isValidToken(token: string): boolean {
  try {
    // Split the token and get the payload
    const payload = JSON.parse(atob(token.split(".")[1]));
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }
    
    // Check if token has required fields
    if (!payload.sub || !payload.email) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication status
    const accessToken = request.cookies.get("accessToken")?.value;
    const userId = request.cookies.get("user_id")?.value;
      // If user is authenticated, redirect to /apps
    if (accessToken && isValidToken(accessToken) && userId) {
      return NextResponse.redirect(new URL("/apps", request.url));
    }
    
    // If not authenticated, serve the index.html
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