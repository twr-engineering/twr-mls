import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { Button } from '@/components/ui/button'
import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="home">
      {/* Top right admin button */}
      <div className="absolute top-8 right-8 z-10">
        <Button variant="default" size="lg" asChild>
          <Link href={payloadConfig.routes.admin}>
            {user ? 'Access Dashboard' : 'Login as Admin'}
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="logo-container">
          <Image
            alt="Truly Wealthy Realty Logo"
            src="/logo.png"
            width={400}
            height={150}
            priority
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>

        <div className="hero-text">
          <h1 className="hero-title">Internal Listing Management</h1>
          <p className="hero-subtitle">
            A centralized platform for managing property listings, tracking inventory, and
            coordinating sales across the organization.
          </p>
        </div>

        <Link className="cta-button" href="/login ">
          Login
        </Link>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <h3 className="feature-title">Centralized Inventory</h3>
            <p className="feature-desc">
              Manage resale and preselling listings in one secure location. Track status, pricing,
              and availability in real-time.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Smart Location Logic</h3>
            <p className="feature-desc">
              Automated hierarchy for Cities, Barangays, Townships, and Estates ensures data
              integrity and accurate search results.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Secure Documents</h3>
            <p className="feature-desc">
              Role-based access control for sensitive documents. Keep titles, contracts, and client
              details safe.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Truly Wealthy Realty. Internal System.</p>
      </footer>
    </div>
  )
}
