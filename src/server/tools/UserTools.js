// src/server/tools/UserTools.js

// ユーザー関連のツールを処理する関数
export async function handleUserTools(name, args, repository) {
    switch (name) {
        case 'get_users': {
            // 引数のチェック
            const codes = args.codes || [];
            
            // ユーザー情報を取得
            const response = await repository.getUsers(codes);
            return response;
        }
        
        case 'get_groups': {
            // 引数のチェック
            const codes = args.codes || [];
            
            // グループ情報を取得
            const response = await repository.getGroups(codes);
            return response;
        }
        
        case 'get_group_users': {
            // 引数のチェック
            if (!args.group_code) {
                throw new Error('group_code は必須パラメータです。');
            }
            
            // グループに所属するユーザーを取得
            const response = await repository.getGroupUsers(args.group_code);
            return response;
        }
        
        default:
            throw new Error(`Unknown user tool: ${name}`);
    }
}
