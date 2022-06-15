import { Schema } from 'airtight';

export interface GroupSummary {
    group: string;
    instances: number;
    createdAt: number;
    updatedAt: number;
}

export const GroupSummarySchema = new Schema<GroupSummary>({
    type: 'object',
    properties: {
        group: { type: 'string' },
        instances: { type: 'number' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
    }
});
