import { Telegraf } from "telegraf";
import chalk from "chalk";
import { IConnector, IConnectorWebhookConfig, IContextExt } from "../interfaces";
import { ILoggerEventEmitter } from "logger-event-emitter";

export class ConnectorWebhook implements IConnector {

    private readonly _bot: Telegraf<IContextExt>;

    constructor (
        private readonly _config: IConnectorWebhookConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._bot = new Telegraf(this._config.bot_token);
        this._logger.debug("Telegram webhook bot created");
    }

    get bot (): Telegraf<IContextExt> {
        return this._bot;
    }

    async run (): Promise<void> {

        const prefix = `/${this._config.prefix.replace(/(^\/|\/$)/g,"")}/${this._bot.secretPathComponent()}`;

        await this._bot.launch({
            allowedUpdates: this._config.allowed_updates,
            dropPendingUpdates: this._config.drop_pending_updates,
            webhook: { 
                domain: this._config.domain,
                hookPath: prefix,
                host: this._config.hostname,
                port: this._config.port,
                maxConnections: this._config.max_connections
            } 
        });

        this._logger.debug(`Webhook telegram bot running. Server ${chalk.cyan(this._config.domain)} listening on ${chalk.cyan(`http://${this._config.hostname}:${this._config.port}${prefix}`)} `);

    }

    async close (): Promise<void> {
        this._bot.stop();
        this._logger.debug("Telegram bot stopped");
    }

}