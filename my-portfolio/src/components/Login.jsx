import { useState } from 'react'
import { authenticate } from '../lib/contentStore'

/**
 * The sign-in screen.
 *
 * It is a separate route so the admin panel is never rendered before the
 * user has signed in. After a successful sign-in the caller sends the user
 * on to the admin panel.
 */
function Login({ onLogin, redirectTo }) {
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (authenticate(password, remember)) {
      onLogin()
    } else {
      setError('Wrong password')
      setPassword('')
    }
  }

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <h1>Sign in</h1>

        <input
          type="password"
          className="adm-input"
          placeholder="Password"
          autoFocus
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
        />

        {error ? <p className="adm-error">{error}</p> : null}

        <button type="submit" className="adm-primary">
          Sign in
        </button>

        <label className="adm-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Keep me signed in on this device
        </label>

        <a href="#/" className="adm-back">
          Back to the site
        </a>

        {redirectTo ? <span className="adm-hint">Sign in to open the admin panel.</span> : null}
      </form>
    </div>
  )
}

export default Login
