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
  const beforeRefs = before[":block/_refs"] || [];
  const afterRefs = after[":block/_refs"] || [];
  
  const added = afterRefs.filter(a => !beforeRefs.some(b => b && b[":block/uid"] === a[":block/uid"]));
  const removed = beforeRefs.filter(b => b && !afterRefs.some(a => a[":block/uid"] === b[":block/uid"]));
  
  return {
    added,
    removed,
    modified: [] // Assuming no modifications in this case
  };
}

export function createBlockReference(blockUid, refType = "block_ref") {
  // Default to block_ref for backwards compatibility
  const referenceType = refType || "block_ref";
  
  switch (referenceType) {
    case "embed":
      return `{{[[embed]]: ((${blockUid}))}}`;
    case "embed_path":
      return `{{[[embed-path]]: ((${blockUid}))}}`;
    case "embed_children":
      return `{{[[embed-children]]: ((${blockUid}))}}`;
    case "block_ref":
    default:
      return `((${blockUid}))`;
  }
}

export async function getBlockParent(blockUid) {
  try {
    const result = await window.roamAlphaAPI.data.pull("[:block/parents :block/page]", [":block/uid", blockUid]);
    
    if (result && result[":block/parents"] && result[":block/parents"].length > 0) {
      // For nested blocks: parents[0] is the page, parents[1] is the immediate parent block
      // For page-level blocks: parents[0] is the page (only item)
      
      if (result[":block/parents"].length > 1) {
        // Nested block - return the immediate parent block (last item)
        const immediateParent = result[":block/parents"][result[":block/parents"].length - 1];
        const parentResult = await window.roamAlphaAPI.data.pull("[:block/uid]", immediateParent[":db/id"]);
        return parentResult ? parentResult[":block/uid"] : null;
      } else {
        // Page-level block - return the page UID
        const pageParent = result[":block/parents"][0];
        const pageResult = await window.roamAlphaAPI.data.pull("[:block/uid]", pageParent[":db/id"]);
        return pageResult ? pageResult[":block/uid"] : null;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[getBlockParent] Error getting parent for block ${blockUid}:`, error);
    return null;
  }
}

export async function getBlockOrder(blockUid) {
  try {
    const result = await window.roamAlphaAPI.data.pull("[:block/order]", [":block/uid", blockUid]);
    return result ? result[":block/order"] : 0;
  } catch (error) {
    console.error(`[getBlockOrder] Error getting order for block ${blockUid}:`, error);
    return 0;
  }
}

export async function isDescendantOf(blockUid, potentialAncestorUid) {
  try {
    const result = await window.roamAlphaAPI.data.pull("[:block/parents]", [":block/uid", blockUid]);
    if (result && result[":block/parents"]) {
      for (const parent of result[":block/parents"]) {
        if (parent[":block/uid"] === potentialAncestorUid) {
          return true;
        }
        // Recursively check if this parent is a descendant of the potential ancestor
        if (await isDescendantOf(parent[":block/uid"], potentialAncestorUid)) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`[isDescendantOf] Error checking descendant relationship:`, error);
    return false;
  }
}

export async function moveBlockAndCreateReference(blockUid, rule) {
  try {
    // Check for circular reference - prevent moving a block to its own child
    if (await isDescendantOf(rule.destUid, blockUid)) {
      console.error(`[moveBlockAndCreateReference] Circular reference detected: Cannot move block ${blockUid} to its descendant ${rule.destUid}`);
      return false;
    }
    
    // Get original parent and order info before moving (only if we need to leave a reference)
    let originalParent, originalOrder;
    if (rule.leaveReference !== false) {
      originalParent = await getBlockParent(blockUid);
      originalOrder = await getBlockOrder(blockUid);
      
      if (!originalParent) {
        console.error(`[moveBlockAndCreateReference] Could not find parent for block ${blockUid} - block may not exist`);
        return false;
      }
    }
    
    // Verify destination exists
    const destCheck = await window.roamAlphaAPI.data.pull("[:block/uid]", [":block/uid", rule.destUid]);
    if (!destCheck) {
      console.error(`[moveBlockAndCreateReference] Destination block ${rule.destUid} does not exist`);
      return false;
    }
    
    // Move block to destination
    await window.roamAlphaAPI.moveBlock({
      block: { uid: blockUid },
      location: { "parent-uid": rule.destUid, order: 'last' }
    });
    
    // Create reference at original location (only if requested)
    if (rule.leaveReference !== false) {
      const referenceString = createBlockReference(blockUid, "block_ref");
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": originalParent, order: originalOrder },
        block: { string: referenceString }
      });
    }
    
    return true;
  } catch (error) {
    console.error(`[moveBlockAndCreateReference] Error moving block ${blockUid}:`, error);
    return false;
  }
}