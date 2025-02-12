export class RequestFailedError extends Error {

    override name = this.constructor.name;
    code?: string | number;
    details: any;
    cause: any;

    constructor(err: any, url: string) {
        super(`Request to ${url} failed: ${err.name ?? 'UnknownError'} ${err.message ?? ''}`);
        this.code = err.code ?? undefined;
        this.details = err?.details ?? 'The target server failed to process the request.';
        this.cause = err;
    }
}

export class HttpRequestError extends Error {

    override name = this.constructor.name;
    details: any;
    code?: string | number;

    constructor(res: Response, body: string) {
        super(`Http Request Error: ${res.status} ${res.statusText}`);
        this.code = res.status ?? undefined;
        this.details = {
            responseBody: body
        };
    }
}

export class UnexpectedResponseError extends Error {

    override name = this.constructor.name;
    code?: string | number;
    details: any;

    constructor(err: any) {
        super(`Unexpected response: ${err.name} ${err.message}`);
        this.code = err.code ?? undefined;
        this.details = err?.details ?? 'Expected JSON response';
    }
}
