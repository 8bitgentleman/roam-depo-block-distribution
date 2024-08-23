export function getExtensionAPISetting(extensionAPI, key, defaultValue) {
  const value = extensionAPI?.settings?.get(key);
  return value !== null ? value : defaultValue;
}

export const generatePullWatchParams = (rule) => {
  const pullPattern = "[:block/string :block/uid {:block/_refs ...}]";
  const entity = `[:node/title "${rule.tag}"]`;
  return { pullPattern, entity };
};
