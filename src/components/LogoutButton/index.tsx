'use client'

import React from 'react'
import Link from 'next/link'

export const LogoutButton = (_props: any) => {
  return (
    <div className="nav-group" style={{ marginTop: 'auto', paddingTop: '20px' }}>
      <Link
        href="/admin/logout"
        className="nav__link"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          color: 'var(--theme-error-500)',
          fontWeight: 600,
          borderTop: '1px solid var(--theme-elevation-150)',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '12px' }}
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
        Logout
      </Link>
    </div>
  )
}

export default LogoutButton
