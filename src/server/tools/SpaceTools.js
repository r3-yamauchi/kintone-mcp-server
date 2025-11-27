// src/server/tools/SpaceTools.js
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { ResponseBuilder } from '../../utils/ResponseBuilder.js';

// スペース関連のツールを処理する関数
export async function handleSpaceTools(name, args, repository) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('space', name, args);
    
    switch (name) {
        case 'get_space': {
            ValidationUtils.validateRequired(args, ['space_id']);
            
            const space = await repository.getSpace(args.space_id);
            return space;
        }
        
        case 'update_space': {
            ValidationUtils.validateRequired(args, ['space_id']);
            
            await repository.updateSpace(args.space_id, {
                name: args.name,
                isPrivate: args.isPrivate,
                fixedMember: args.fixedMember,
                useMultiThread: args.useMultiThread,
            });
            return ResponseBuilder.success();
        }
        
        case 'update_space_body': {
            ValidationUtils.validateRequired(args, ['space_id', 'body']);
            ValidationUtils.validateString(args.body, 'body');
            
            await repository.updateSpaceBody(args.space_id, args.body);
            return ResponseBuilder.success();
        }
        
        case 'get_space_members': {
            ValidationUtils.validateRequired(args, ['space_id']);
            
            const members = await repository.getSpaceMembers(args.space_id);
            return members;
        }
        
        case 'update_space_members': {
            ValidationUtils.validateRequired(args, ['space_id', 'members']);
            ValidationUtils.validateArray(args.members, 'members');
            
            await repository.updateSpaceMembers(args.space_id, args.members);
            return ResponseBuilder.success();
        }
        
        case 'add_thread': {
            ValidationUtils.validateRequired(args, ['space_id', 'name']);
            ValidationUtils.validateString(args.name, 'name');
            
            const response = await repository.addThread(args.space_id, args.name);
            return ResponseBuilder.withId('thread_id', response.id);
        }
        
        case 'update_thread': {
            ValidationUtils.validateRequired(args, ['thread_id']);
            
            await repository.updateThread(args.thread_id, {
                name: args.name,
                body: args.body,
            });
            return ResponseBuilder.success();
        }
        
        case 'add_thread_comment': {
            ValidationUtils.validateRequired(args, ['space_id', 'thread_id', 'text']);
            ValidationUtils.validateString(args.text, 'text');
            
            const response = await repository.addThreadComment(
                args.space_id,
                args.thread_id,
                {
                    text: args.text,
                    mentions: args.mentions || [],
                }
            );
            return ResponseBuilder.withId('comment_id', response.id);
        }
        
        case 'add_guests': {
            ValidationUtils.validateRequired(args, ['guests']);
            ValidationUtils.validateArray(args.guests, 'guests', { minLength: 1 });
            
            await repository.addGuests(args.guests);
            return ResponseBuilder.success();
        }
        
        case 'update_space_guests': {
            ValidationUtils.validateRequired(args, ['space_id', 'guests']);
            ValidationUtils.validateArray(args.guests, 'guests');
            
            await repository.updateSpaceGuests(args.space_id, args.guests);
            return ResponseBuilder.success();
        }
        
        default:
            throw new Error(`Unknown space tool: ${name}`);
    }
}
