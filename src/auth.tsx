// Helper functions for user authentication on the client side

export const PBKDF2HashBase64 = async (plaintext: string, salt: Uint8Array<ArrayBuffer>, iterations: number, length: number): Promise<string> => {
  const hashBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(plaintext),
      "PBKDF2",
      false,
      [ "deriveBits" ]
    ),
    length
  )
  return new Uint8Array(hashBits).toBase64()
}
