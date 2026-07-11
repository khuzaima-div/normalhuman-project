'use client'

import React from 'react'
import { Button } from './ui/button'

const LinkAccountButton = () => {
  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => {
        // API route builds IMAP authorize URL without OAuth scopes
        window.location.href = '/api/aurinko/auth?serviceType=Google'      }}
    >
      Connect Email Account
    </Button>
  )
}

export default LinkAccountButton
