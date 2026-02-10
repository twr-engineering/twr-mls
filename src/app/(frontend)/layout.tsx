import React from 'react'
import { Inter } from 'next/font/google'
import './styles.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  description: 'Internal Listing Management System',
  title: 'TWR MLS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={inter.className}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
