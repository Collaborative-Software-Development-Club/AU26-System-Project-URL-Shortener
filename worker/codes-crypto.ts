import { env } from "cloudflare:workers"

// Source https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-38Gr1.2pd.pdf

const spaceMultiplier = 1000 // 1 out of every 1000 possible URL's will be active
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
const alphabetBits = Math.log2(alphabet.length)
const rounds = 10

// Get key from Workers Secrets
// const env = { ID_ENCODING_KEY: "2ZWnUZnldHpMq4s1bFKv6g==" }
const keyBytes = Uint8Array.fromBase64(env.ID_ENCODING_KEY)
const key = await crypto.subtle.importKey("raw", keyBytes, "AES-CBC", false, [ "encrypt" ])


const encrypt = async(plaintext: number, domainSize: number): Promise<number> => {
  const plaintextBytes = new Uint8Array(16)
  let i = 0;
  while (plaintext > 0) {
    plaintextBytes[i++] = plaintext & (2**8 - 1)
    plaintext >>>= 8
  }

  const ciphertextBuffer = await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, key, plaintextBytes)
  const ciphertextBytes = new Uint8Array(ciphertextBuffer)

  let ciphertext = 0
  for (const byte of ciphertextBytes) {
    ciphertext = (ciphertext * 2**8 + byte) % domainSize
  }
  return ciphertext
}


export const encode = async (id: number): Promise<string> => {
  id *= spaceMultiplier
  const outputLength = Math.ceil(Math.log2(id) / alphabetBits)
  const halfSize = Math.ceil(2**(outputLength * alphabetBits / 2))
  let a = Math.floor(id / halfSize) // Left half
  let b = id % halfSize // Right half

  // Apply Feistel cipher
  for (let i = 0; i < rounds; i++) {
    [a, b] = [b, await encrypt(a + i * halfSize, halfSize)]
  }
  let result = a * halfSize + b

  // Convert to base64
  let code = ""
  for (let j = 0; j < outputLength; j++) {
    code += alphabet[result % alphabet.length]
    result = Math.floor(result / alphabet.length)
  }
  return code
}


export const decode = async (code: string): Promise<number> => {
  return 0
}