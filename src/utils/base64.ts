const CHUNK_SIZE = 0x8000

/**
 * Decodes a base64 string that contains UTF-8 content (GitHub Contents API).
 */
export const decodeBase64Utf8 = (base64: string): string => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Encodes a UTF-8 string to base64 (GitHub Contents API).
 *
 * `String.fromCharCode(...bytes)` throws a RangeError once the file grows
 * beyond ~100k bytes, so the byte array is converted in chunks instead.
 */
export const encodeBase64Utf8 = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  return btoa(binary)
}
