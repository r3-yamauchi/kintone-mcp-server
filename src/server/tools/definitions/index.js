// src/server/tools/definitions/index.js

import { recordToolDefinitions } from './RecordToolDefinitions.js';
import { appToolDefinitions } from './AppToolDefinitions.js';
import { spaceToolDefinitions } from './SpaceToolDefinitions.js';
import { fieldToolDefinitions } from './FieldToolDefinitions.js';
import { documentationToolDefinitions } from './DocumentationToolDefinitions.js';
import { layoutToolDefinitions } from './LayoutToolDefinitions.js';
import { userToolDefinitions } from './UserToolDefinitions.js';
import { systemToolDefinitions } from './SystemToolDefinitions.js';
import { fileToolDefinitions } from './FileToolDefinitions.js';

/**
 * 全てのツール定義をフラットな配列として提供
 */
export const allToolDefinitions = [
    ...recordToolDefinitions,
    ...appToolDefinitions,
    ...spaceToolDefinitions,
    ...fieldToolDefinitions,
    ...documentationToolDefinitions,
    ...layoutToolDefinitions,
    ...userToolDefinitions,
    ...systemToolDefinitions,
    ...fileToolDefinitions
];
