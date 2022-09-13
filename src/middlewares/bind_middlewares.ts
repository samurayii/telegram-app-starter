import { Telegraf } from "telegraf";
import { loggingMiddleware } from "./logging";
import { i18nMiddleware } from "./i18n";
import { IContextExt } from "../lib/connector";
import { sessionsMiddleware } from "./sessions";

export function bindMiddlewares (bot: Telegraf<IContextExt>): void {

    loggingMiddleware(bot);
    i18nMiddleware(bot);
    sessionsMiddleware(bot);

}