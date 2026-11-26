import { useState } from "react"
import { useFormStatus } from "react-dom"
import { shortenUrl } from "./API"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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

  const queryClient = useQueryClient()
  const shorten = useMutation({
    mutationFn: shortenUrl,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      await navigator.clipboard.writeText(`${window.location.origin}/${data.code}`)
      setSuccessState(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    }
  })

  const copyShortenedUrl = async (formData: FormData) => {
    const submitted = formData.get("url") as string
    const url = URL.parse(submitted);
    if (!url) return;
    if (url.host == window.location.host) return;

    shorten.mutate(submitted)
  }

  return (
    <main>
      <h1>URL Shortener</h1>
      <form action={copyShortenedUrl}>
        <input type="url" name="url" placeholder="Enter Link" className="url-input" spellCheck="false" defaultValue={urlField} onChange={() => {
          setSuccessState(false)
          setError("");
        }} required />
        {errorMessage && <span className="inline-error">Error: {errorMessage}</span>}
        <CopyButton isSuccessState={isSuccessState} />
        <button className="qr-code-btn">Create QR Code</button> {/* Yes, i know, this button copies the url too for now */}
      </form>
    </main>
  )

}