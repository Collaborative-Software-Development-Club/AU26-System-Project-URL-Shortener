import { useState } from "react"

export default () => {

  const [toShortenLink, setToShortenLink] = useState<string>('');

  return (
    <main>
      <h1>URL Shortener</h1>
      <form>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" required
          value={toShortenLink}
          onChange={e => setToShortenLink(e.target.value)}
        />
        <button className="url-copy-btn solid-btn" onClick={(e) => {
          e.preventDefault();
          const res = fetch("/api/shorten", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ link: toShortenLink })
          })

          res.then(response => response.json())
            .then(data => {
              alert(JSON.stringify(data, null, 2));
            });

        }}>Copy Shortened URL</button>
        <button className="qr-code-btn">Create QR Code</button>
      </form>
    </main>
  )

}