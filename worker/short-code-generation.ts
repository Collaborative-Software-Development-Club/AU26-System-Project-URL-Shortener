// Deterministically generate short codes from database ID's

import { env } from "cloudflare:workers"

// Partially based on https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-38Gr1.2pd.pdf

export class InvalidCodeError extends Error { }

// If any of these constants change you need to reset the database

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
const ALPHABET_BITS = Math.log2(ALPHABET.length)
if (ALPHABET_BITS !== 6) throw new RangeError()

const SPACE_MULTIPLIER = 1000 // 1 out of every 1000 possible URL's will be active
if (SPACE_MULTIPLIER >= 2 ** 17) throw new RangeError // Above this the calculation of a will overflow

const ROUNDS = 8
if (ROUNDS >= 2 ** 8) throw new RangeError()

// Get key from Workers Secrets
const KEY = await crypto.subtle.importKey("raw", Uint8Array.fromBase64(env.KEY), "AES-CBC", false, ["encrypt"])


const numToAlphabet = (a: number, b: number, domain: number, length: number): string => {
  // num = a * domain + b
  // We have to accept a, b, and domain because num > JS integer limit
  let str = ""
  for (let j = 0; j < length; j++) {

    // Equivalent to: str = alphabet[num % alphabet.length] + str
    str = ALPHABET[(domain % ALPHABET.length * a + b) % ALPHABET.length] + str

    // Equivalent to: num = Math.floor(num / alphabet.length)
    b = Math.floor((domain % ALPHABET.length * a + b) / ALPHABET.length)
    domain = Math.floor(domain / ALPHABET.length)

  }
  return str
}


const alphabetToNum = (str: string, domain: number): number[] => {
  let a = 0, b = 0
  for (const char of str) {

    // Equivalent to: num = num * alphabet.length + alphabet.indexOf(char)
    // where num = a * domain + b
    const i = ALPHABET.indexOf(char)
    if (i === -1) throw new InvalidCodeError()
    b = b * ALPHABET.length + i
    a = a * ALPHABET.length + Math.floor(b / domain)
    b %= domain

  }
  return [a, b]
}


const encrypt = async (otherHalf: number, common: number, round: number, domain: number, reverseMultiplier = 1): Promise<number> => {
  const inBytes = new Uint8Array(16)
  inBytes[0] = round

  let index = 1
  while (common > 0) {
    inBytes[index++] = common
    common = Math.floor(common / 2 ** 8)
  }

  const buffer = await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, KEY, inBytes)
  const outBytes = new Uint8Array(buffer)

  let outNum = 0
  for (const byte of outBytes) {
    outNum = (outNum * 2 ** 8 + byte) % domain
    if (outNum * 2 ** 8 > Number.MAX_SAFE_INTEGER) break
  }

  return (otherHalf + outNum * reverseMultiplier + domain) % domain
}

// id may be at most Number.MAX_SAFE_INTEGER = 2**53
export const encode = async (id: number): Promise<string> => {
  if (id > Number.MAX_SAFE_INTEGER) throw new RangeError()

  const codeLength = Math.ceil((Math.log2(id) + Math.log2(SPACE_MULTIPLIER)) / ALPHABET_BITS + Number.EPSILON * 1000)
  const cipherDomain = Math.ceil(2 ** (codeLength * ALPHABET_BITS / 2)) // Will be at most 2**36
  const plaintext = BigInt(id) * BigInt(SPACE_MULTIPLIER)
  let a = Number(plaintext / BigInt(cipherDomain)) // First half of working value
  let b = Number(plaintext % BigInt(cipherDomain)) // Second half

  // Apply Feistel cipher
  for (let i = 0; i < ROUNDS; i++) {
    [a, b] = [b, await encrypt(a, b, i, cipherDomain)]
  }

  return numToAlphabet(a, b, cipherDomain, codeLength) // Concatenates a and b into base64
}


export const decode = async (code: string): Promise<number> => {
  const cipherDomain = Math.ceil(2 ** (code.length * ALPHABET_BITS / 2))
  if (cipherDomain > Number.MAX_SAFE_INTEGER / (ALPHABET.length + 1)) throw new InvalidCodeError()
  let [a, b] = alphabetToNum(code, cipherDomain)

  // Apply Feistel cipher, in reverse
  for (let i = ROUNDS - 1; i >= 0; i--) {
    [a, b] = [await encrypt(b, a, i, cipherDomain, -1), a]
  }

  // plaintext = a * cipherDomain + b
  if (
    cipherDomain / SPACE_MULTIPLIER * a > Number.MAX_SAFE_INTEGER // Integer overflow check
    || (cipherDomain % SPACE_MULTIPLIER * a + b) % SPACE_MULTIPLIER !== 0 // Checking that plaintext is multiple of spaceMultiplier
  ) throw new InvalidCodeError()
  return a * Math.floor(cipherDomain / SPACE_MULTIPLIER) + Math.floor((cipherDomain % SPACE_MULTIPLIER * a + b) / SPACE_MULTIPLIER) // Equivalent to: plaintext / spaceMultiplier
}