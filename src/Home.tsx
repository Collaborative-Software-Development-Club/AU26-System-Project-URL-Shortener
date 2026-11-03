import { useState } from "react"

export default () => {

  const [copyBtnDisabled, setCopyBtnDisabled] = useState(false)
  const [copyBtnText, setCopyBtnText] = useState("Copy Shortened URL")


  const copyShortenedUrl = async (e:React.SubmitEvent) => {
    e.preventDefault()

    setCopyBtnDisabled(true)
    setCopyBtnText("Please wait...")

    let res: Response
    try {
      res = await fetch("/api/shorten", {
        method: "POST",
        body: new FormData(e.target)
      })
    } catch (e) {
      setCopyBtnText("Error: could not reach server")
      return
    }

    if (!res.ok) {
      setCopyBtnText("Error: internal server error")
      return
    }

    let data: { code: string }
    try {
      data = await res.json()
    } catch (e) {
      setCopyBtnText("Error: invalid server response")
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.host + "/" + data.code)
      setCopyBtnText("URL Copied!")
    } catch (e) {
      setCopyBtnText("Error copying URL")
      return
    }
  }

  const removeDisabled = () => {
    setCopyBtnDisabled(false)
    setCopyBtnText("Copy Shortened URL")
  }

  return (
    <main>
      <h1>URL Shortener</h1>
      <form onSubmit={copyShortenedUrl}>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" onChange={removeDisabled} required />
        <button className="url-copy-btn solid-btn" disabled={copyBtnDisabled}>{copyBtnText}</button>
        <button className="qr-code-btn">Create QR Code</button> {/* Yes, i know, this button copies the url too for now */}
      </form>
    </main>
  )

}