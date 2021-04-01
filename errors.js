export class FindUserError extends Error {
    constructor(username, error, ...params) {
        super(params);
        if(Error.captureStackTrace) {
            Error.captureStackTrace(this, FindUserError);
        }
        this.name = 'FindUserError';
        this.username = username;
        this.error = error;
    }

    toString() {
        return `${super.toString()}\nusername\t${this.username}\nroot cause\t${this.error}`
    }
}

export class UpdateLocationError extends Error {
    constructor(location, error, ...params) {
        super(params);
        if(Error.captureStackTrace) {
            Error.captureStackTrace(this, FindUserError);
        }
        this.name = 'UpdateLocationError';
        this.location = location;
        this.error = error;
    }

    toString() {
        return `${super.toString()}\nlocation\t${this.location}\nroot cause\t${this.error}`
    }
}