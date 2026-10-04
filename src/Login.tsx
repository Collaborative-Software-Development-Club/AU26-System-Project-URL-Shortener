export default () => {
  return (
    <main>
      <h1>Log In</h1>
      <form>
        <label>
          Username
          <input type="text" name="username" autoComplete="username" spellCheck="false" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button className="solid-btn">Log In</button>
      </form>
      <a href="/">Back to Home</a>
    </main>
  );
}