import { Event } from '@nodescript/event';

export class ChannelEvent<T> extends Event<{ channel: string; data: T }> {}
