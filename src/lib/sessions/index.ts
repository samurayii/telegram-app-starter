import { ILoggerEventEmitter } from "logger-event-emitter";
import { ISessionData, ISessions, ISessionsConfig, ISessionsMongoDBConfig, ISessionsStore } from "./interfaces";
import { SessionNoneStore } from "./lib/store-none";
import chalk from "chalk";
import { convertTime } from "../tools/convert_time";
import { IContextExt } from "../connector";
import { SessionMongoDBStore } from "./lib/store-mongodb";

export class Sessions implements ISessions {

    private _running_flag: boolean;
    private readonly _store: ISessionsStore;
    private readonly _ttl: number;
    private readonly _cache: {
        [key: string]: {
            data: ISessionData,
            id_interval: ReturnType<typeof setTimeout>
        }
    };

    constructor (
        private readonly _config: ISessionsConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._cache = {};
        this._running_flag = false;
        this._ttl = convertTime(this._config.ttl)*1000;
        
        if (this._config.store.type === "none") {
            this._store = new SessionNoneStore();
        }

        if (this._config.store.type === "mongodb") {
            this._store = new SessionMongoDBStore(<ISessionsMongoDBConfig>this._config.store, this._logger);
        }

        if (this._store === undefined) {
            this._logger.fatal(`Session store type ${chalk.red(this._config.store.type)} not support`);
            process.exit(1);
        }

        this._logger.debug(`Session store type ${chalk.cyan(this._config.store.type)} created. Cache TTL ${chalk.cyan(this._config.ttl)}`);
    }

    async loadSession (ctx: IContextExt): Promise<void> {

        const id_record = ctx.message.from.id;
        let result: ISessionData = {
            user_id: id_record,
            last_request: 0,
            chat_id: ctx.message.chat.id
        };

        const session_outdated = async () => {
            if (this._cache[id_record] !== undefined) {
                clearTimeout(this._cache[id_record].id_interval);
                await this._store.clearSession(id_record);
                delete this._cache[id_record];
                this._logger.debug(`Session ID ${chalk.cyan(id_record)} is outdated`);
            }
        };

        if (this._cache[id_record] !== undefined) {
            result = this._cache[id_record].data;
            clearTimeout(this._cache[id_record].id_interval);
            this._cache[id_record].id_interval = setTimeout(session_outdated, this._ttl);
        } else {
            const record = await this._store.loadSession(id_record);
            if (record !== undefined) {
                result = record;
            }
            this._cache[id_record] = {
                data: result,
                id_interval: setTimeout(session_outdated, this._ttl)
            };

            this._logger.debug(`Session ID ${chalk.cyan(id_record)} created`);
        }

        result.last_request = Date.now();

        ctx.session = result;

    }

    async saveSession (ctx: IContextExt): Promise<void> {
        const id_record = ctx.message.from.id;
        this._cache[id_record].data = ctx.session;
        await this._store.saveSession(id_record, this._cache[id_record].data);
    }

    async run (): Promise<void> {
        if (this._running_flag === true) {
            return;
        }
        this._running_flag = true;
        await this._store.run();
    }

    async close (): Promise<void> {
        if (this._running_flag === false) {
            return;
        }
        this._running_flag = false;
        for (const id_record in this._cache) {
            const record = this._cache[id_record];
            clearTimeout(record.id_interval);
        }
        await this._store.close();
    }

}