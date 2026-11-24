import { useEffect, useState } from "react"

export default function MyUrls() {

  const [errorMessage, setError] = useState("")
  const [urls, setUrls] = useState<{ url: string, description: string | null, create_time: number }[]>([])

  const loadUrls = async () => {
    let res: Response
    try {
      res = await fetch('/api/user/urls')
      const json = await res.json()
      setUrls(json.urls)
    } catch {
      setError("could not reach server")
    }
  }

  useEffect(() => {
    loadUrls()
  }, [])

  return (
    <main>
      <h1>My URLs</h1>
      {errorMessage && <span className="inline-error">Error: {errorMessage}</span>}
      <ul>
        {urls.map((urlObj, i) => <li key={i}>
          {urlObj.url}
        </li>
        )}
      </ul>
    </main>
  )
  

}