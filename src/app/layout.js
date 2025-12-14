import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({ subsets: ['latin'] })

export const metadata = {
  title: 'HappyFood API - Discover Global Recipes',
  description: 'A modern, feature-rich RESTful API for discovering, filtering, and sharing global recipes. Built with Next.js and MongoDB.',
  keywords: 'API, recipes, food, cooking, REST, Next.js, MongoDB',
  authors: [{ name: 'Anshu Baka', email: 'anshubaka2004@gmail.com' }],
  openGraph: {
    title: 'HappyFood API - Discover Global Recipes',
    description: 'A modern, feature-rich RESTful API for discovering, filtering, and sharing global recipes.',
    type: 'website',
    url: 'https://happyfood-api.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HappyFood API - Discover Global Recipes',
    description: 'A modern, feature-rich RESTful API for discovering, filtering, and sharing global recipes.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1e293b" />
      </head>
      <body className={`${montserrat.className} antialiased`}>
        {/* Global decorative gradient blob (top-right) */}
        <div aria-hidden className="pointer-events-none fixed -z-10 top-0 right-0 w-[520px] h-[520px] translate-x-1/3 -translate-y-1/3 opacity-30 blur-3xl" style={{
          background: 'radial-gradient(55% 55% at 50% 50%, rgba(16,185,129,0.35) 0%, rgba(255,107,90,0.25) 60%, rgba(255,255,255,0) 100%)'
        }} />
        {children}
      </body>
    </html>
  )
}
