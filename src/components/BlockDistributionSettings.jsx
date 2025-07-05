import React, { useState, useEffect, useCallback } from "react";
import { Button, Divider, FormGroup, Menu, MenuItem, Popover, PopoverInteractionKind, Toaster, Position, InputGroup } from "@blueprintjs/core";
import PageInput from "roamjs-components/components/PageInput";
import BlockInput from "roamjs-components/components/BlockInput";
import { getExtensionAPISetting } from "../utils.js";

const BlockDistributionSettings = ({ extensionAPI, addPullWatch, removePullWatch }) => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    destType: "page",
    refType: "block_ref",
  });

  const toaster = Toaster.create({
    position: Position.TOP,
  });

  const getPageUid = async (title) => {
    const result = await window.roamAlphaAPI.data.pull("[:block/uid]", [":node/title", title]);
    return result ? result[":block/uid"] : null;
  };

  const getBlockString = async (uid) => {
    const result = await window.roamAlphaAPI.data.pull("[:block/string]", [":block/uid", uid]);
    return result ? result[":block/string"] : null;
  };

  const addRule = async () => {
    if (newRule.tag && newRule.destValue) {
      let tagUid = await getPageUid(newRule.tag);
      if (!tagUid) {
        toaster.show({ message: `Tag page "${newRule.tag}" doesn't exist.`, intent: "warning" });
        return;
      }

      let destUid = newRule.destUid;
      let destString;

      switch (newRule.destType) {
        case "blockSearch":
          if (!destUid) {
            toaster.show({ message: "Please select a valid destination block.", intent: "warning" });
            return;
          }
          destString = await getBlockString(destUid);
          break;
        case "page":
          destUid = await getPageUid(newRule.destValue);
          if (!destUid) {
            toaster.show({ message: `Destination page "${newRule.destValue}" doesn't exist.`, intent: "warning" });
            return;
          }
          destString = newRule.destValue;
          break;
        case "blockUid":
          destString = await getBlockString(newRule.destValue);
          if (!destString) {
            toaster.show({ message: `Block with UID "${newRule.destValue}" doesn't exist.`, intent: "warning" });
            return;
          }
          destUid = newRule.destValue;
          break;
      }

      const ruleWithUids = {
        ...newRule,
        tagUid,
        destUid,
        destString,
      };

      // console.log(`[addRule] Adding new rule: ${JSON.stringify(ruleWithUids)}`);
      const updatedRules = [...rules, ruleWithUids];
      setRules(updatedRules);
      await extensionAPI.settings.set("blockDistributionRules", updatedRules);

      await addPullWatch(ruleWithUids);

      setNewRule({
        destType: "page",
        refType: "block_ref",
      });
    }
  };

  const deleteRule = async (index) => {
    const updatedRules = [...rules];
    const removedRule = updatedRules.splice(index, 1)[0];
    setRules(updatedRules);
    await extensionAPI.settings.set("blockDistributionRules", updatedRules);

    await removePullWatch(removedRule);
  };

  useEffect(() => {
    const fetchRules = async () => {
      const initialRules = await getExtensionAPISetting(
        extensionAPI,
        "blockDistributionRules",
        []
      );
      setRules(initialRules);
    };

    fetchRules();
  }, [extensionAPI]);

  const handleTagChange = useCallback((tag) => {
    setNewRule((prevNewRule) => ({
      ...prevNewRule,
      tag,
    }));
  }, []);

  const handleDestValueChange = useCallback((value, uid) => {
    setNewRule((prevNewRule) => ({
      ...prevNewRule,
      destValue: value,
      destUid: uid,
    }));
  }, []);

  const handlePageValueChange = useCallback((destValue) => {
    setNewRule((prevNewRule) => ({
      ...prevNewRule,
      destValue,
      destUid: undefined,
    }));
  }, []);

  const handleBlockUidChange = useCallback((event) => {
    let value = event.target.value;
    // Remove surrounding parentheses if they exist
    if (value.startsWith('((') && value.endsWith('))')) {
      value = value.slice(2, -2);
    }
    setNewRule((prevNewRule) => ({
      ...prevNewRule,
      destValue: value,
      destUid: undefined,
    }));
  }, []);

  const destinationTypes = [
    { label: "Block Search", value: "blockSearch" },
    { label: "Page", value: "page" },
    { label: "Block UID", value: "blockUid" },
  ];

  const referenceTypes = [
    { label: "Block Reference", value: "block_ref", description: "((block_ref))" },
    { label: "Embed", value: "embed", description: "{{[[embed]]: ((UID))}}" },
    { label: "Embed Path", value: "embed_path", description: "{{[[embed-path]]: ((UID))}}" },
    { label: "Embed Children", value: "embed_children", description: "{{[[embed-children]]: ((UID))}}" },
  ];

  return (
    <div>




      <div>
        <FormGroup label={<strong>Tag To Watch</strong>} labelFor="tag">
          <PageInput
            id="tag"
            placeholder="Enter tag"
            value={newRule.tag || ""}
            setValue={handleTagChange}
            showButton={false}
            multiline={false}
          />
        </FormGroup>

        <FormGroup label={<strong>Destination Type</strong>} labelFor="destType">
          <Popover
            content={
              <Menu>
                {destinationTypes.map((item) => (
                  <MenuItem
                    key={item.value}
                    text={item.label}
                    onClick={() =>
                      setNewRule((prevNewRule) => ({
                        ...prevNewRule,
                        destType: item.value,
                        destValue: "",
                        destUid: undefined,
                      }))
                    }
                  />
                ))}
              </Menu>
            }
            interactionKind={PopoverInteractionKind.CLICK}
          >
            <Button
              text={destinationTypes.find(t => t.value === newRule.destType)?.label || "Select Type"}
              rightIcon="double-caret-vertical"
            />
          </Popover>
        </FormGroup>

        <FormGroup label={<strong>Reference Type</strong>} labelFor="refType" >
          <Popover
            content={
              <Menu>
                {referenceTypes.map((item) => (
                  <MenuItem
                    key={item.value}
                    text={<div><strong>{item.label}</strong><br /><small>{item.description}</small></div>}
                    onClick={() =>
                      setNewRule((prevNewRule) => ({
                        ...prevNewRule,
                        refType: item.value,
                      }))
                    }
                  />
                ))}
              </Menu>
            }
            interactionKind={PopoverInteractionKind.CLICK}
          >
            <Button
              text={referenceTypes.find(t => t.value === newRule.refType)?.label || "Block Reference"}
              rightIcon="double-caret-vertical"
            />
          </Popover>
        </FormGroup>

        <FormGroup label={<strong>Destination Value</strong>} labelFor="destValue">
          {newRule.destType === "blockSearch" && (
            <BlockInput
              value={newRule.destValue || ""}
              setValue={handleDestValueChange}
            />
          )}
          {newRule.destType === "page" && (
            <PageInput
              id="destValue"
              placeholder="Enter Page Name"
              value={newRule.destValue || ""}
              setValue={handlePageValueChange}
              showButton={false}
              multiline={false}
            />
          )}
          {newRule.destType === "blockUid" && (
            <InputGroup
              id="destValue"
              placeholder="Enter Block UID"
              value={newRule.destValue || ""}
              onChange={handleBlockUidChange}
            />
          )}
        </FormGroup>

        <Button onClick={addRule} intent="primary">
          Add Rule
        </Button>
      </div>
      <hr></hr>
      <Divider />
      <div>
        {rules.map((rule, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <strong>Tag:</strong> {rule.tag}  {/*(UID: {rule.tagUid || "N/A"}) */}
              <br />
              <strong>Destination:</strong>{" "}
              {rule.destType === "blockSearch" ? "Block" : rule.destType === "page" ? "Page" : "Block UID"} - {rule.destString}{/*  (UID: {rule.destUid || "N/A"}) */}
              <br />
              <strong>Reference Type:</strong>{" "}
              {referenceTypes.find(t => t.value === (rule.refType || "block_ref"))?.label || "Block Reference"}
            </div>
            <Button icon="trash" minimal onClick={() => deleteRule(index)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockDistributionSettings;