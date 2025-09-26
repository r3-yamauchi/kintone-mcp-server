import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ToolRouter } from './ToolRouter.js';
import { convertDropdownFieldType } from '../../utils/DataTransformers.js';
import { handleToolError } from './ErrorHandlers.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';

export async function executeToolRequest(request, repository) {
    const { name, arguments: args } = request.params;
    LoggingUtils.info('tool', 'tool_request_received', { name });
    LoggingUtils.debug('tool', 'tool_request_payload', request.params);
    
    if (!name) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `ツール名が指定されていません。`
        );
    }
    
    if (!args) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `ツール "${name}" の引数が指定されていません。`
        );
    }
    
    convertDropdownFieldType(args);
    
    LoggingUtils.info('tool', 'tool_execution_start', { name });
    LoggingUtils.debug('tool', 'tool_arguments', args);

    try {
        const router = new ToolRouter();
        
        const lookupResponse = router.handleLookupFieldSpecialCase(name, args, repository);
        if (lookupResponse) {
            return await lookupResponse;
        }
        
        const result = await router.routeToolRequest(name, args, repository);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        return handleToolError(error);
    }
}
