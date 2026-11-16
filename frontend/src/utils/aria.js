// Builds an aria-describedby value from optional element ids (e.g. the error message).
export function describedBy(...ids) {
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}
