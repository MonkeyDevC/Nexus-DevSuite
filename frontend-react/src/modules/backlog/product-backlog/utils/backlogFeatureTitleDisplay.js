/**
 * Compat: el backlog importaba este helper; la lógica vive en workItemHumanIds.
 * @param {string} rawTitle
 * @param {number|null|undefined} featureNumber
 */
export { stripEmbeddedFeatureCodeFromTitle as backlogStripRedundantFeatureCodeFromTitle } from "../../../../shared/workspace/workItemHumanIds.js";
