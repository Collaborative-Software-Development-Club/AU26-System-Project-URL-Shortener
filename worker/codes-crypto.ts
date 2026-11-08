import { env } from "cloudflare:workers"

// Source https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-38Gr1.2pd.pdf

export class InvalidCodeError extends Error {}

const spaceMultiplier = 1000 // 1 out of every 1000 possible URL's will be active
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
const alphabetBits = Math.log2(alphabet.length)
const rounds = 10

// Get key from Workers Secrets
const keyBytes = Uint8Array.fromBase64(env.ID_ENCODING_KEY)
const key = await crypto.subtle.importKey("raw", keyBytes, "AES-CBC", false, [ "encrypt" ])


const numToAlphabet = (num: number, length: number): string => {
  let str = ""
  for (let j = 0; j < length; j++) {
    str = alphabet[num % alphabet.length] + str
    num = Math.floor(num / alphabet.length)
  }
  return str
}


const alphabetToNum = (str: string): number => {
  let num = 0
  for (const char of str) {
    num = num * alphabet.length + alphabet.indexOf(char)
  }
  return num
}


const encrypt = async(otherHalf: number, common: number, round: number, domainSize: number, reverseMultiplier = 1): Promise<number> => {
  const inBytes = new Uint8Array(16)
  let index = 0
  while (common > 0) {
    inBytes[index++] = common
    common >>>= 8
  }
  inBytes[index] = round

  const buffer = await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, key, inBytes)
  const outBytes = new Uint8Array(buffer)

  let derived = 0
  for (const byte of outBytes) {
    derived = (derived * 2**8 + byte) % domainSize
  }
  return ((otherHalf + derived * reverseMultiplier) % domainSize + domainSize) % domainSize // % twice to avoid negative result
}


export const encode = async (id: number): Promise<string> => {
  const plaintext = id * spaceMultiplier
  const outputLength = Math.ceil(Math.log2(plaintext) / alphabetBits)
  const halfSize = Math.ceil(2**(outputLength * alphabetBits / 2))
  let a = Math.floor(plaintext / halfSize) // Left half
  let b = plaintext % halfSize // Right half

  // Apply Feistel cipher
  for (let i = 0; i < rounds; i++) {
    [a, b] = [b, await encrypt(a, b, i, halfSize)]
  }

  return numToAlphabet(a * halfSize + b, outputLength) // Concatenates a and b into base64
}


export const decode = async (code: string): Promise<number> => {
  const halfSize = Math.ceil(2**(code.length * alphabetBits / 2))
  const ciphertext = alphabetToNum(code)
  let a = Math.floor(ciphertext / halfSize)
  let b = ciphertext % halfSize

  // Apply Feistel cipher, in reverse
  for (let i = rounds - 1; i >= 0; i--) {
    [a, b] = [await encrypt(b, a, i, halfSize, -1), a]
  }

  const plaintext = a * halfSize + b
  if (plaintext % 1000 !== 0 || plaintext <= 0) {
    throw new InvalidCodeError
  }
  return plaintext / 1000
}