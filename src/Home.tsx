import { useState } from "react"
import { useFormStatus } from "react-dom"
import { client } from "./API"

const CopyButton = ({ isSuccessState }: { isSuccessState: boolean }) => {
  const { pending } = useFormStatus()
  return (
    <button className="url-copy-btn solid-btn" disabled={pending || isSuccessState}>
      {pending ? "Please wait..." : isSuccessState ? "URL Copied!" : "Copy Shortened URL"}
    </button>
  )
}

export default function Home() {

  const [isSuccessState, setSuccessState] = useState(false)
  const [urlField, setUrlField] = useState("")
  const [errorMessage, setError] = useState("")

  const copyShortenedUrl = async (formData: FormData) => {
    const submitted = formData.get("url") as string

    try {

      const url = URL.parse(submitted) as URL
      if (url.origin === window.location.origin) throw "nice try!"

      let res: Response
      try {
        res = await client.api.shorten.$post({
          form: { url: submitted }
        });
      } catch (e) {
        throw "could not reach server"
      }

      if (!res.ok) throw res.status == 429 ? "rate limit hit" : "internal server error"

      const data = await res.json()

      try {
        await navigator.clipboard.writeText(window.location.origin + "/" + data.code)
        setSuccessState(true)
      } catch (e) {
        throw "could not copy URL to clipboard"
        // TODO in case an error happens, store the server response so we don't duplicate requests
        // Or server side we could check for duplicates
      }

    } catch (e) {
      setError(typeof e === "string" ? e : "unknown error")
    }

    setUrlField(submitted) // Restore the form fields after React has deleted them
  }

  return (
    <main>
      <h1>URL Shortener</h1>
      <form action={copyShortenedUrl}>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" defaultValue={urlField} onChange={() => setSuccessState(false)} required />
        {errorMessage && <span className="inline-error">Error: {errorMessage}</span>}
        <CopyButton isSuccessState={isSuccessState} />
        <button className="qr-code-btn">Create QR Code</button> {/* Yes, i know, this button copies the url too for now */}
      </form>
    </main>
  )

}