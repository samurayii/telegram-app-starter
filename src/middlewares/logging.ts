import { Telegraf } from "telegraf";
import chalk from "chalk";
import { IContextExt } from "../lib/connector";

export function loggingMiddleware (bot: Telegraf<IContextExt>): void {

    const logger = bot.context.logger;

    logger.debug(`Middleware ${chalk.cyan("logging")} binded`);

    bot.use(async (ctx, next) => {
        const request_time = Date.now();
        logger.debug(`Request ID ${chalk.cyan(ctx.message.message_id)} from user ID ${chalk.cyan(ctx.message.from.id)}`);
        await next();
        logger.debug(`Request ID ${chalk.cyan(ctx.message.message_id)} from user ID ${chalk.cyan(ctx.message.from.id)} complete. Time: ${chalk.cyan(Date.now() - request_time)} ms`);
    });

}