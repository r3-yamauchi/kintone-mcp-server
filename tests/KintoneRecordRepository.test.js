// tests/KintoneRecordRepository.test.js
// where: tests/KintoneRecordRepository.test.js
// what: KintoneRecordRepository.searchRecords のページング挙動を検証
// why: limit未指定時に全件取得することを保証するため
import test from 'node:test';
import assert from 'node:assert/strict';
import { KintoneRecordRepository } from '../src/repositories/KintoneRecordRepository.js';

// ダミークライアントを注入してHTTP呼び出しをモック
function createRepositoryWithStub(getRecordsStub) {
    const repo = new KintoneRecordRepository({});
    repo.client = { record: { getRecords: getRecordsStub } };
    repo.executeWithDetailedLogging = async (_op, _params, apiCall) => apiCall();
    return repo;
}

function makeRecords(count, startId = 1) {
    return Array.from({ length: count }, (_, idx) => {
        const id = startId + idx;
        return {
            $id: { value: String(id) },
            name: { value: `record-${id}` }
        };
    });
}

test('searchRecords paginates when no limit is specified', async () => {
    let callCount = 0;
    const stub = async () => {
        callCount += 1;
        if (callCount === 1) {
            return { records: makeRecords(500, 1) };
        }
        if (callCount === 2) {
            return { records: makeRecords(200, 501) };
        }
        return { records: [] };
    };

    const repo = createRepositoryWithStub(stub);
    const records = await repo.searchRecords(1, 'Status = "A"');

    assert.equal(callCount, 2, 'should fetch multiple pages');
    assert.equal(records.length, 700);
    assert.equal(records[0].recordId, '1');
    assert.equal(records.at(-1).recordId, '700');
});

test('searchRecords respects user-provided limit without pagination', async () => {
    let callCount = 0;
    const stub = async () => {
        callCount += 1;
        return { records: makeRecords(3, 10) };
    };

    const repo = createRepositoryWithStub(stub);
    const records = await repo.searchRecords(1, 'Status = "A" limit 3');

    assert.equal(callCount, 1, 'should not paginate when limit exists');
    assert.equal(records.length, 3);
    assert.deepEqual(
        records.map((r) => r.recordId),
        ['10', '11', '12']
    );
});

test('searchRecords falls back to offset paging when query has order by', async () => {
    let callCount = 0;
    const queries = [];
    const stub = async (params) => {
        callCount += 1;
        queries.push(params.query);
        if (callCount === 1) return { records: makeRecords(500, 1) };
        if (callCount === 2) return { records: makeRecords(10, 501) };
        return { records: [] };
    };

    const repo = createRepositoryWithStub(stub);
    const records = await repo.searchRecords(1, 'Status = "A" order by 更新日時 desc');

    assert.equal(callCount, 2, 'offset paging should be used');
    assert.equal(records.length, 510);
    assert.equal(records[0].recordId, '1');
    assert.equal(records.at(-1).recordId, '510');
    assert.ok(queries[0].includes('offset 0'));
    assert.ok(queries[1].includes('offset 500'));
});

test('searchRecords throws when limit exceeds 500', async () => {
    const repo = createRepositoryWithStub(async () => ({ records: [] }));
    await assert.rejects(
        () => repo.searchRecords(1, 'Status = "A" limit 600'),
        /limit上限は500/
    );
});
