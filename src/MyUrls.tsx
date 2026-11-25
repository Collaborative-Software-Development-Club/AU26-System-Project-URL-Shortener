import { useEffect, useState } from "react"
import { client } from "./API";

export default function MyUrls() {

  const [errorMessage, setError] = useState("")
  const [urls, setUrls] = useState<{ url: string, description: string | null, create_time: number, code: string | null }[]>([])

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
    <main className="my-urls-dashboard">
      <header className="my-urls-header">
        <div>
          <h1>My URLs</h1>
          <p>Manage the links you've created.</p>
        </div>
        <span className="url-count" aria-label={`${urls.length} URLs`}>
          {urls.length} {urls.length === 1 ? "URL" : "URLs"}
        </span>
      </header>
      {errorMessage && <span className="inline-error">Error: {errorMessage}</span>}
      {urls.length === 0 && !errorMessage ? (
        <p className="empty-state">You haven't created any URLs yet.</p>
      ) : (
        <ul className="url-list">
          {urls.map((urlObj) => {
            const timestamp = urlObj.create_time * 1000;

            return (
              <li className="url-card" key={urlObj.url}>
                <strong className="url-card-link">{urlObj.url} → {window.location.origin + '/' + urlObj.code}</strong>
                {urlObj.description && <p>{urlObj.description}</p>}
                <small>Created {new Date(timestamp).toLocaleDateString()}</small>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  )


}