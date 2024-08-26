export function getExtensionAPISetting(extensionAPI, key, defaultValue) {
  const value = extensionAPI?.settings?.get(key);
  return value !== null ? value : defaultValue;
}

export const generatePullWatchParams = (rule) => {
  const pullPattern = "[:block/string :block/uid {:block/_refs ...}]";
  const entity = `[:node/title "${rule.tag}"]`;
  return { pullPattern, entity };
};

export function removeTagFromBlock(blockString, tag) {
  // Create the regex pattern
  const varRegex = new RegExp(`#${tag}|#\\[\\[${tag}\\]\\]`, "g")

  // Replace all occurrences
  let replacedStr = blockString.replace(varRegex, "")
  // cleanup excess spaces
  replacedStr = replacedStr.replace(/\s+/g, " ").trim()

  return replacedStr
}

export function compareObjects(before, after) {
  const beforeRefs = before[":block/_refs"];
  const afterRefs = after[":block/_refs"];
  
  const added = afterRefs.filter(a => !beforeRefs.some(b => b[":block/uid"] === a[":block/uid"]));
  const removed = beforeRefs.filter(b => !afterRefs.some(a => a[":block/uid"] === b[":block/uid"]));
  
  return {
    added,
    removed,
    modified: [] // Assuming no modifications in this case
  };
}