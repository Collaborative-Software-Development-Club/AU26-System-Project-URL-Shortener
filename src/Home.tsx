import './Home.css'

export default () => {

  return (
    <main>
      <h1>URL Shortener</h1>
      <form>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" required />
        <button className="url-copy-btn solid-btn">Copy Shortened URL</button>
        <button className="qr-code-btn">Create QR Code</button>
      </form>
    </main>
  )

}