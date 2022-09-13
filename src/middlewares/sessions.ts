import { Telegraf } from "telegraf";
import chalk from "chalk";
import { IContextExt } from "../lib/connector";

export function sessionsMiddleware (bot: Telegraf<IContextExt>): void {

    const logger = bot.context.logger;

    logger.debug(`Middleware ${chalk.cyan("sessions")} binded`);

    bot.use(async (ctx, next) => {
        await ctx.sessions.loadSession(ctx);
        await next();
        await ctx.sessions.saveSession(ctx);
    });

}