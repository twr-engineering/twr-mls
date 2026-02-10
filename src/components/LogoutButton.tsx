'use client'

import React from 'react'

export const LogoutButton: React.FC = () => {
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="nav-link text-left"
        >
            Log out
        </button>
    )
}
