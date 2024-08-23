import {
  Button,
  Divider,
  FormGroup,
  Menu,
  MenuItem,
  Popover,
  PopoverInteractionKind,
} from "@blueprintjs/core";
import React, { useState, useEffect, useCallback, useRef } from "react";
import PageInput from "roamjs-components/components/PageInput";
import BlockInput from "roamjs-components/components/BlockInput";
import { getExtensionAPISetting } from "../utils.js";
import { createPullWatch, removePullWatch } from "../utils.js";

const BlockDistributionSettings = ({ extensionAPI }) => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    destType: "block",
  });
  const pullWatchesRef = useRef({});

  const handlePullWatch = useCallback((rule) => (before, after) => {
    console.log(`Pull watch triggered for ${rule.tag}:`, before, after);
    // Implement your block distribution logic here
  }, []);

  const addRule = async () => {
    if (newRule.tag && newRule.destValue) {
      const updatedRules = [...rules, newRule];
      setRules(updatedRules);
      await extensionAPI.settings.set("blockDistributionRules", updatedRules);
      const callback = await createPullWatch(newRule, handlePullWatch(newRule));
      if (callback) {
        pullWatchesRef.current[newRule.tag] = callback;
      }
      setNewRule({
        destType: "block",
      });
    }
  };

  const deleteRule = async (index) => {
    const updatedRules = [...rules];
    const removedRule = updatedRules.splice(index, 1)[0];
    setRules(updatedRules);
    await extensionAPI.settings.set("blockDistributionRules", updatedRules);
    const callback = pullWatchesRef.current[removedRule.tag];
    if (callback) {
      await removePullWatch(removedRule, callback);
      delete pullWatchesRef.current[removedRule.tag];
    }
  };

  useEffect(() => {
    const fetchRules = async () => {
      const initialRules = await getExtensionAPISetting(
        extensionAPI,
        "blockDistributionRules",
        []
      );
      setRules(initialRules);
      // Add pull watches for existing rules
      for (const rule of initialRules) {
        const callback = await createPullWatch(rule, handlePullWatch(rule));
        if (callback) {
          pullWatchesRef.current[rule.tag] = callback;
        }
      }
    };

    fetchRules();

    // Cleanup function to remove all pull watches when component unmounts
    return () => {
      Object.entries(pullWatchesRef.current).forEach(([tag, callback]) => {
        const rule = rules.find(r => r.tag === tag);
        if (rule) {
          removePullWatch(rule, callback);
        }
      });
    };
  }, [extensionAPI, handlePullWatch]);
  
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