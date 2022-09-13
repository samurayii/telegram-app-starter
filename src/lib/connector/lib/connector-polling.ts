import { Telegraf } from "telegraf";
import { IConnector, IConnectorConfig, IContextExt } from "../interfaces";
import { ILoggerEventEmitter } from "logger-event-emitter";

export class ConnectorPolling implements IConnector {

    private readonly _bot: Telegraf<IContextExt>;

    constructor (
        private readonly _config: IConnectorConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._bot = new Telegraf(this._config.bot_token);
        this._logger.debug("Telegram polling bot created");
    }

    get bot (): Telegraf<IContextExt> {
        return this._bot;
    }

    async run (): Promise<void> {
        await this._bot.launch({
            allowedUpdates: this._config.allowed_updates,
            dropPendingUpdates: this._config.drop_pending_updates
        });
        this._logger.debug("Polling telegram bot running");
    }

    async close (): Promise<void> {
        this._bot.stop();
        this._logger.debug("Telegram bot stopped");
    }

}