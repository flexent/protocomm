import assert from 'assert';
import EventEmitter from 'events';

import { RpcClient } from '../main/rpc-client.js';
import { RpcHandler } from '../main/rpc-handler.js';
import { instanceDb, protocolImpl } from './backend.js';
import { protocolIndex } from './protocol.js';

// Event emitter is used as a duplex message bus
// - client emits "request" and listens to "response"
// - backend listens to "request" and emits "response"
const transport = new EventEmitter();

const rpcClient = new RpcClient(
    protocolIndex,
    req => transport.emit('request', req),
);

const rpcHandler = new RpcHandler(
    protocolIndex,
    protocolImpl,
    res => transport.emit('response', res),
    evt => transport.emit('response', evt),
);

transport.on('request', req => rpcHandler.processMessage(req));
transport.on('response', res => rpcClient.processMessage(res));

const { client } = rpcClient;

describe('RPC over EventEmitter', () => {

    // Reset backend on each test
    beforeEach(() => instanceDb.clear());

    describe('System', () => {
        it('getVersion', async () => {
            const { version } = await client.System.getVersion({});
            assert.strictEqual(version, '1.2.3');
        });
    });

    describe('Heartbeat', () => {

        it('registerInstance', async () => {
            const res1 = await client.Heartbeat.registerInstance({ id: 'one', group: 'foo' });
            const res2 = await client.Heartbeat.registerInstance({ id: 'two', group: 'foo', meta: { info: 1 } });
            const res3 = await client.Heartbeat.registerInstance({ id: 'two', group: 'foo', meta: { info: 2 } });
            const res4 = await client.Heartbeat.registerInstance({ id: 'two', group: 'bar' });
            assert.strictEqual(res1.instance.id, 'one');
            assert.strictEqual(res1.instance.group, 'foo');
            assert.strictEqual(res2.instance.id, 'two');
            assert.strictEqual(res2.instance.group, 'foo');
            assert.strictEqual(res3.instance.id, 'two');
            assert.strictEqual(res3.instance.group, 'foo');
            assert.strictEqual(res4.instance.id, 'two');
            assert.strictEqual(res4.instance.group, 'bar');
            assert.strictEqual(instanceDb.size, 3);
            assert.deepStrictEqual(instanceDb.get('foo:two')?.meta, { info: 2 });
        });

        it('deleteInstance', async () => {
            instanceDb.set('group:id', {
                id: 'id',
                group: 'group',
                meta: {},
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            assert.strictEqual(instanceDb.size, 1);
            const res = await client.Heartbeat.deleteInstance({ id: 'id', group: 'group' });
            assert.deepStrictEqual(res, {});
            assert.strictEqual(instanceDb.size, 0);
        });

        it('getAllGroups', async () => {
            await client.Heartbeat.registerInstance({ id: 'one', group: 'foo' });
            await client.Heartbeat.registerInstance({ id: 'two', group: 'foo', meta: { info: 1 } });
            await client.Heartbeat.registerInstance({ id: 'two', group: 'foo', meta: { info: 2 } });
            await client.Heartbeat.registerInstance({ id: 'two', group: 'bar' });
            const { groups } = await client.Heartbeat.getAllGroups({});
            assert.strictEqual(groups.find(_ => _.group === 'foo')?.instances, 2);
            assert.strictEqual(groups.find(_ => _.group === 'bar')?.instances, 1);
        });

        it('getGroup', async () => {
            await client.Heartbeat.registerInstance({ id: 'one', group: 'foo' });
            await client.Heartbeat.registerInstance({ id: 'two', group: 'foo', meta: { info: 1 } });
            await client.Heartbeat.registerInstance({ id: 'two', group: 'foo', meta: { info: 2 } });
            await client.Heartbeat.registerInstance({ id: 'two', group: 'bar' });
            const { instances } = await client.Heartbeat.getGroup({ group: 'foo' });
            assert.strictEqual(instances.length, 2);
        });

    });

});
