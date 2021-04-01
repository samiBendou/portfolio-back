import fs from "fs";

class DbConfig {
    constructor(host, port, name) {
        this.host = host;
        this.port = port;
        this.name = name;
    }
}

class CaConfig {
    constructor(key, cert) {
        this.key = fs.readFileSync(key);
        this.cert = fs.readFileSync(cert);
    }
}

class AppConfig {
    constructor(port, db, cert) {
        this.port = port;
        this.db = db;
        this.ca = cert;
    }
}

export function ConfigFromOptions({port, dbhost, dbname, dbport, cakey, cacert}) {
    return new AppConfig(port, new DbConfig(dbhost, dbport, dbname), new CaConfig(cakey, cacert));
}