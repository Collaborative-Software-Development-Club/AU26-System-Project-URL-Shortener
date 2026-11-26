import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { useFormStatus } from "react-dom"

import "./index.css"
import Page from "./Page"
import { client } from "./API"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { useSession } from "./useSession"

const LogoutButton = () => {
  const { pending } = useFormStatus()

  return (
    <button className="navbar-item-solid" disabled={pending}>
      {pending ? "Please wait..." : "Log Out"}
    </button>
  )
}


export default function App() {

  const queryClient = useQueryClient()
  const session = useSession()
  if (session.isPending) return <p>Loading...</p>
  if (session.isError) return <p>Could not check your session. Please reload.</p>

  const loggedIn = session.data.id !== null

  const logOut = async () => {
    try {
      const response = await client.api.logout.$post();
      if (!response.ok) throw new Error("Logout failed")
      await queryClient.invalidateQueries({ queryKey: ["session"] })
      window.location.href = "/app/home"
    } catch (e) {
      window.location.href = "/app/error?e=Could%20not%20log%20out."
    }
  }


  return (
    <>
      <header>
        <a className="logo" href="/app/home">ShortWork Pro</a>
        <div className="flex-space" />
        {
          loggedIn ? <>
            <a className="navbar-item" href="/app/my-urls">My URLs</a>
            <form action={logOut}>
              <LogoutButton />
            </form>
          </> : <>
            <a className="navbar-item" href="/app/login">Log In</a>
            <a className="navbar-item-solid" href="/app/create-account">Create Account</a>
          </>
        }
      </header>
      <Page loggedIn={loggedIn} />
    </>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)