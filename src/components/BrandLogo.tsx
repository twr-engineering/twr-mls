'use client'

import React from 'react'

export const BrandLogo = (props: any) => {
    return (
        <div className="flex items-center gap-2 p-2">
            {/* 
        Using img tag instead of next/image here often avoids optimization/loading issues 
        inside the Payload Admin build pipeline if not fully configured for it, 
        plus it's simpler for a static public asset. 
        But next/image is fine if configured. I'll use a standard img for absolute safety in the admin panel.
      */}
            <img
                src="/logo.png"
                alt="Truly Wealthy Realty"
                className="max-w-[150px] max-h-[50px] w-auto h-auto object-contain"
            />
        </div>
    )
}
