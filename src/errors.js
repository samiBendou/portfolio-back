export class FindUserError extends Error {
    constructor(username, error, ...params) {
        super(params);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FindUserError);
        }
        this.name = "FindUserError";
        this.username = username;
        this.error = error;
    }

    toString() {
        return `${super.toString()}
        username\t${this.username}
        root cause\t${this.error}`;
    }
}

export class FetchLocationError extends Error {
    constructor(location, error, url, ...params) {
        super(params);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FindUserError);
        }
        this.name = "FetchLocationError";
        this.location = location;
        this.error = error;
        this.url = url;
    }

    toString() {
        return `${super.toString()}
        location\t${this.location.country} ${this.location.zip}
        root cause\t${this.error}
        fetch url\t${this.url}`;
    }
}
