import { Event } from 'nanoevent';

export class ChannelEvent<T> extends Event<{ channel: string; data: T }> {}
