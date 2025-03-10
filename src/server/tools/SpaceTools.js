// src/server/tools/SpaceTools.js

// スペース関連のツールを処理する関数
export async function handleSpaceTools(name, args, repository) {
    switch (name) {
        case 'get_space': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching space: ${args.space_id}`);
            
            return repository.getSpace(args.space_id);
        }
        
        case 'update_space': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating space: ${args.space_id}`);
            console.error(`Settings:`, JSON.stringify({
                name: args.name,
                isPrivate: args.isPrivate,
                fixedMember: args.fixedMember,
                useMultiThread: args.useMultiThread,
            }, null, 2));
            
            await repository.updateSpace(args.space_id, {
                name: args.name,
                isPrivate: args.isPrivate,
                fixedMember: args.fixedMember,
                useMultiThread: args.useMultiThread,
            });
            return { success: true };
        }
        
        case 'update_space_body': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            if (!args.body) {
                throw new Error('body は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating space body: ${args.space_id}`);
            
            await repository.updateSpaceBody(args.space_id, args.body);
            return { success: true };
        }
        
        case 'get_space_members': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching space members: ${args.space_id}`);
            
            return repository.getSpaceMembers(args.space_id);
        }
        
        case 'update_space_members': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            if (!args.members) {
                throw new Error('members は必須パラメータです。');
            }
            if (!Array.isArray(args.members)) {
                throw new Error('members は配列形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating space members: ${args.space_id}`);
            console.error(`Members:`, JSON.stringify(args.members, null, 2));
            
            await repository.updateSpaceMembers(args.space_id, args.members);
            return { success: true };
        }
        
        case 'add_thread': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            if (!args.name) {
                throw new Error('name は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Adding thread to space: ${args.space_id}`);
            console.error(`Thread name: ${args.name}`);
            
            const response = await repository.addThread(args.space_id, args.name);
            return { thread_id: response.id };
        }
        
        case 'update_thread': {
            // 引数のチェック
            if (!args.thread_id) {
                throw new Error('thread_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating thread: ${args.thread_id}`);
            console.error(`Settings:`, JSON.stringify({
                name: args.name,
                body: args.body ? '(content)' : undefined,
            }, null, 2));
            
            await repository.updateThread(args.thread_id, {
                name: args.name,
                body: args.body,
            });
            return { success: true };
        }
        
        case 'add_thread_comment': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            if (!args.thread_id) {
                throw new Error('thread_id は必須パラメータです。');
            }
            if (!args.text) {
                throw new Error('text は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Adding comment to thread: ${args.thread_id} in space: ${args.space_id}`);
            console.error(`Text: ${args.text}`);
            if (args.mentions && args.mentions.length > 0) {
                console.error(`Mentions:`, JSON.stringify(args.mentions, null, 2));
            }
            
            const response = await repository.addThreadComment(
                args.space_id,
                args.thread_id,
                {
                    text: args.text,
                    mentions: args.mentions || [],
                }
            );
            return { comment_id: response.id };
        }
        
        case 'add_guests': {
            // 引数のチェック
            if (!args.guests) {
                throw new Error('guests は必須パラメータです。');
            }
            if (!Array.isArray(args.guests)) {
                throw new Error('guests は配列形式で指定する必要があります。');
            }
            if (args.guests.length === 0) {
                throw new Error('guests には少なくとも1つのゲスト情報を指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Adding guests:`, JSON.stringify(args.guests, null, 2));
            
            await repository.addGuests(args.guests);
            return { success: true };
        }
        
        case 'update_space_guests': {
            // 引数のチェック
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            if (!args.guests) {
                throw new Error('guests は必須パラメータです。');
            }
            if (!Array.isArray(args.guests)) {
                throw new Error('guests は配列形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating space guests: ${args.space_id}`);
            console.error(`Guests:`, JSON.stringify(args.guests, null, 2));
            
            await repository.updateSpaceGuests(args.space_id, args.guests);
            return { success: true };
        }
        
        default:
            throw new Error(`Unknown space tool: ${name}`);
    }
}
