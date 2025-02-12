export class RequestFailedError extends Error {

    override name = this.constructor.name;
    code?: string;
    details: any;
    cause: any;

    constructor(err: any, url: string) {
        super(`Request to ${url} failed: ${err.name} ${err.message}`);
        this.code = err.code;
        this.details = err.details;
        this.cause = err;
    }

}

export class HttpRequestError extends Error {

    override name = this.constructor.name;
    status: number;
    details: any;

    constructor(status: number, method: string, url: string, details: any) {
        super(`${status} - ${method} ${url}`);
        this.status = status;
        this.details = details;
    }

}

export class UnexpectedResponseError extends Error {

    override name = this.constructor.name;
    code?: string;
    details?: any;

    constructor(err: any) {
        super(`Expected JSON response, instead got error: ${err.name} ${err.message}`);
        this.code = err.code ?? undefined;
        this.details = err.details;
    }

}
