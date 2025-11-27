import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { handleRecordTools } from '../tools/RecordTools.js';
import { handleAppTools } from '../tools/AppTools.js';
import { handleSpaceTools } from '../tools/SpaceTools.js';
import { handleFieldTools } from '../tools/FieldTools.js';
import { handleDocumentationTools } from '../tools/DocumentationTools.js';
import { handleLayoutTools } from '../tools/LayoutTools.js';
import { handleUserTools } from '../tools/UserTools.js';
import { handleSystemTools } from '../tools/SystemTools.js';
import { handleFileTools } from '../tools/FileTools.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';

export class ToolRouter {
    constructor() {
        this.toolCategories = {
            record: {
                tools: ['get_record', 'search_records', 'create_record', 'update_record', 'add_record_comment', 
                       'update_record_status', 'update_record_assignees',
                       'get_record_comments', 'create_records', 'upsert_record',
                       'upsert_records'],
                handler: handleRecordTools
            },
            app: {
                tools: [
                    'create_app', 'deploy_app', 'get_deploy_status', 'update_app_settings', 'get_apps_info',
                    'get_form_layout', 'get_form_fields', 'update_form_layout', 'get_preview_app_settings',
                    'get_preview_form_fields', 'get_preview_form_layout',
                    'move_app_to_space', 'move_app_from_space', 'get_app_actions', 'get_app_plugins',
                    'get_process_management', 'update_process_management', 'get_views', 'update_views', 'get_app_acl',
                    'get_field_acl', 'update_field_acl', 'get_reports', 'update_reports',
                    'get_notifications', 'update_notifications', 'get_per_record_notifications', 'update_per_record_notifications',
                    'get_reminder_notifications', 'update_reminder_notifications', 'update_app_actions', 'update_plugins',
                    'get_app_customize', 'update_app_customize', 'update_app_acl', 'get_record_acl', 'evaluate_records_acl'
                ],
                handler: handleAppTools
            },
            space: {
                tools: [
                    'get_space', 'update_space', 'update_space_body', 'get_space_members',
                    'update_space_members', 'add_thread', 'update_thread', 'add_thread_comment',
                    'add_guests', 'update_space_guests'
                ],
                handler: handleSpaceTools
            },
            field: {
                tools: [
                    'add_fields', 'update_field', 'create_choice_field', 'create_reference_table_field',
                    'create_text_field', 'create_number_field', 'create_date_field', 'create_time_field',
                    'create_datetime_field', 'create_rich_text_field', 'create_attachment_field',
                    'create_user_select_field', 'create_subtable_field', 'create_calc_field',
                    'create_status_field', 'create_related_records_field', 'create_link_field'
                ],
                handler: handleFieldTools
            },
            documentation: {
                tools: [
                    'get_field_type_documentation', 'get_available_field_types',
                    'get_documentation_tool_description', 'get_field_creation_tool_description',
                    'get_group_element_structure', 'get_query_language_documentation'
                ],
                handler: handleDocumentationTools
            },
            file: {
                tools: ['upload_file', 'download_file'],
                handler: handleFileTools
            },
            layout: {
                tools: [
                    'create_form_layout', 'update_form_layout', 'add_layout_element',
                    'create_group_layout', 'create_table_layout'
                ],
                handler: handleLayoutTools
            },
            user: {
                tools: ['get_users', 'get_groups', 'get_group_users'],
                handler: handleUserTools
            },
            system: {
                tools: ['get_kintone_domain', 'get_kintone_username'],
                handler: handleSystemTools
            }
        };
    }

    findToolCategory(toolName) {
        for (const [categoryName, category] of Object.entries(this.toolCategories)) {
            if (category.tools.includes(toolName)) {
                return { categoryName, handler: category.handler };
            }
        }
        return null;
    }

    async routeToolRequest(toolName, args, repository) {
        const toolCategory = this.findToolCategory(toolName);
        
        if (!toolCategory) {
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${toolName}`
            );
        }

        return await toolCategory.handler(toolName, args, repository);
    }

    handleLookupFieldSpecialCase(toolName, args, repository) {
        if (toolName !== 'create_lookup_field') {
            return null;
        }

        return this.createLookupFieldResponse(args, repository);
    }

    async createLookupFieldResponse(args, repository) {
        const fieldConfig = await handleFieldTools('create_lookup_field', args, repository);

        const note = `注意: create_lookup_field ツールは設定オブジェクトを生成するだけのヘルパーツールです。実際にフィールドを追加するには、この結果を add_fields ツールに渡してください。`;
        const lookupNote = `
【重要】ルックアップフィールドについて
- ルックアップフィールドは基本的なフィールドタイプ（SINGLE_LINE_TEXT、NUMBERなど）に、lookup属性を追加したものです
- フィールドタイプとして "LOOKUP" を指定するのではなく、適切な基本タイプを指定し、その中にlookupプロパティを設定します
- 参照先アプリは運用環境にデプロイされている必要があります
- ルックアップのキーフィールド自体はフィールドマッピングに含めないでください
- lookupPickerFieldsとsortは省略可能ですが、指定することを強く推奨します
`;
        const example = `使用例:
add_fields({
  app_id: アプリID,
  properties: {
    "${fieldConfig.code}": ${JSON.stringify(fieldConfig, null, 2)}
  }
});`;
        LoggingUtils.info('field', 'lookup_field_guidance_generated', { fieldCode: fieldConfig.code });
        
        const result = {
            ...fieldConfig,
            _note: note,
            _lookupNote: lookupNote,
            _example: example
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                },
                {
                    type: 'text',
                    text: note
                },
                {
                    type: 'text',
                    text: lookupNote
                },
                {
                    type: 'text',
                    text: example
                }
            ]
        };
    }
}
