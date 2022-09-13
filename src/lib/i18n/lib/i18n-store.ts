import { ILoggerEventEmitter } from "logger-event-emitter";
import { II18nStore, II18nStoreLocaleFile } from "../interfaces";
import * as Handlebars from "handlebars";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import jtomler from "jtomler";
import * as locale_schema from "../schemes/locale.json";
import { AjvErrorHelper } from "../../tools/ajv_error_helper";

export class I18nStore implements II18nStore {

    private readonly _store: {
        [key: string]: HandlebarsTemplateDelegate<unknown>
    };

    constructor (
        private readonly _locale_name: string,
        private readonly _full_file_path: string,
        private readonly _logger: ILoggerEventEmitter
    ) {

        this._store = {};

        const stat = fs.statSync(this._full_file_path);

        if (stat.isDirectory() === false) {
            this._loadFile(this._full_file_path);
        } else {
            const files = fs.readdirSync(this._full_file_path);
            for (const file_path of files) {
                const full_file_path = path.resolve(this._full_file_path, file_path);
                const stat = fs.statSync(full_file_path);
                if (stat.isDirectory() === true) {
                    continue;
                }
                this._loadFile(full_file_path);
            }
        }

        this._logger.debug(`Locale ${chalk.cyan(this._locale_name)} loaded`);

    }

    private _loadFile (full_file_path: string): void {

        const ajv = new Ajv({
            allErrors: true, 
            strict: false
        });
        const validate = ajv.compile(locale_schema);

        try {
            const locale_file = <II18nStoreLocaleFile>jtomler.parseFileSync(full_file_path, false);
            if (validate(locale_file) === false) {
                const error_text = AjvErrorHelper(validate);
                this._logger.fatal(`Locale file ${chalk.red(full_file_path)} schema errors:\n${error_text}`);
                process.exit(1);
            }
            for (const key in locale_file) {
                const value = locale_file[key];
                this._loadKey(key, value);
            }
            this._logger.debug(`Locale file ${chalk.cyan(this._full_file_path)} loaded`);
        } catch (error) {
            this._logger.fatal(`Error loading locale file ${chalk.red(full_file_path)}. Error: ${chalk.red(error.message)}`);
            this._logger.trace(error.trace);
            process.exit(1);
        }
    }

    private _loadKey (key: string, value: string): void {
        try {
            const template = Handlebars.compile(value);
            this._store[key] = template;
        } catch (error) {
            this._logger.fatal(`Error handlebars compile key ${chalk.red(key)} for locale ${chalk.red(this._locale_name)}. Error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
            process.exit(1);
        }
    }

    text (key: string, data: unknown = {}): string {
        if (this._store[key] === undefined) {
            this._logger.warn(`Key ${chalk.yellow()} for locale ${chalk.yellow(this._locale_name)} not found`);
            return "";
        }
        try {
            return this._store[key](data);
        } catch (error) {
            this._logger.error(`Error parsing key ${chalk.red(key)} for locale ${chalk.red(this._locale_name)}. Error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
            return "";
        }
    }
}