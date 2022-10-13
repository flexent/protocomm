import { Event } from '@flexent/event';

export class ChannelEvent<T> extends Event<{ channel: string; data: T }> {}
