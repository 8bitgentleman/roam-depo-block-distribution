import pkg from '../package.json';
import IntervalSettings from './components/BlockDistributionSettings';

async function onload({extensionAPI}) {
  // set defaults if they dont' exist
  const wrappedIntervalConfig = () => IntervalSettings({ extensionAPI })

  extensionAPI.settings.panel.create({
    tabTitle: `${pkg.name}`,
    settings: [
        {id:          "button-setting",
         name:        "Button test",
         description: "tests the button",
         action:      {type:    "button",
                       onClick: (evt) => { console.log("Button clicked!"); },
                       content: "Button"}},
                       {
                        id: "interval-settings",
                        name: "Contact Frequency Intervals",
                        description:
                            "Set custom contact frequency durations. See the README for more info.",
                        className: "crm-reminders-interval-setting",
                        action: { type: "reactComponent", component: wrappedIntervalConfig },
                    },           
    ]
  });

  console.log(`Loaded ${pkg.name} v${pkg.version}`);
}

function onunload() {
  console.log(`Unloaded ${pkg.name}`);
}

export default {
onload,
onunload
};
