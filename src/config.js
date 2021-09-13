import fs from "fs";

export class DbUser {
    constructor(username, password) {
        this.username = encodeURIComponent(username);
        this.password = encodeURIComponent(password);
    }
}

export class DbConfig {
    constructor(host, port, name, user) {
        this.host = host;
        this.port = port;
        this.name = name;
        this.user = user;
    }
}

export class CaConfig {
    constructor(key, cert) {
        this.key = fs.readFileSync(key, "utf-8");
        this.cert = fs.readFileSync(cert, "utf-8");
    }
}

export class AppConfig {
    constructor(port, db, cert) {
        this.port = port;
        this.db = db;
        this.ca = cert;
    }

    static FromOptions(config, env) {
        return new AppConfig(
            config.port,
            new DbConfig(env.DB_HOST, env.DB_PORT, config.dbname, new DbUser(env.DB_USER, env.DB_PASS)),
            new CaConfig(env.CA_KEY, env.CA_CERT)
        );
    }
}
