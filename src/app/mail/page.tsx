"use client"

// src/app/mail/page.tsx
import dynamic from 'next/dynamic'
import React from 'react'

// Hydration issues se bachne ke liye Mail component bina SSR ke dynamically load ho raha hai
const Mail = dynamic(() => {
    return import('./mail')
}, {
    ssr: false
})

const MailDashboard = () => {
    return (
        <>
            {/* Main Resizable Mail Component Panel */}
            <Mail
                defaultLayout={[20, 32, 48]}
                defaultCollapsed={false}
                navCollapsedSize={4}
            />
        </>
    )
}

export default MailDashboard