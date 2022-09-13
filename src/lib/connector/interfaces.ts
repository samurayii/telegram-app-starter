import { ILoggerEventEmitter } from "logger-event-emitter";
import { Context, Telegraf } from "telegraf";
import { II18n, II18nStore } from "../i18n";
import { ISessionData, ISessions } from "../sessions/interfaces";

export { Telegraf } from "telegraf";

export interface IConnector {
    readonly bot: Telegraf<IContextExt>
    run: () => Promise<void>
    close: () => Promise<void>
}

export interface IConnectorConfig {
    bot_token: string
    type: "polling" | "webhook"
    drop_pending_updates: true
    allowed_updates: ("callback_query" | "channel_post" | "chat_member" | "chosen_inline_result" | "edited_channel_post" | "edited_message" | "inline_query" | "message" | "my_chat_member" | "pre_checkout_query" | "poll_answer" | "poll" | "shipping_query" | "chat_join_request")[]
}

export interface IConnectorWebhookConfig extends IConnectorConfig {
    domain: string
    port: number
    hostname: string
    prefix: string
    max_connections: number
}

export interface IContextExt extends Context {
    i18n: II18n
    logger: ILoggerEventEmitter
    language: II18nStore
    session: ISessionData
    sessions: ISessions
}