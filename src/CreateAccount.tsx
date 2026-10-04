export default () => {
  return (
    <main>
      <h1>Create Account</h1>
      <form>
        <label>
          Username
          <input type="text" name="username" autoComplete="username" spellCheck="false" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" required />
        </label>
        <button className="solid-btn">Create Account</button>
      </form>
      <a href="/">Back to Home</a>
    </main>
  );
}