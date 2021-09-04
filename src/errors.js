export class FindUserError extends Error {
    constructor(username, reason, ...params) {
        super(params);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FindUserError);
        }
        this.name = "FindUserError";
        this.username = username;
        this.reason = reason;
    }

    toString() {
        const reason = this.reason ? `(${this.reason})` : "";
        return `${super.toString()} username: ${this.username} ${reason}`;
    }
}

export class FetchLocationError extends Error {
    constructor(location, reason, url, ...params) {
        super(params);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FindUserError);
        }
        this.name = "FetchLocationError";
        this.location = location;
        this.reason = reason;
        this.url = url;
    }

    toString() {
        const reason = this.reason ? `(${this.reason})` : "";
        return `${super.toString()} ${this.location.country} ${this.location.zip}, url ${this.url} ${reason}`;
    }
}

export class FatalError extends Error {
    constructor(reason, code, ...params) {
        super(params);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FatalError);
        }
        this.name = "FatalError";
        this.reason = reason;
        this.code = code;
    }
    toString() {
        return `${super.toString()} (${this.reason})`;
    }
}

export const ExitCode = {
    BadConfig: 170,
    FailedConnect: 171,
    ServerError: 172,
    BadEnvironment: 173,
};
