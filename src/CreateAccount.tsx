export default () => {
  return (
    <main>
      <h1>Create Account</h1>
      <p>Making an account lets you edit the destination of all the URLs you create!</p>
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
      <a href="/app/home">Back to Home</a>
    </main>
  )
}

/*

// Very rough example implementation

const password = "password123!"
const encoder = new TextEncoder();
let baseKey
crypto.subtle.importKey(
  "raw",
  encoder.encode(password),
  "PBKDF2",
  false,
  ["deriveBits"]
).then(key => {
  baseKey = key;
}).catch(console.error);
let bits
const salt = new Uint8Array(16);
crypto.getRandomValues(salt);
crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:500000},baseKey5,length=256).then(b=>{bits=b;console.log(new Uint8Array(b))})
*/