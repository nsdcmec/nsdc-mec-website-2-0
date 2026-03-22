export function getTarget(url: string | null | undefined) {
  if (!url) return undefined;
  return (url.startsWith("http") || url.startsWith("//")) ? "_blank" : undefined;
}

export function getRel(url: string | null | undefined) {
  return getTarget(url) === "_blank" ? "noopener noreferrer" : undefined;
}
