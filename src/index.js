import pkg from "../package.json";
import BlockDistributionSettings from "./components/BlockDistributionSettings";
import { 
  generatePullWatchParams,
  removeTagFromBlock,
  compareObjects } from "./utils";

let pullWatches = {};

const handlePullWatch = (rule) => async (before, after) => {
  console.log(`[PullWatch] Triggered for ${rule.tag}:`, before, after);
  console.log("rule", rule);

  if (!before || !after) {
    console.error('[PullWatch] Invalid before or after data:', { before, after });
    return;
  }

  let changes;
  try {
    changes = compareObjects(before, after);
    console.log("Changes:", changes);
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
      // Create the new block
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": rule.destUid, order: 'last' },
        block: { string: `((${newBlock[':block/uid']}))` },
      });

      // Update the original block to remove the tag
      let blockString = removeTagFromBlock(newBlock[':block/string'], rule.tag);
      await window.roamAlphaAPI.updateBlock({
        block: {
          uid: newBlock[':block/uid'],
          string: blockString,
        },
      });

      console.log(`[PullWatch] Successfully processed new block: ${newBlock[':block/uid']}`);
    } catch (error) {
      console.error('[PullWatch] Error in processing new block:', error);
    }
  } else {
    console.log('[PullWatch] No new blocks added, no action taken');
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
    tabTitle: `${pkg.name}`,
    settings: [
      {
        id: "block-distribution-settings",
        name: "Block Distribution Settings",
        description: "Manage rules for automatic block distribution",
        action: { type: "reactComponent", component: wrappedBlockDistribution },
      },
    ],
  });

  // Load initial rules and set up pull watches
  const existingRules = await extensionAPI.settings.get("blockDistributionRules") || [];

  console.log("existingRules",existingRules);
  
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