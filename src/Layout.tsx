import { Outlet } from "react-router-dom";
import "./index.css";

export default function Layout() {
  return <>
    <header>
      <a className="logo" href="/">ShortWork Pro</a>
      <div className="flex-space" />
      <a className="log-in-button" href="/login">Log In</a>
      <a className="create-account-btn" href="/create-account">Create Account</a>
    </header>
    <main>
      <Outlet />
    </main>
  </>
};