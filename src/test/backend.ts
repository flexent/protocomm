import { Event } from '@nodescript/event';

import { Protocol } from './protocol.js';
import { GroupSummary } from './schema/group-summary.js';
import { Instance } from './schema/instance.js';

export const instanceDb = new Map<string, Instance>();

// An in-memory implementation of protocol backend
export const protocolImpl: Protocol = {

    Heartbeat: {
        instanceCreated: new Event<{ instance: Instance }>(),
        instanceUpdated: new Event<{ instance: Instance }>(),
        instanceDeleted: new Event<{ instance: Instance }>(),

        async registerInstance(req) {
            const existing = instanceDb.get(req.id);
            const instance: Instance = {
                id: req.id,
                group: req.group,
                meta: req.meta ?? existing?.meta ?? {},
                createdAt: existing?.createdAt ?? Date.now(),
                updatedAt: Date.now(),
            };
            instanceDb.set(`${req.group}:${req.id}`, instance);
            return { instance };
        },

        async deleteInstance(req) {
            instanceDb.delete(`${req.group}:${req.id}`);
            return {};
        },

        async getAllGroups() {
            const groups = new Map<string, GroupSummary>();
            for (const instance of instanceDb.values()) {
                const g = groups.get(instance.group) || {
                    group: instance.group,
                    instances: 0,
                    createdAt: instance.createdAt,
                    updatedAt: instance.updatedAt,
                };
                g.instances += 1;
                g.createdAt = Math.min(g.createdAt, instance.createdAt);
                g.updatedAt = Math.max(g.updatedAt, instance.updatedAt);
                groups.set(g.group, g);
            }
            return {
                groups: [...groups.values()],
            };
        },

        async getGroup(req) {
            const instances = [...instanceDb.values()].filter(inst => inst.group === req.group);
            return { instances };
        },
    },

    System: {
        async getVersion() {
            return { version: '1.2.3' };
        }
    },

};
