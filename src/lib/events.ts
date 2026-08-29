import { EventEmitter } from "events";

class BugTrailEventEmitter extends EventEmitter {}

export const bugTrailEvents = new BugTrailEventEmitter();
