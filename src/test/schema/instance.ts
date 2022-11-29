import { Schema } from '@nodescript/schema';

export interface Instance {
    id: string;
    group: string;
    createdAt: number;
    updatedAt: number;
    meta: Record<string, unknown>;
}

export const InstanceSchema = new Schema<Instance>({
    type: 'object',
    properties: {
        id: { type: 'string' },
        group: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
        meta: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' }
        },
    }
});
