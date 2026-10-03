import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'



function App() {

  return (
    <>
      <header>
        <span className="logo">ShortWork Pro</span>
        <div className="flex-space" />
        <button className="log-in-button">Log In</button>
        <button className="create-account-button">Create Account</button>
      </header>
      <main>
        <h1>URL Shortener</h1>
        <form className="url-form">
          <input type="text" placeholder="Enter Link" className="url-input" spellCheck="false"></input>
          <button className="url-copy-btn">Copy Shortened URL</button>
        </form>
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
