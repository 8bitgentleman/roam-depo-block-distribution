export function getExtensionAPISetting(extensionAPI, key, defaultValue) {
  const value = extensionAPI?.settings?.get(key);
  return value !== null ? value : defaultValue;
}

export const generatePullWatchParams = (rule) => {
  const pullPattern = "[:block/string :block/uid {:block/_refs ...}]";
  const entity = `[:node/title "${rule.tag}"]`;
  return { pullPattern, entity };
};

export const createPullWatch = async (rule, callback) => {
  const { pullPattern, entity } = generatePullWatchParams(rule);
  try {
    await window.roamAlphaAPI.data.addPullWatch(pullPattern, entity, callback);
    return callback; // Return the callback function for later removal
  } catch (error) {
    console.error("Error creating pull watch:", error);
    return null;
  }
};

export const removePullWatch = async (rule, callback) => {
  const { pullPattern, entity } = generatePullWatchParams(rule);
  try {
    await window.roamAlphaAPI.data.removePullWatch(pullPattern, entity, callback);
  } catch (error) {
    console.error("Error removing pull watch:", error);
  }
};