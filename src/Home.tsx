import { useState } from "react"
import { useFormStatus } from "react-dom"

const CopyButton = ({ isSuccessState }: { isSuccessState: boolean }) => {
  const { pending } = useFormStatus()
  return (
    <button className="url-copy-btn solid-btn" disabled={pending || isSuccessState}>
      {pending ? "Please wait..." : isSuccessState ? "URL Copied!" : "Copy Shortened URL"}
    </button>
  )
}

type Props = {
  addError: (e: string) => void
}

export default ({ addError }: Props) => {

  const [isSuccessState, setSuccessState] = useState(false)
  const [urlField, setUrlField] = useState("")

  const copyShortenedUrl = async (formData: FormData) => {
    const submitted = formData.get("url") as string

    try {

      const url = URL.parse(submitted) as URL
      if (url.hostname === window.location.hostname) throw "nice try!"

      let res: Response
      try {
        res = await fetch("/api/shorten", {
          method: "POST",
          body: formData
        })
      } catch (e) {
        throw "could not reach server"
      }

      if (!res.ok) throw res.status == 429 ? "rate limit hit" : "internal server error"

      let data: { code: string }
      try {
        data = await res.json()
      } catch (e) {
        throw "invalid server response"
      }

      try {
        await navigator.clipboard.writeText(window.location.origin + "/" + data.code)
        setSuccessState(true)
      } catch (e) {
        throw "Error copying URL"
        // TODO in case an error happens, store the server response so we don't duplicate requests
        // Or server side we could check for duplicates
      }

    } catch (e) {
      if (typeof e === "string") addError(e)
      else throw e
    }

    setUrlField(submitted) // Restore the form fields after React has deleted them
  }

  return (
    <main>
      <h1>URL Shortener</h1>
      <form action={copyShortenedUrl}>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" defaultValue={urlField} onChange={() => setSuccessState(false)} required />
        <CopyButton isSuccessState={isSuccessState} />
        <button className="qr-code-btn">Create QR Code</button> {/* Yes, i know, this button copies the url too for now */}
      </form>
    </main>
  )

}