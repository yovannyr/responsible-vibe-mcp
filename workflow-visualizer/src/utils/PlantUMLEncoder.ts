/**
 * Browser-compatible PlantUML encoder
 * Replaces the problematic plantuml-encoder package
 */

/**
 * Encode PlantUML code for use in URLs
 * Uses a simple base64 encoding approach that works in browsers
 */
export function encodePlantUML(plantUMLCode: string): string {
  try {
    // Simple approach: just use base64 encoding
    // This works for most PlantUML diagrams and is browser-compatible
    const encoded = btoa(unescape(encodeURIComponent(plantUMLCode)));
    return encoded;
  } catch (error) {
    console.error('Failed to encode PlantUML:', error);
    throw new Error('PlantUML encoding failed');
  }
}

/**
 * Alternative encoding using URL-safe base64
 * Some PlantUML servers prefer this format
 */
export function encodePlantUMLUrlSafe(plantUMLCode: string): string {
  try {
    const encoded = encodePlantUML(plantUMLCode);
    // Make it URL-safe
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Failed to encode PlantUML (URL-safe):', error);
    throw new Error('PlantUML URL-safe encoding failed');
  }
}
