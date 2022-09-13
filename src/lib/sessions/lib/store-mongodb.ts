import chalk from "chalk";
import { ILoggerEventEmitter } from "logger-event-emitter";
import mongoose, { ConnectOptions } from "mongoose";
import { convertTime } from "../../tools/convert_time";
import { ISessionData, ISessionsMongoDBConfig, ISessionsStore } from "../interfaces";

export class SessionMongoDBStore implements ISessionsStore {

    private _mongoose_model: mongoose.Model<ISessionData>;
    private _ready_flag: boolean;
    private _connection: mongoose.Connection;
    private _reconnect_flag: boolean;
    private _reconnect_interval_id: ReturnType<typeof setTimeout>;
    private _url: string;

    constructor (
        private readonly _config: ISessionsMongoDBConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._reconnect_flag = false;
        this._ready_flag = false;
        this._url = `mongodb://${this._config.host}:${this._config.port}`;
    }

    private _createConnection (): Promise<void> {

        return new Promise( (resolve) => {

            const options: ConnectOptions = {
                bufferCommands: this._config.buffer_commands,
                dbName: this._config.db,
                autoIndex: this._config.auto_index,
                autoCreate: this._config.auto_create,
                maxPoolSize: this._config.max_pool_size,
                minPoolSize: this._config.min_pool_size,
                serverSelectionTimeoutMS: convertTime(this._config.server_selection_timeout)*1000,
                heartbeatFrequencyMS: convertTime(this._config.heartbeat_frequency)*1000,
                socketTimeoutMS: convertTime(this._config.socket_timeout)*1000,
                family: this._config.family,
            };
    
            if (this._config.auth.user !== "" && this._config.auth.password !== "") {
                options.user = this._config.auth.user;
                options.pass = this._config.auth.password;
            }

            this._logger.debug(`MongoDB connection to server ${chalk.cyan(this._url)} connecting`);

            mongoose.createConnection(this._url, options, (error, connection) => {

                if (error !== null) {
                    this._logger.error(`MongoDB connection error. Error: ${chalk.red(error.message)}`);
                    this._reconnect();
                    return resolve();
                }

                this._logger.debug(`MongoDB connection to server ${chalk.cyan(this._url)} connected`);

                connection.on("connected", () => {
                    this._logger.debug(`MongoDB connection to server ${chalk.cyan(this._url)} connected`);
                    this._ready_flag = true;
                });
            
                connection.on("disconnected", () => {
                    this._logger.debug(`MongoDB connection to server ${chalk.cyan(this._url)} disconnected`);
                });
            
                connection.on("close", () => {
                    this._logger.debug(`MongoDB connection to server ${chalk.cyan(this._url)} closed`);
                });
            
                connection.on("error", () => {
                    this._logger.error(`MongoDB connection to server ${chalk.cyan(this._url)} error. Error: ${chalk.red(error.message)}`);
                });

                this._connection = connection;
                this._ready_flag = true;

                const user_record_schema = new mongoose.Schema<ISessionData>({
                    user_id: Number,
                    last_request: Number,
                    chat_id: Number
                });
                this._mongoose_model = connection.model<ISessionData>("Sessions", user_record_schema);

                resolve();

            });

        });

    }

    private async _reconnect (): Promise<void> {

        if (this._reconnect_flag === false) {

            this._logger.info(`MongoDB connection to server ${chalk.cyan(this._url)} will be recreated in ${chalk.cyan(this._config.reconnect_interval)} seconds`);

            this._reconnect_flag = true;
            this._ready_flag = false;

            if (this._connection !== undefined) {
                try {
                    await this._connection.close();
                } catch (error) {
                    this._logger.error(`MongoDB connection to server ${chalk.cyan(this._url)} disconnecting error. Error: ${error.message}`);
                    this._logger.trace(error.stack);
                }
            }

            this._connection = undefined;

            this._reconnect_interval_id = setTimeout( () => {
                this._createConnection();
            }, convertTime(this._config.reconnect_interval)*1000);

        }

    }

    async run (): Promise<void> {
        this._createConnection();
    }
    
    async close (): Promise<void> {
        clearTimeout(this._reconnect_interval_id);
        this._ready_flag = false;
        if (this._connection !== undefined) {
            this._connection.removeAllListeners();
            try {
                await this._connection.close();
            } catch (error) {
                this._logger.error(`MongoDB connection to server ${chalk.cyan(this._url)} closing error. Error: ${error.message}`);
                this._logger.trace(error.stack);
            }
        }
    }

    async loadSession (key: number): Promise<ISessionData> {

        if (this._ready_flag === false) {
            return undefined;
        }

        let result;
        try {
            const doc = await this._mongoose_model.findOne({user_id: key});
            if (doc !== null) {
                result = JSON.parse(JSON.stringify(doc));
            }
        } catch (error) {
            this._logger.error(`Load session from server ${chalk.cyan(this._url)} procedure error. Error: ${error.message}`);
            this._logger.trace(error.stack);
        }
        return result;

    }

    async clearSession (key: number): Promise<void> {

        if (this._ready_flag === false) {
            return undefined;
        }
        try {
            await this._mongoose_model.findOneAndDelete({user_id: key});
        } catch (error) {
            this._logger.error(`Clear session from server ${chalk.cyan(this._url)} procedure error. Error: ${error.message}`);
            this._logger.trace(error.stack);
        }

    }

    async saveSession (key: number, data: ISessionData): Promise<void> {

        if (this._ready_flag === false) {
            return;
        }

        try {
            const doc = await this._mongoose_model.findOne({user_id: key});
            if (doc === null) {
                await this._mongoose_model.insertMany([data]);
            } else {
                await this._mongoose_model.findOneAndReplace({user_id: key}, data);
            }
        } catch (error) {
            this._logger.error(`Save session to server ${chalk.cyan(this._url)} procedure error. Error: ${error.message}`);
            this._logger.trace(error.stack);
        } 
    }
}