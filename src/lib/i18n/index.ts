import { ILoggerEventEmitter } from "logger-event-emitter";
import { II18n, II18nConfig, II18nStore } from "./interfaces";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { I18nStore } from "./lib/i18n-store";

export * from "./interfaces";

export class I18n implements II18n {

    private readonly _locales: {
        [key: string]: II18nStore
    };

    constructor (
        private readonly _config: II18nConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {

        this._locales = {};
        
        const full_folder_path = path.resolve(__dirname, "../../locales");

        if (fs.existsSync(full_folder_path) === false) {
            this._logger.fatal(`Folder ${chalk.red(full_folder_path)} for locales not found`);
            process.exit(1);
        }

        this._logger.debug("Locales initialization");

        const files = fs.readdirSync(full_folder_path);

        for (const file_path of files) {

            const full_file_path = path.resolve(full_folder_path, file_path);
            const stat = fs.statSync(full_file_path);
            
            if (stat.isDirectory() === true) {
                this._locales[file_path] = new I18nStore(file_path, full_file_path, this._logger);
            } else {
                const locale_name = file_path.replace(/\.(json|yaml|toml|yml)$/, "");
                this._locales[locale_name] = new I18nStore(locale_name, full_file_path, this._logger);
            }          

        }

        if (this._locales[this._config.default] === undefined) {
            this._logger.fatal(`Default locale ${chalk.red(this._config.default)} not found`);
            process.exit(1);
        }

    }

    get (locale: string): II18nStore {
        if (this._locales[locale] === undefined) {
            return this._locales[this._config.default];
        }
        return this._locales[locale];
    }
    
}