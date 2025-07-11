import pkg from "../package.json";
import BlockDistributionSettings from "./components/BlockDistributionSettings";
import { 
  generatePullWatchParams,
  removeTagFromBlock,
  compareObjects,
  createBlockReference,
  moveBlockAndCreateReference } from "./utils";

let pullWatches = {};
const extensionName = pkg.name
  .split('-') // Split the string at each dash
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
  .join(' '); // Join the words with spaces

const handlePullWatch = (rule) => async (before, after) => {
  if (!before || !after) {
    console.error('[PullWatch] Invalid before or after data:', { before, after });
    return;
  }

  let changes;
  try {
    changes = compareObjects(before, after);
  } catch (error) {
    console.error('[PullWatch] Error in compareObjects:', error);
    return;
  }

  if (changes.added && changes.added.length > 0) {
    // There's at least one new block added
    const newBlock = changes.added[0]; // We'll process the first new block

    if (!newBlock || !newBlock[':block/uid']) {
      console.error('[PullWatch] Invalid new block:', newBlock);
      return;
    }

    try {
      if (rule.refType === "move_block") {
        // Move block to destination and create reference at original location
        const moveSuccess = await moveBlockAndCreateReference(newBlock[':block/uid'], rule);
        if (moveSuccess) {
          // Remove tag from moved block (now at destination)
          let blockString = removeTagFromBlock(newBlock[':block/string'], rule.tag);
          await window.roamAlphaAPI.updateBlock({
            block: {
              uid: newBlock[':block/uid'],
              string: blockString,
            },
          });
        } else {
          console.error('[PullWatch] Failed to move block, falling back to reference creation');
          // Fall back to creating reference if move fails
          const referenceString = createBlockReference(newBlock[':block/uid'], "block_ref");
          await window.roamAlphaAPI.createBlock({
            location: { "parent-uid": rule.destUid, order: 'last' },
            block: { string: referenceString },
          });
          
          // Update the original block to remove the tag
          let blockString = removeTagFromBlock(newBlock[':block/string'], rule.tag);
          await window.roamAlphaAPI.updateBlock({
            block: {
              uid: newBlock[':block/uid'],
              string: blockString,
            },
          });
        }
      } else {
        // Original logic for creating references
        const referenceString = createBlockReference(newBlock[':block/uid'], rule.refType);
        await window.roamAlphaAPI.createBlock({
          location: { "parent-uid": rule.destUid, order: 'last' },
          block: { string: referenceString },
        });

        // Update the original block to remove the tag
        let blockString = removeTagFromBlock(newBlock[':block/string'], rule.tag);
        await window.roamAlphaAPI.updateBlock({
          block: {
            uid: newBlock[':block/uid'],
            string: blockString,
          },
        });
      }
    } catch (error) {
      console.error('[PullWatch] Error in processing new block:', error);
    }
  } else {
  }
};

const addPullWatch = async (rule) => {
  const callback = handlePullWatch(rule);
  const { pullPattern, entity } = generatePullWatchParams(rule);
  await window.roamAlphaAPI.data.addPullWatch(pullPattern, entity, callback);
  pullWatches[rule.tag] = { rule, callback };
};

const removePullWatch = async (rule) => {
  if (pullWatches[rule.tag]) {
    const { pullPattern, entity } = generatePullWatchParams(rule);
    await window.roamAlphaAPI.data.removePullWatch(pullPattern, entity, pullWatches[rule.tag].callback);
    delete pullWatches[rule.tag];
  }
};

async function onload({ extensionAPI }) {
  const wrappedBlockDistribution = () =>
    BlockDistributionSettings({ extensionAPI, addPullWatch, removePullWatch });

  extensionAPI.settings.panel.create({
    tabTitle: `${extensionName}`,
    settings: [
      {
        id: "block-distribution-settings",
        name: "Block Distributer Settings",
        description: "Manage rules for automatic block distribution",
        action: { type: "reactComponent", component: wrappedBlockDistribution },
      },
    ],
  });

  // Load initial rules and set up pull watches
  const existingRules = await extensionAPI.settings.get("blockDistributionRules") || [];
  
  for (const rule of existingRules) {
    await addPullWatch(rule);
  }

  console.log(`[onload] Loaded ${pkg.name} v${pkg.version}`);
}

async function onunload() {
  // Remove all pull watches
  for (const [tag, { rule }] of Object.entries(pullWatches)) {
    await removePullWatch(rule);
  }
  pullWatches = {};
  console.log(`Unloaded ${pkg.name}`);
}

export default {
  onload,
  onunload,
};