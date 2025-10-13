// scripts/ensure-pnpm.js
// WHERE: scripts/ensure-pnpm.js
// WHAT: Enforce usage of pnpm by inspecting npm_execpath before dependency installation
// WHY: Prevent accidental installs via npm/yarn, aligning with pnpm security guidance

const execPath = process.env.npm_execpath || '';

const isPnpm = execPath.includes('pnpm');

if (!isPnpm) {
    const manager = execPath ? execPath.split(/[\\/]/).pop() : 'unknown tool';
    const message = [
        'このプロジェクトでは pnpm の使用が必須です。',
        `検出されたパッケージマネージャー: ${manager}`,
        `以下を実行して pnpm を有効化してください:\n  corepack enable\n  corepack prepare pnpm@10.13.1 --activate`
    ].join('\n');

    console.error(message);
    process.exit(1);
}
