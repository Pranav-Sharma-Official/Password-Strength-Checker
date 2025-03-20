import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Password Strength Checker',
  description: 'Check the strength of your password.',
  generator: 'Pranav Sharma',
  icons: '/favicon.ico',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
