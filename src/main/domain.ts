import { ObjectPropsDef } from 'airtight';
import { Event } from 'nanoevent';

export interface DomainDef<S> {
    name: string;
    methods: DomainMethods<S>;
    events: DomainEvents<S>;
}

export type DomainMethod<Params, Returns> = (params: Params) => Promise<Returns>;

type IsMethod<S, K extends keyof S> = S[K] extends DomainMethod<any, any> ? K : never;
type IsEvent<S, K extends keyof S> = S[K] extends Event<any> ? K : never;

export type DomainMethods<S> = {
    [K in keyof S as IsMethod<S, K>]: S[K] extends DomainMethod<infer P, infer R>
        ? DomainMethodDef<P, R>
        : never;
};

export type DomainEvents<S> = {
    [K in keyof S as IsEvent<S, K>]: S[K] extends Event<infer E> ? DomainEventDef<E> : never;
};

export interface DomainMethodDef<P = any, R = any> {
    type: MethodType;
    params: ObjectPropsDef<P>;
    returns: ObjectPropsDef<R>;
}

export interface DomainEventDef<E> {
    params: ObjectPropsDef<E>;
}

export type MethodType = 'query' | 'command';

export interface DomainMethodStat {
    domain: string;
    method: string;
    latency: number;
    error?: string;
}
