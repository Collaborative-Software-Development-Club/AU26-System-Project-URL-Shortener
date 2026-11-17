import { useState, type ChangeEvent } from "react"

export default () => {

  const [inputValue, setInputValue] = useState("") // Needed to prevent React from clearing input on submit
  const [copyBtnDisabled, setCopyBtnDisabled] = useState(false)
  const [copyBtnText, setCopyBtnText] = useState("Copy Shortened URL")

  const copyShortenedUrl = async (formData: FormData) => {

    setCopyBtnDisabled(true)
    setCopyBtnText("Please wait...")

    const url = URL.parse(formData.get("url") as string) as URL
    if (url.hostname === window.location.hostname) {
      setCopyBtnText("Error: nice try!")
      return
    }

    let res: Response
    try {
      res = await fetch("/api/shorten", {
        method: "POST",
        body: formData
      })
    } catch (e) {
      setCopyBtnText("Error: could not reach server")
      setCopyBtnDisabled(false)
      return
    }

    if (!res.ok) {
      if (res.status == 429) setCopyBtnText("Error: rate limit hit")
      else setCopyBtnText("Error: internal server error")
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

  const inputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setCopyBtnDisabled(false)
    setCopyBtnText("Copy Shortened URL")
  }

  return (
    <main>
      <h1>URL Shortener</h1>
      <form action={copyShortenedUrl}>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" onChange={inputChange} value={inputValue} required />
        <button className="url-copy-btn solid-btn" disabled={copyBtnDisabled}>{copyBtnText}</button>
        <button className="qr-code-btn">Create QR Code</button> {/* Yes, i know, this button copies the url too for now */}
      </form>
    </main>
  )

}