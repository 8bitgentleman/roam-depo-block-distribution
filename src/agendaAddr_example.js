import { getAllPeople } from "./utils_reminders"
import { getExtensionAPISetting } from "./utils"

const testing = false
const version = "v2.5.8"

const plugin_title = "Roam CRM"

var runners = {
    intervals: [],
    eventListeners: [],
    pullFunctions: [],
}

const pullPattern =
    "[:block/_refs :block/uid :node/title {:block/_refs [{:block/refs[:node/title]} :node/title :block/uid :block/string]}]"
const entity = '[:node/title "Agenda"]'

//MARK: config panel
function createPanelConfig(extensionAPI, pullFunction) {
    return {
        tabTitle: plugin_title,
        settings: [
            {
                id: "agenda-addr-setting",
                name: "Run the Agenda Addr",
                description:
                    "When you make a block anywhere that has as persons name `[[Bill Gates]]` and add the hashtag `#Agenda` Roam CRM will automatically nest a block-ref of that block on Bill's page under an Agenda attribute.",
                action: {
                    type: "switch",
                    onChange: async (evt) => {
                        if (evt.target.checked) {
                            await parseAgendaPull(
                                window.roamAlphaAPI.pull(pullPattern, entity),
                                extensionAPI,
                            )
                            // agenda addr pull watch
                            window.roamAlphaAPI.data.addPullWatch(pullPattern, entity, pullFunction)
                        } else {
                            window.roamAlphaAPI.data.removePullWatch(
                                pullPattern,
                                entity,
                                pullFunction,
                            )
                        }
                    },
                },
            },
            {
                id: "agenda-addr-remove-names",
                name: "Remove #tagged names in Agenda Addr blocks",
                description:
                    "In a block tagged [[Agenda]] (and when the Agenda Addr is turned on) If a person's name is tagged with a hashtag ( #[[Steve Jobs]] ), then the tagged name will be auto removed after the Agenda Addr is run.",
                action: { type: "switch" },
            },

        ],
    }
}
//MARK:Agenda Addr
function removeTagFromBlock(blockString, tag) {
    // Create the regex pattern
    const varRegex = new RegExp(`#${tag}|#\\[\\[${tag}\\]\\]`, "g")

    // Replace all occurrences
    let replacedStr = blockString.replace(varRegex, "")
    // cleanup excess spaces
    replacedStr = replacedStr.replace(/\s+/g, " ").trim()

    return replacedStr
}

async function parseAgendaPull(after, extensionAPI) {
    // Function to clean up the original block
    function cleanUpBlock(blockUID, blockString) {
        const cleanedString = blockString.replace(agendaRegex, "").trim()
        window.roamAlphaAPI.updateBlock({
            block: { uid: blockUID, string: cleanedString },
        })
    }
    // Precompile the regex
    const agendaRegex = /\[\[Agenda\]\]|\#Agenda|\#\[\[Agenda\]\]/g

    // Function to create a TODO block
    function createTodoBlock(sourceUID, personAgendaBlock) {
        const newBlockString = `{{[[TODO]]}} ((${sourceUID}))`

        window.roamAlphaAPI.createBlock({
            location: { "parent-uid": personAgendaBlock, order: 0 },
            block: { string: newBlockString },
        })
    }

    if (":block/_refs" in after) {
        const agendaBlocks = after[":block/_refs"]
        const filteredBlocks = agendaBlocks.filter((block) => {
            // Check if ":block/refs" key exists and has at least 2 refs
            const hasRefs = block[":block/refs"] && block[":block/refs"].length >= 2
            // Check if ":block/string" does not start with "Agenda::"
            const doesNotStartWithAgenda = !block[":block/string"].startsWith("Agenda::")

            // Return true if both conditions are met
            return hasRefs && doesNotStartWithAgenda
        })
        if (filteredBlocks.length > 0) {
            const people = await getAllPeople()

            filteredBlocks.forEach(async (block) => {
                // pull out the block string to create a source of truth through the changes
                let blockString = block[":block/string"]

                const relevantRefs = block[":block/refs"].filter(
                    (ref) => ref[":node/title"] !== "Agenda",
                )
                relevantRefs.forEach(async (ref) => {
                    const matchingPerson = getDictionaryWithKeyValue(
                        people,
                        "title",
                        ref[":node/title"],
                    )

                    if (matchingPerson) {
                        const personAgendaBlock = getBlockUidByContainsTextOnPage(
                            "Agenda::",
                            matchingPerson.title,
                        )
                        createTodoBlock(block[":block/uid"], personAgendaBlock)

                        if (
                            getExtensionAPISetting(extensionAPI, "agenda-addr-remove-names", false)
                        ) {
                            // remove people tags #john but not [[john]]
                            blockString = removeTagFromBlock(blockString, matchingPerson.title)
                            await window.roamAlphaAPI.updateBlock({
                                block: {
                                    uid: block[":block/uid"],
                                    string: blockString,
                                },
                            })
                        }
                        // remove the #Agenda block
                        cleanUpBlock(block[":block/uid"], blockString)
                    }
                })
            })
        }
    }
}
//MARK: onload
async function onload({ extensionAPI }) {
    const pullFunction = async function a(before, after) {
        await parseAgendaPull(after, extensionAPI)
    }
    // add to runners so it can be removed later
    runners.pullFunctions.push(pullFunction)

    const panelConfig = createPanelConfig(extensionAPI, pullFunction)
    extensionAPI.settings.panel.create(panelConfig)

    //MARK: agenda addr
    if (getExtensionAPISetting(extensionAPI, "agenda-addr-setting", false)) {
        // run the initial agenda addr
        await parseAgendaPull(window.roamAlphaAPI.pull(pullPattern, entity), extensionAPI)

        // agenda addr pull watch
        window.roamAlphaAPI.data.addPullWatch(pullPattern, entity, pullFunction)
    }

    if (!testing) {
        console.log(`load ${plugin_title} plugin`)
    }
}
// MARK: unload
function onunload() {
    // remove pull watches
    for (let i = 0; i < runners.pullFunctions.length; i++) {
        window.roamAlphaAPI.data.removePullWatch(pullPattern, entity, runners.pullFunctions[i])
    }
    runners.pullFunctions = [] // Clear the array after stopping all intervals

}

export default {
    onload,
    onunload,
}
