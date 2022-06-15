import { DomainDef } from '../../main/domain.js';

export interface SystemDomain {
    getVersion(req: {}): Promise<{ version: string }>;
}

export const SystemDomain: DomainDef<SystemDomain> = {
    name: 'System',
    methods: {
        getVersion: {
            type: 'query',
            params: {},
            returns: {
                version: { type: 'string' }
            }
        }
    },
    events: {}
};
