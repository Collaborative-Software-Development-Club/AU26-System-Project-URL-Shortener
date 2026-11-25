import { useEffect, useState } from "react"
import { client } from "./API";

export default function MyUrls() {

  const [errorMessage, setError] = useState("")
  const [urls, setUrls] = useState<{ url: string, description: string | null, create_time: number }[]>([])

  const loadUrls = async () => {
    try {
      const res = await client.api.user.urls.$get({
        query: {
          page: "0"
        }
      });

      if (res.status !== 200) {
        throw new Error("Could not load URLs")
      }


      const json = await res.json();
      setUrls(json.urls);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error");
      }
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