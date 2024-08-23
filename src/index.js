import pkg from "../package.json";
import BlockDistributionSettings from "./components/BlockDistributionSettings";
import { generatePullWatchParams } from "./utils";

let pullWatches = {};

const handlePullWatch = (rule) => (before, after) => {
  console.log(`[PullWatch] Triggered for ${rule.tag}:`, before, after);
  // Implement your block distribution logic here
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
      // ... (other settings remain the same)
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
  for (const rule of existingRules) {
    await addPullWatch(rule);
  }

  console.log(`[onload] Loaded ${pkg.name} v${pkg.version}`);
}

async function onunload() {
  console.log(`[onunload] Starting unload process`);
  // Remove all pull watches
  for (const [tag, { rule }] of Object.entries(pullWatches)) {
    console.log(`[onunload] Removing pull watch for ${tag}`);
    await removePullWatch(rule);
  }
  pullWatches = {};
  console.log(`Unloaded ${pkg.name}`);
}

export default {
  onload,
  onunload,
};