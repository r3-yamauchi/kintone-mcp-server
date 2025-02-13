// src/server/tools/UserTools.js
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { ResponseBuilder } from '../../utils/ResponseBuilder.js';

// ユーザー関連のツールを処理する関数
export async function handleUserTools(name, args, repository) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('user', name, args);
    switch (name) {
        case 'get_users': {
            const codes = args.codes || [];
            
            if (codes.length > 0) {
                ValidationUtils.validateArray(codes, 'codes');
            }
            
            return repository.getUsers(codes);
        }
        
        case 'get_groups': {
            const codes = args.codes || [];
            
            if (codes.length > 0) {
                ValidationUtils.validateArray(codes, 'codes');
            }
            
            return repository.getGroups(codes);
        }
        
        case 'get_group_users': {
            ValidationUtils.validateRequired(args, ['group_code']);
            ValidationUtils.validateString(args.group_code, 'group_code');
            
            return repository.getGroupUsers(args.group_code);
        }
        
        default:
            throw new Error(`Unknown user tool: ${name}`);
    }
}
