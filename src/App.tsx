export default function App() {

  return (
    <>
      <header>
        <span className="logo">ShortWork Pro</span>
        <div className="flex-space" />
        <button className="log-in-button">Log In</button>
        <button className="create-account-btn">Create Account</button>
      </header>
      <main>
        <h1>URL Shortener</h1>
        <form className="buttons-div">
          <input type="url" placeholder="Enter Link" className="url-input" spellCheck="false" required></input>
          <button className="url-copy-btn">Copy Shortened URL</button>
          <button className="qr-code-btn">Create QR Code</button>
        </form>
        {/* Show QR Code */}
      </main>
    </>
  )
}