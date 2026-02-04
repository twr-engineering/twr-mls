import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { Button } from '@/components/ui/button'
import config from '@/payload.config'
import './styles.css'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-black/80 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="TWR Logo"
            width={40}
            height={40}
            className="w-auto h-10"
          />
          <span className="font-semibold text-lg tracking-tight hidden sm:inline-block">Truly Wealthy Realty</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Optional top-right links could go here */}
        </div>
      </nav>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-20 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl space-y-10 flex flex-col items-center z-10">
          <Image
            src="/logo.png"
            alt="Truly Wealthy Realty"
            width={400}
            height={150}
            priority
            className="w-auto h-24 md:h-32 mb-2 drop-shadow-2xl"
          />
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Internal Listing <span className="text-blue-500">Management</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              A centralized platform for managing property listings, tracking inventory, and coordinating sales across the organization.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full sm:w-auto">
            {user ? (
              <div className="flex gap-4">
                <Button size="lg" className="h-12 px-8 text-base bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500 transition-all font-medium" asChild>
                  <Link href="/admin">Access Dashboard</Link>
                </Button>
                <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200 border-none transition-all font-medium" asChild>
                  <Link href="/admin/logout">Logout</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button size="lg" className="h-12 px-8 text-base bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500 transition-all font-medium" asChild>
                  <Link href="/admin">
                    Login as Admin/Approver
                  </Link>
                </Button>
                <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200 border-none transition-all font-medium" asChild>
                  <Link href="/login">
                    Login as Agent
                  </Link>
                </Button>
              </>
            )}
          </div>

          {!user && (
            <p className="text-xs text-zinc-600 mt-8">
              Authorized personnel only. Contact IT for access.
            </p>
          )}
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-zinc-950/50 py-24 px-6 border-t border-white/5 w-full">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6 font-bold text-xl">I</div>
            <h3 className="font-semibold text-xl mb-3 text-white">Centralized Inventory</h3>
            <p className="text-zinc-400 leading-relaxed">Manage resale and preselling listings in one secure location. Track status and availability in real-time.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-6 font-bold text-xl">L</div>
            <h3 className="font-semibold text-xl mb-3 text-white">Smart Location Logic</h3>
            <p className="text-zinc-400 leading-relaxed">Automated hierarchy for Cities, Barangays, Townships, and Estates ensures data integrity.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6 font-bold text-xl">S</div>
            <h3 className="font-semibold text-xl mb-3 text-white">Secure Documents</h3>
            <p className="text-zinc-400 leading-relaxed">Role-based access control for sensitive documents. Keep titles, contracts, and client details safe.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-zinc-600 bg-black border-t border-white/5">
        &copy; {new Date().getFullYear()} Truly Wealthy Realty. Internal System.
      </footer>
    </div>
  )
}
