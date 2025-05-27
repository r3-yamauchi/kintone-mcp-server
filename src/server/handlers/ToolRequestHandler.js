import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ToolRouter } from './ToolRouter.js';
import { convertDropdownFieldType } from '../../utils/DataTransformers.js';
import { handleToolError } from './ErrorHandlers.js';

export async function executeToolRequest(request, repository) {
    console.error(`Request params:`, JSON.stringify(request.params, null, 2));
    
    const { name, arguments: args } = request.params;
    
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
    
    console.error(`Executing tool: ${name}`);
    console.error(`Arguments:`, JSON.stringify(args, null, 2));

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

