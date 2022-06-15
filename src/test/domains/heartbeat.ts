import { Event } from 'typesafe-event';

import { DomainDef } from '../../main/domain.js';
import { GroupSummary, GroupSummarySchema } from '../schema/group-summary.js';
import { Instance, InstanceSchema } from '../schema/instance.js';

export interface HeartbeatDomain {

    registerInstance(req: {
        group: string;
        id: string;
        meta?: Record<string, unknown>;
    }): Promise<{ instance: Instance }>;

    deleteInstance(req: {
        group: string;
        id: string;
    }): Promise<{}>;

    getAllGroups(req: {}): Promise<{ groups: GroupSummary[] }>;

    getGroup(req: {
        group: string;
    }): Promise<{ instances: Instance[] }>;

    instanceCreated: Event<{ instance: Instance }>;
    instanceUpdated: Event<{ instance: Instance }>;
    instanceDeleted: Event<{ instance: Instance }>;

}

export const HeartbeatDomain: DomainDef<HeartbeatDomain> = {
    name: 'Heartbeat',
    methods: {
        registerInstance: {
            type: 'command',
            params: {
                group: { type: 'string' },
                id: { type: 'string' },
                meta: {
                    type: 'object',
                    properties: {},
                    additionalProperties: { type: 'any' },
                    optional: true,
                }
            },
            returns: {
                instance: InstanceSchema.schema,
            },
        },
        deleteInstance: {
            type: 'command',
            params: {
                group: { type: 'string' },
                id: { type: 'string' },
            },
            returns: {},
        },
        getAllGroups: {
            type: 'query',
            params: {},
            returns: {
                groups: {
                    type: 'array',
                    items: GroupSummarySchema.schema,
                }
            }
        },
        getGroup: {
            type: 'query',
            params: {
                group: { type: 'string' },
            },
            returns: {
                instances: {
                    type: 'array',
                    items: InstanceSchema.schema,
                }
            }
        }
    },
    events: {
        instanceCreated: {
            params: {
                instance: InstanceSchema.schema,
            }
        },
        instanceUpdated: {
            params: {
                instance: InstanceSchema.schema,
            }
        },
        instanceDeleted: {
            params: {
                instance: InstanceSchema.schema,
            }
        }
    }
};
