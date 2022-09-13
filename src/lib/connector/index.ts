import { Telegraf } from "telegraf";
import { IConnector, IConnectorConfig, IConnectorWebhookConfig, IContextExt } from "./interfaces";
import chalk from "chalk";
import { ILoggerEventEmitter } from "logger-event-emitter";
import { ConnectorPolling } from "./lib/connector-polling";
import { ConnectorWebhook } from "./lib/connector-webhook";

export * from "./interfaces";

export class Connector implements IConnector {

    private readonly _connector: IConnector;
    private _running_flag: boolean;

    constructor (
        private readonly _config: IConnectorConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._running_flag = false;
        
        if (this._config.type === "polling") {
            this._connector = new ConnectorPolling(<IConnectorConfig>this._config, this._logger);
        }

        if (this._config.type === "webhook") {
            this._connector = new ConnectorWebhook(<IConnectorWebhookConfig>this._config, this._logger);
        }

        if (this._connector === undefined) {
            this._logger.fatal(`Connector type ${chalk.red(this._config.type)} not support`);
            process.exit(1);
        }

    }

    get bot (): Telegraf<IContextExt> {
        return this._connector.bot;
    }

    async run (): Promise<void> {
        if (this._running_flag === true) {
            return;
        }
        this._running_flag = true;
        await this._connector.run();
    }

    async close (): Promise<void> {
        if (this._running_flag === false) {
            return;
        }
        this._running_flag = false;
        await this._connector.close();
    }

}