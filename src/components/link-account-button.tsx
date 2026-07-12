'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from './ui/button'

const LinkAccountButton = () => {
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  return (
    <Button
      size="lg"
      className="h-11 w-full rounded-xl text-body font-semibold shadow-token-sm transition-[background-color,transform,box-shadow] duration-200"
      disabled={isRedirecting}
      onClick={() => {
        if (isRedirecting) return
        setIsRedirecting(true)
        window.location.href = '/api/aurinko/auth?serviceType=Google'
      }}
    >
      {isRedirecting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Connecting…
        </>
      ) : (
        'Connect Email Account'
      )}
    </Button>
  )
}

export default LinkAccountButton
