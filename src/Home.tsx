const copyShortenedUrl = async (e:React.SubmitEvent) => {
  e.preventDefault();

  const urlCopyBtn = document.querySelector(".url-copy-btn")
  if (!(urlCopyBtn instanceof HTMLButtonElement)) throw new Error
  urlCopyBtn.disabled = true
  urlCopyBtn.textContent = "Please wait..."

  let res: Response
  try {
    res = await fetch("/api/shorten", {
      method: "POST",
      body: new FormData(e.target)
    })
  } catch (e) {
    urlCopyBtn.textContent = "Error: could not reach server"
    return
  }

  if (!res.ok) {
    urlCopyBtn.textContent = "Error: internal server error"
    return
  }

  let data: { code: string }
  try {
    data = await res.json()
  } catch (e) {
    urlCopyBtn.textContent = "Error: invalid server response"
    return
  }

  try {
    await navigator.clipboard.writeText(window.location.host + "/" + data.code)
    urlCopyBtn.textContent = "URL Copied!"
  } catch (e) {
    urlCopyBtn.textContent = "Error copying URL"
    return
  }
}

const removeDisabled = () => {
  const urlCopyBtn = document.querySelector(".url-copy-btn")
  if (!(urlCopyBtn instanceof HTMLButtonElement)) throw new Error

  urlCopyBtn.disabled = false
  urlCopyBtn.textContent = "Copy Shortened URL"
}

export default () => {
  return (
    <main>
      <h1>URL Shortener</h1>
      <form onSubmit={copyShortenedUrl}>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" onChange={removeDisabled} required />
        <button className="url-copy-btn solid-btn">Copy Shortened URL</button>
        <button className="qr-code-btn">Create QR Code</button> {/* Yes, i know, this button copies the url too */}
      </form>
    </main>
  )

}