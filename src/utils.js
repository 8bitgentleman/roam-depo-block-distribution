export function getExtensionAPISetting(extensionAPI, key, defaultValue) {
  const value = extensionAPI?.settings?.get(key);
  return value !== null ? value : defaultValue;
}
