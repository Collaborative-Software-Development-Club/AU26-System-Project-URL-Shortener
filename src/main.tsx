import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import Page from "./Page"


const App = () => {

  const [loginBtnDisabled, setLoginBtnDisabled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const checkIfLoggedIn = async () => setLoggedIn(Boolean(await cookieStore.get("logged-in")))
  const logOut = (e: React.MouseEvent) => {
    setLoginBtnDisabled(true)
    // TODO Continue logging out
    

  }

  // Error handling

  // const [errors, setErrors] = useState<string[]>([])
  // const addError = (e: string) => setErrors([e, ...errors])
  const [eCount, setECount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const addError = (e: string) => {setErrors([e+eCount, ...errors]);setECount(eCount+1)}


  return (
    <>
      <header>
        <a className="logo" href="/app/home">ShortWork Pro</a>
        <div className="flex-space" />
        {
          loggedIn ? <>
            <a className="navbar-item" href="/app/my-urls">My URLs</a>
            <button className="navbar-item-solid" onClick={logOut} disabled={loginBtnDisabled}>Log Out</button>
          </> : <>
            <a className="navbar-item" href="/app/login">Log In</a>
            <a className="navbar-item-solid" href="/app/create-account">Create Account</a>
          </>
        }
      </header>
      <Page onLogin={checkIfLoggedIn} addError={addError} loggedIn={loggedIn} />
      <div className="errors">
        {errors.map((e, i) => (
          <div className="error">
            Error: {e}
            <button onClick={() => setErrors(errors.filter((e2, i2) => i !== i2))}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)