import { Telegraf } from "telegraf";
import chalk from "chalk";
import { IContextExt } from "../lib/connector";

export function i18nMiddleware (bot: Telegraf<IContextExt>): void {

    const logger = bot.context.logger;

    logger.debug(`Middleware ${chalk.cyan("i18n")} binded`);

    bot.use(async (ctx, next) => {
        ctx.language = ctx.i18n.get(ctx.message.from.language_code);
        return next();
    });

}