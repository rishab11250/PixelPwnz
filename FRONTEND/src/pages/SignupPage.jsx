import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { motion } from 'framer-motion'
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, error: authError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signup(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden px-4">
      {/* Ambient glowing background shapes */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="backdrop-blur-xl bg-bg-raised/70 border border-edge shadow-2xl rounded-2xl overflow-hidden relative">
          {/* Subtle top border shimmer */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="p-8 sm:p-10">
            <div className="text-center space-y-2 mb-8 select-none">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">Create Account</h1>
              <p className="text-text-secondary">Join DataTime Machine and track history</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || authError) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error || authError}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-text-secondary ml-1">Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 bg-bg-overlay/50 border-edge focus:border-emerald-500/50 transition-colors h-11 text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-secondary ml-1">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-muted" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-bg-overlay/50 border-edge focus:border-emerald-500/50 transition-colors h-11 text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-text-secondary ml-1">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-muted" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-9 bg-bg-overlay/50 border-edge focus:border-emerald-500/50 transition-colors h-11 text-text-primary placeholder:text-text-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-text-secondary ml-1">Confirm</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-muted" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-9 bg-bg-overlay/50 border-edge focus:border-emerald-500/50 transition-colors h-11 text-text-primary placeholder:text-text-muted"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin disabled:opacity-75" />
                    Setting up...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center mt-6 text-sm text-text-secondary pt-4 border-t border-edge/50">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline underline-offset-4">
                  Sign in here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
