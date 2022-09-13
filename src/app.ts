import config from "./lib/init";
import chalk from "chalk";
import { LoggerEventEmitter } from "logger-event-emitter";
import { buildApiServer } from "./http/build_api_server";
import { I18n } from "./lib/i18n";
import { Connector } from "./lib/connector";
import { bindMiddlewares } from "./middlewares/bind_middlewares";
import { bindScenes } from "./scenes/bind_scenes";
import { Sessions } from "./lib/sessions";

const logger = new LoggerEventEmitter(config.logger);

logger.debug(`\nCONFIG:\n${JSON.stringify(config, null, 4)}`);

const i18n = new I18n(config.i18n, logger.child("i18n"));
const connector = new Connector(config.connector, logger.child("connector"));
const sessions = new Sessions(config.sessions, logger.child("sessions"));

const bootstrap = async () => {

    try {

        const api_server_logger = logger.child("api-server");
        const api_server = buildApiServer(config.api, api_server_logger);

        await sessions.run();
        await connector.run();

        connector.bot.context.i18n = i18n;
        connector.bot.context.logger = logger.child("telegram-bot");
        connector.bot.context.sessions = sessions;

        bindMiddlewares(connector.bot);
        bindScenes(connector.bot);

        if (config.api.enable === true) {

            api_server.listen({
                port: config.api.port,
                host: config.api.hostname,
                backlog: config.api.backlog
            }, (error: Error, address: string) => {
                if (error !== null) {
                    api_server_logger.fatal(`Error start server. Error: ${chalk.red(error)}`);
                    process.exit(1);
                }
                api_server_logger.info(`Server listening on ${chalk.cyan(address)}`);
            });
        }

        const stop_app = async () => {
            api_server.close();
            await connector.close();
            await sessions.close();
            setImmediate( () => {
                process.exit();
            });
        };

        process.on("SIGTERM", () => {
            logger.info(`Signal ${chalk.cyan("SIGTERM")} received`);
            stop_app();
        });

        process.on("SIGINT", () => {
            logger.info(`Signal ${chalk.cyan("SIGINT")} received`);
            stop_app();
        });

    } catch (error) {
        logger.fatal(`Error application start.\n${error.stack}`);
        process.exit(1);
    }

};

bootstrap();