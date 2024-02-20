/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

<<<<<<< HEAD
import * as prioritization from './prioritization';
import {
    OmnisharpServerProcessRequestComplete,
    OmnisharpServerProcessRequestStart,
    OmnisharpServerDequeueRequest,
    OmnisharpServerEnqueueRequest,
} from './loggingEvents';
import { EventStream } from '../eventStream';
=======
import { Logger } from '../logger';
import * as prioritization from './prioritization';
>>>>>>> origin/future

export interface Request {
    command: string;
    data?: any;
    onSuccess(value: any): void;
    onError(err: any): void;
    startTime?: number;
    endTime?: number;
<<<<<<< HEAD
    id?: number;
=======
>>>>>>> origin/future
}

/**
 * This data structure manages a queue of requests that have been made and requests that have been
 * sent to the OmniSharp server and are waiting on a response.
 */
class RequestQueue {
    private _pending: Request[] = [];
    private _waiting: Map<number, Request> = new Map<number, Request>();

    public constructor(
        private _name: string,
        private _maxSize: number,
<<<<<<< HEAD
        private eventStream: EventStream,
        private _makeRequest: (request: Request) => number
    ) {}
=======
        private _logger: Logger,
        private _makeRequest: (request: Request) => number) {
    }
>>>>>>> origin/future

    /**
     * Enqueue a new request.
     */
    public enqueue(request: Request) {
<<<<<<< HEAD
        this.eventStream.post(new OmnisharpServerEnqueueRequest(this._name, request.command));
=======
        this._logger.appendLine(`Enqueue ${this._name} request for ${request.command}.`);
>>>>>>> origin/future
        this._pending.push(request);
    }

    /**
     * Dequeue a request that has completed.
     */
    public dequeue(id: number) {
        const request = this._waiting.get(id);

        if (request) {
            this._waiting.delete(id);
<<<<<<< HEAD
            this.eventStream.post(new OmnisharpServerDequeueRequest(this._name, 'waiting', request.command, id));
=======
            this._logger.appendLine(`Dequeue ${this._name} request for ${request.command} (${id}).`);
>>>>>>> origin/future
        }

        return request;
    }

    public cancelRequest(request: Request) {
<<<<<<< HEAD
        const index = this._pending.indexOf(request);
        if (index !== -1) {
            this._pending.splice(index, 1);
            this.eventStream.post(new OmnisharpServerDequeueRequest(this._name, 'pending', request.command));
        }

        if (request.id) {
            this.dequeue(request.id);
        }
=======
        let index = this._pending.indexOf(request);
        if (index !== -1) {
            this._pending.splice(index, 1);

            // Note: This calls reject() on the promise returned by OmniSharpServer.makeRequest
            request.onError(new Error(`Pending request cancelled: ${request.command}`));
        }

        // TODO: Handle cancellation of a request already waiting on the OmniSharp server.
>>>>>>> origin/future
    }

    /**
     * Returns true if there are any requests pending to be sent to the OmniSharp server.
     */
    public hasPending() {
        return this._pending.length > 0;
    }

    /**
     * Returns true if the maximum number of requests waiting on the OmniSharp server has been reached.
     */
    public isFull() {
        return this._waiting.size >= this._maxSize;
    }

    /**
     * Process any pending requests and send them to the OmniSharp server.
     */
    public processPending() {
        if (this._pending.length === 0) {
            return;
        }

<<<<<<< HEAD
        const availableRequestSlots = this._maxSize - this._waiting.size;
        this.eventStream.post(new OmnisharpServerProcessRequestStart(this._name, availableRequestSlots));

        for (let i = 0; i < availableRequestSlots && this._pending.length > 0; i++) {
            const item = this._pending.shift()!; // We know from this._pending.length that we can still shift
=======
        this._logger.appendLine(`Processing ${this._name} queue`);
        this._logger.increaseIndent();

        const slots = this._maxSize - this._waiting.size;

        for (let i = 0; i < slots && this._pending.length > 0; i++) {
            const item = this._pending.shift();
>>>>>>> origin/future
            item.startTime = Date.now();

            const id = this._makeRequest(item);
            this._waiting.set(id, item);

            if (this.isFull()) {
                break;
            }
        }
<<<<<<< HEAD
        this.eventStream.post(new OmnisharpServerProcessRequestComplete());
=======

        this._logger.decreaseIndent();
>>>>>>> origin/future
    }
}

export class RequestQueueCollection {
    private _isProcessing: boolean;
    private _priorityQueue: RequestQueue;
    private _normalQueue: RequestQueue;
    private _deferredQueue: RequestQueue;

<<<<<<< HEAD
    public constructor(eventStream: EventStream, concurrency: number, makeRequest: (request: Request) => number) {
        this._isProcessing = false;
        this._priorityQueue = new RequestQueue('Priority', 1, eventStream, makeRequest);
        this._normalQueue = new RequestQueue('Normal', concurrency, eventStream, makeRequest);
        this._deferredQueue = new RequestQueue(
            'Deferred',
            Math.max(Math.floor(concurrency / 4), 2),
            eventStream,
            makeRequest
        );
=======
    public constructor(
        logger: Logger,
        concurrency: number,
        makeRequest: (request: Request) => number
    ) {
        this._priorityQueue = new RequestQueue('Priority', 1, logger, makeRequest);
        this._normalQueue = new RequestQueue('Normal', concurrency, logger, makeRequest);
        this._deferredQueue = new RequestQueue('Deferred', Math.max(Math.floor(concurrency / 4), 2), logger, makeRequest);
>>>>>>> origin/future
    }

    private getQueue(command: string) {
        if (prioritization.isPriorityCommand(command)) {
            return this._priorityQueue;
<<<<<<< HEAD
        } else if (prioritization.isNormalCommand(command)) {
            return this._normalQueue;
        } else {
=======
        }
        else if (prioritization.isNormalCommand(command)) {
            return this._normalQueue;
        }
        else {
>>>>>>> origin/future
            return this._deferredQueue;
        }
    }

<<<<<<< HEAD
    public isEmpty() {
        return (
            !this._deferredQueue.hasPending() && !this._normalQueue.hasPending() && !this._priorityQueue.hasPending()
        );
    }

=======
>>>>>>> origin/future
    public enqueue(request: Request) {
        const queue = this.getQueue(request.command);
        queue.enqueue(request);

        this.drain();
    }

    public dequeue(command: string, seq: number) {
        const queue = this.getQueue(command);
        return queue.dequeue(seq);
    }

    public cancelRequest(request: Request) {
        const queue = this.getQueue(request.command);
        queue.cancelRequest(request);
    }

    public drain() {
        if (this._isProcessing) {
            return false;
        }

        if (this._priorityQueue.isFull()) {
            return false;
        }

        if (this._normalQueue.isFull() && this._deferredQueue.isFull()) {
            return false;
        }

        this._isProcessing = true;

        if (this._priorityQueue.hasPending()) {
            this._priorityQueue.processPending();
            this._isProcessing = false;
            return;
        }

        if (this._normalQueue.hasPending()) {
            this._normalQueue.processPending();
        }

        if (this._deferredQueue.hasPending()) {
            this._deferredQueue.processPending();
        }

        this._isProcessing = false;
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/future
