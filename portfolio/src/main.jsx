import './lib/guestMode' // must stay first: redirects localStorage while a guest demo is active
import './lib/userScopedStorage' // must stay second: keeps each user's local data separate
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme.css'
import './theme.tailwind-light.css'
import './appshell.css'
import './guest.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
