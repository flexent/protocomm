import { Exception } from '@flexent/exception';
import { Schema } from 'airtight';

import { DomainDef, DomainEventDef, DomainMethodDef } from './domain.js';

export type ProtocolMethodDesc = {
    domainDef: DomainDef<any>;
    methodDef: DomainMethodDef<any, any>;
    reqSchema: Schema<any>;
    resSchema: Schema<any>;
};

export type ProtocolEventDesc = {
    domainDef: DomainDef<any>;
    eventDef: DomainEventDef<any>;
    paramSchema: Schema<any>;
};

export type ProtocolDomains<P> = {
    [K in keyof P]: DomainDef<P[K]>;
};

/**
 * Convenience class for accessing static metadata for domains.
 */
export class ProtocolIndex<P> {

    protected methodCache = new Map<string, ProtocolMethodDesc>();
    protected eventCache = new Map<string, ProtocolEventDesc>();

    constructor(
        readonly index: ProtocolDomains<P>
    ) {
        this.buildMethodCache();
        this.buildEventCache();
    }

    *[Symbol.iterator](): IterableIterator<[string, DomainDef<any>]> {
        for (const [domainName, domainDef] of Object.entries(this.index)) {
            yield [domainName, domainDef as DomainDef<any>];
        }
    }

    lookupMethod(domainName: string, methodName: string): ProtocolMethodDesc {
        const key = `${domainName}.${methodName}`;
        const desc = this.methodCache.get(key);
        if (!desc) {
            throw new MethodNotFound(key);
        }
        return desc;
    }

    lookupEvent(domainName: string, eventName: string): ProtocolEventDesc {
        const key = `${domainName}.${eventName}`;
        const desc = this.eventCache.get(key);
        if (!desc) {
            throw new EventNotFound(key);
        }
        return desc;
    }

    protected buildMethodCache() {
        for (const [domainName, _domainDef] of Object.entries(this.index)) {
            const domainDef = _domainDef as DomainDef<any>;
            for (const [methodName, methodDef] of Object.entries(domainDef.methods)) {
                const key = `${domainName}.${methodName}`;
                const reqSchema = new Schema({
                    type: 'object',
                    properties: methodDef.params,
                });
                const resSchema = new Schema({
                    type: 'object',
                    properties: methodDef.returns,
                });
                this.methodCache.set(key, {
                    domainDef,
                    methodDef,
                    reqSchema,
                    resSchema,
                });
            }
        }
    }

    protected buildEventCache() {
        for (const [domainName, _domainDef] of Object.entries(this.index)) {
            const domainDef = _domainDef as DomainDef<any>;
            for (const [eventName, eventDef] of Object.entries(domainDef.events)) {
                const key = `${domainName}.${eventName}`;
                const paramSchema = new Schema({
                    type: 'object',
                    properties: eventDef.params,
                });
                this.eventCache.set(key, {
                    domainDef,
                    eventDef,
                    paramSchema,
                });
            }
        }
    }

}

export class MethodNotFound extends Exception {
    status = 404;

    constructor(key: string) {
        super(`Method ${key} not found`);
    }
}

export class EventNotFound extends Exception {
    status = 404;

    constructor(key: string) {
        super(`Event ${key} not found`);
    }
}
