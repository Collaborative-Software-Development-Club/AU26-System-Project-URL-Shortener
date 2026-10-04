export default function App() {

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
          <input type="url" placeholder="Enter Link" className="url-input" spellCheck="false" required></input>
          <button className="url-copy-btn" disabled>Copy Shortened URL</button>
        </form>
        {/* Show QR Code */}
      </main>
    </>
  )
}