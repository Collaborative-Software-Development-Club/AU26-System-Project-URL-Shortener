import { deleteUrl, getUrls } from "./API";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function MyUrls() {

  const { data: urls = [], isPending, error } = useQuery({
    queryKey: ["urls", 0],
    queryFn: () => getUrls(0)
  });

  const queryClient = useQueryClient();
  const deletion = useMutation({
    mutationFn: deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    }
  })

  if (isPending) {
    return <main>Loading URLS...</main>
  }

  if (error) {
    return <main><span className="inline-error">Error: {error.message}</span></main>
  }

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

      {urls.length === 0 ? (
        <p className="empty-state">You haven't created any URLs yet.</p>
      ) : (
        <ul className="url-list">
          {urls.map((urlObj) => {
            const timestamp = urlObj.create_time * 1000;

            return (
              <li className="url-card" key={urlObj.url}>
                <strong className="url-card-link">{urlObj.url} → {window.location.origin + '/' + urlObj.code}</strong>
                {urlObj.description && <p>{urlObj.description}</p>}
                <div className="url-card-footer">
                  <small>Created {new Date(timestamp).toLocaleDateString()}</small>
                  <button type="button" className="url-delete-btn" aria-label={`Delete ${urlObj.url}`}
                    disabled={deletion.isPending}
                    onClick={() => {
                      if (urlObj.code) deletion.mutate(urlObj.code)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  )


}
