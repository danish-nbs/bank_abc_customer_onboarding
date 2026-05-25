import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BankHeader from '../components/BankHeader'
import BankFooter from '../components/BankFooter'
import CardShell from '../components/CardShell'

const VALID_EMAIL = 'admin@nbs.com'
const VALID_PASSWORD = 'admin'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const email = e.target.email.value.trim()
    const password = e.target.password.value
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      navigate('/dashboard')
    } else {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-surface-container-low to-transparent" />
      </div>

      <CardShell>
        <BankHeader />

        <div className="p-stack-lg flex-grow">
          <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-stack-sm">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </span>
                <input
                  className="w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors"
                  id="email"
                  name="email"
                  placeholder="analyst@enterprise.com"
                  required
                  type="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-stack-sm">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                  Password
                </label>
                <a
                  className="font-label-md text-label-md text-secondary hover:text-primary transition-colors"
                  href="#"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">key</span>
                </span>
                <input
                  className="w-full pl-10 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Toggle password visibility"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-unit">
              <input
                className="w-4 h-4 text-secondary border-outline-variant rounded focus:ring-secondary focus:ring-1 cursor-pointer bg-surface-container-lowest"
                id="remember"
                name="remember"
                type="checkbox"
              />
              <label
                className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none"
                htmlFor="remember"
              >
                Remember me
              </label>
            </div>

            {error && (
              <p className="font-body-sm text-body-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}

            <button
              className="mt-stack-sm w-full h-[44px] bg-primary-container hover:bg-primary text-on-primary rounded font-label-md text-label-md flex items-center justify-center gap-2 transition-colors shadow-level-2"
              type="submit"
            >
              Login to Platform
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>
        </div>

        <BankFooter />
      </CardShell>
    </div>
  )
}
