/** An existing SVG is trusted only when both its spec marker and prior output receipt match. */
export function verifiedOutput(markerMatches, expectedHash, actualHash) {
  return markerMatches && typeof expectedHash === 'string' && expectedHash === actualHash;
}
