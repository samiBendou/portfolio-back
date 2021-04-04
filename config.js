import fs from "fs";

class DbUser {
    constructor(username, password) {
        this.username = encodeURIComponent(username);
        this.password = password;
    }
}

class DbConfig {
    constructor(host, port, name, user) {
        this.host = host;
        this.port = port;
        this.name = name;
        this.user = user;
    }
}

class CaConfig {
    constructor(key, cert) {
        this.key = fs.readFileSync(key);
        this.cert = fs.readFileSync(cert);
    }
}

export class AppConfig {
    constructor(port, db, cert) {
        this.port = port;
        this.db = db;
        this.ca = cert;
    }

    static FromOptions({port, dbhost, dbname, dbport, dbuser, dbpwd, cakey, cacert}) {
        return new AppConfig(
            port, 
            new DbConfig(dbhost, dbport, dbname, new DbUser(dbuser, dbpwd)), 
            new CaConfig(cakey, cacert));
    }
}
