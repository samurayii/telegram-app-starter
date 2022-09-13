import { Telegraf } from "telegraf";
import { IContextExt } from "../lib/connector";

export function bindScenes (bot: Telegraf<IContextExt>): void {

    bot.start( async (ctx: IContextExt) => {
        await ctx.replyWithHTML(ctx.language.text("start", ctx.message));
    });

    bot.help( async (ctx: IContextExt) => {
        await ctx.replyWithHTML(ctx.language.text("help", ctx.message));
    });

}