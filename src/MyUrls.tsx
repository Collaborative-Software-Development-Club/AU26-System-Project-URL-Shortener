import { useEffect, useState } from "react"

export default function MyUrls() {

  const [urls, setUrls] = useState<{ id: string, url: string }[]>([]);

  useEffect(() => {
    fetch('/api/user/urls').then(res => res.json()).then(json => {
      setUrls(json);
    })
  }, []);

  return <ul>
    {urls.map(urlObj => <li key={urlObj.id}>
      {urlObj.url}
    </li>
    )}
  </ul>
}