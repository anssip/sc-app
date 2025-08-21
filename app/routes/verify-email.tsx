import type { MetaFunction } from "@remix-run/node"
import { useSearchParams, useNavigate } from "@remix-run/react"
import { useState, useEffect } from "react"
import { sendVerificationEmail } from "~/lib/auth"
import { useAuth } from "~/lib/auth-context"
import Button from "~/components/Button"
import Navigation from "~/components/Navigation"

export const meta: MetaFunction = () => {
  return [
    { title: "Verify Your Email - Spot Canvas" },
    { name: "description", content: "Check your inbox to verify your email address" },
  ]
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const email = searchParams.get('email') || user?.email || ''
  const marketingConsent = searchParams.get('marketing') === 'true'
  
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check if user is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      navigate('/welcome')
    }
  }, [user, navigate])

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !user) return
    
    setResending(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      await sendVerificationEmail(user)
      setSuccessMessage('Verification email sent! Please check your inbox and spam folder.')
      setResendCooldown(60) // 60 second cooldown
    } catch (err: any) {
      console.error('Failed to resend verification email:', err)
      
      // More specific error messages
      if (err.message?.includes('Too many')) {
        setError('Too many attempts. Please wait a few minutes before trying again.')
        setResendCooldown(300) // 5 minute cooldown for rate limiting
      } else if (err.message?.includes('sign in again')) {
        setError('Session expired. Please sign in again to resend the email.')
      } else {
        setError('Failed to send verification email. Please check your email address or contact support.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleChangeEmail = () => {
    // Sign out and go back to signup with the email pre-filled
    navigate(`/signup?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      <Navigation showGetStarted={false} />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* Email icon */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-accent-1/10 border-2 border-accent-1/30 mb-8">
              <svg className="h-10 w-10 text-accent-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold text-white">
              Check your <span className="text-accent-1">inbox</span>
            </h2>
            
            <p className="mt-4 text-gray-300">
              We've sent a verification email to:
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {email}
            </p>
            
            <p className="mt-6 text-sm text-gray-400">
              Click the link in the email to verify your account and get started.
              The email should arrive within a few minutes.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="rounded-md bg-green-500/10 p-4 border border-green-500/20">
              <p className="text-sm text-green-500">{successMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              variant="secondary"
              fullWidth
              disabled={resending || resendCooldown > 0 || !user}
            >
              {resending ? (
                "Sending..."
              ) : resendCooldown > 0 ? (
                `Resend email in ${resendCooldown}s`
              ) : (
                "Resend verification email"
              )}
            </Button>

            <button
              onClick={handleChangeEmail}
              className="w-full text-sm text-accent-1 hover:text-accent-2 transition-colors"
            >
              Wrong email? Sign up with a different address
            </button>
          </div>

          {/* Help text */}
          <div className="mt-8 p-4 bg-primary-light rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-white mb-2">
              Can't find the email?
            </h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure {email} is spelled correctly</li>
              <li>• Add noreply@spotcanvas.com to your contacts</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          {/* Marketing consent status (for debugging, can be removed later) */}
          {marketingConsent && (
            <div className="text-xs text-gray-500 text-center">
              ✓ You've opted in to receive product updates
            </div>
          )}
        </div>
      </div>
    </div>
  )
}