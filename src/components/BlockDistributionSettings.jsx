import React, { useState, useEffect, useCallback } from "react";
import { Button, Divider, FormGroup, Menu, MenuItem, Popover, PopoverInteractionKind } from "@blueprintjs/core";
import PageInput from "roamjs-components/components/PageInput";
import BlockInput from "roamjs-components/components/BlockInput";
import { getExtensionAPISetting } from "../utils.js";

const BlockDistributionSettings = ({ extensionAPI, addPullWatch, removePullWatch }) => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    destType: "block",
  });

  const addRule = async () => {
    if (newRule.tag && newRule.destValue) {
      console.log(`[addRule] Adding new rule: ${JSON.stringify(newRule)}`);
      const updatedRules = [...rules, newRule];
      setRules(updatedRules);
      await extensionAPI.settings.set("blockDistributionRules", updatedRules);
      
      // Add pull watch
      await addPullWatch(newRule);
      
      setNewRule({
        destType: "block",
      });
    }
  };

  const deleteRule = async (index) => {
    const updatedRules = [...rules];
    const removedRule = updatedRules.splice(index, 1)[0];
    console.log(`[deleteRule] Deleting rule: ${JSON.stringify(removedRule)}`);
    setRules(updatedRules);
    await extensionAPI.settings.set("blockDistributionRules", updatedRules);
    
    // Remove pull watch
    await removePullWatch(removedRule);
  };

  useEffect(() => {
    const fetchRules = async () => {
      const initialRules = await getExtensionAPISetting(
        extensionAPI,
        "blockDistributionRules",
        []
      );
      console.log(`[fetchRules] Fetched ${initialRules.length} rules`);
      setRules(initialRules);
    };

    fetchRules();
  }, [extensionAPI]);
  
    const handleTagChange = useCallback((tag) => {
      setNewRule((prevNewRule) => {
        if (prevNewRule.tag !== tag) {
          return { ...prevNewRule, tag };
        }
        return prevNewRule;
      });
    }, []);
  
    const handleDestValueChange = useCallback((value, uid) => {
      console.log("BlockInput value:", value, "UID:", uid);
      setNewRule((prevNewRule) => ({
        ...prevNewRule,
        destValue: value,
      }));
    }, []);
  
    const handlePageValueChange = useCallback((destValue) => {
      setNewRule((prevNewRule) => {
        if (prevNewRule.destValue !== destValue) {
          return { ...prevNewRule, destValue };
        }
        return prevNewRule;
      });
    }, []);
  
    const destinationTypes = [
      { label: "Block", value: "block" },
      { label: "Page", value: "page" },
    ];
  
    return (
      <div>
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
                <strong>Tag:</strong> {rule.tag}
                <br />
                <strong>Destination:</strong>{" "}
                {rule.destType === "block" ? "Block" : "Page"} - {rule.destValue}
              </div>
              <Button icon="trash" minimal onClick={() => deleteRule(index)} />
            </div>
          ))}
        </div>
  
        <Divider />
  
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
                        }))
                      }
                    />
                  ))}
                </Menu>
              }
              interactionKind={PopoverInteractionKind.CLICK}
            >
              <Button
                text={newRule.destType === "block" ? "Block" : "Page"}
                rightIcon="double-caret-vertical"
              />
            </Popover>
          </FormGroup>
  
          <FormGroup label={<strong>Destination Value</strong>} labelFor="destValue">
            {newRule.destType === "block" ? (
              <BlockInput
                value={newRule.destValue || ""}
                setValue={handleDestValueChange}
              />
            ) : (
              <PageInput
                id="destValue"
                placeholder="Enter Page Name"
                value={newRule.destValue || ""}
                setValue={handlePageValueChange}
                showButton={false}
                multiline={false}
              />
            )}
          </FormGroup>
  
          <Button onClick={addRule} intent="primary">
            Add Rule
          </Button>
        </div>
      </div>
    );
  };
  
  export default BlockDistributionSettings;