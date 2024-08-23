import pkg from "../package.json";
import BlockDistributionSettings from "./components/BlockDistributionSettings";
import { createPullWatch, removePullWatch } from "./utils";

let pullWatches = {};

const handlePullWatch = (rule) => (before, after) => {
  console.log(`Pull watch triggered for ${rule.tag}:`, before, after);
  // Implement your block distribution logic here
};

async function onload({ extensionAPI }) {
  const wrappedBlockDistribution = () =>
    BlockDistributionSettings({ extensionAPI });

  extensionAPI.settings.panel.create({
    tabTitle: `${pkg.name}`,
    settings: [
      {
        id: "button-setting",
        name: "Button test",
        description: "tests the button",
        action: {
          type: "button",
          onClick: (evt) => {
            console.log("Button clicked!");
          },
          content: "Button",
        },
      },
      {
        id: "block-distribution-settings",
        name: "Block Distribution Settings",
        description: "Manage rules for automatic block distribution",
        action: { type: "reactComponent", component: wrappedBlockDistribution },
      },
    ],
  });

  // Add pull watches for existing rules
  const existingRules = await extensionAPI.settings.get("blockDistributionRules") || [];
  for (const rule of existingRules) {
    const callback = await createPullWatch(rule, handlePullWatch(rule));
    if (callback) {
      pullWatches[rule.tag] = { rule, callback };
    }
  }

  console.log(`Loaded ${pkg.name} v${pkg.version}`);
}

async function onunload() {
  // Remove all pull watches
  for (const [tag, { rule, callback }] of Object.entries(pullWatches)) {
    await removePullWatch(rule, callback);
  }
  pullWatches = {};

  console.log(`Unloaded ${pkg.name}`);
}

export default {
  onload,
  onunload,
};