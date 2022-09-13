import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import jtomler from "jtomler";
import json_from_schema from "json-from-default-schema";
import * as config_schema from "./schemes/config.json";
import * as polling_config_schema from "./schemes/connector-polling.json";
import * as webhook_config_schema from "./schemes/connector-webhook.json";
import * as sessions_mongodb_config_schema from "./schemes/sessions-mongodb-store.json";
import * as sessions_none_config_schema from "./schemes/sessions-none-store.json";
import { IAppConfig } from "./config.interfaces";
import { AjvErrorHelper } from "./tools/ajv_error_helper";
import { IConnectorConfig, IConnectorWebhookConfig } from "./connector";
import { ISessionsConfig, ISessionsMongoDBConfig } from "./sessions/interfaces";

type TPackage = {
    version: string
    name: string
    [key: string]: unknown
}

type TOptions = {
    config: string
    smoke: boolean
}

const findPkg = (): TPackage => {

    const cwd_pkg_full_path = path.resolve(process.cwd(), "package.json");
    const dirname_pkg_full_path = path.resolve(__dirname, "package.json");
    const app_pkg_full_path = path.resolve(path.dirname(process.argv[1]), "package.json");
    const require_pkg_full_path = path.resolve(path.dirname(require.main.filename), "package.json"); 

    if (fs.existsSync(dirname_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(dirname_pkg_full_path).toString());
    }
    if (fs.existsSync(app_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(app_pkg_full_path).toString());
    }
    if (fs.existsSync(require_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(require_pkg_full_path).toString());
    }   
    if (fs.existsSync(cwd_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(cwd_pkg_full_path).toString());
    }

    return <TPackage>{
        version: "unknown",
        name: "template"
    };

};

const program = new Command();
const pkg = findPkg();

if (pkg === undefined) {
    console.error(`${chalk.bgRed(" FATAL ")} package.json not found`);
    process.exit(1);
}

program.version(`${pkg.name} version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(pkg.name);
program.option("-c, --config <type>", "Path to config file.");
program.option("-s, --smoke", "Smoke test. Check config files.");

program.parse(process.argv);

const options = program.opts<TOptions>();

if (process.env["TEMPLATE_CONFIG_PATH"] === undefined) {
	if (options.config === undefined) {
		console.error(`${chalk.bgRed(" FATAL ")} Not set --config key`);
		process.exit(1);
	}
} else {
	options.config = process.env["TEMPLATE_CONFIG_PATH"];
}

const full_config_path = path.resolve(process.cwd(), options.config);

if (!fs.existsSync(full_config_path)) {
    console.error(`${chalk.bgRed(" FATAL ")} Config file ${full_config_path} not found`);
    process.exit(1);
}

const config: IAppConfig = <IAppConfig>json_from_schema(jtomler.parseFileSync(full_config_path), config_schema);

const ajv = new Ajv({
    allErrors: true, 
    strict: false
});

const validate = ajv.compile(config_schema);

if (validate(config) === false) {
    const error_text = AjvErrorHelper(validate);
    console.error(`${chalk.bgRed(" FATAL ")} Config schema errors:\n${error_text}`);
    process.exit(1);
}

let validate_connector;

if (config.connector.type === "polling") {
    config.connector = <IConnectorConfig>json_from_schema(config.connector, polling_config_schema);
    validate_connector = ajv.compile(polling_config_schema);
}

if (config.connector.type === "webhook") {
    config.connector = <IConnectorWebhookConfig>json_from_schema(config.connector, webhook_config_schema);
    validate_connector = ajv.compile(webhook_config_schema);
}

if (validate_connector === undefined) {
    console.error(`${chalk.bgRed(" FATAL ")} Config key config.connector.type must be "polling" or "webhook"`);
    process.exit(1);
}

if (validate_connector(config.connector) === false) {
    const error_text = AjvErrorHelper(validate_connector);
    console.error(`${chalk.bgRed(" FATAL ")} Config key config.connector schema errors:\n${error_text}`);
    process.exit(1);
}

let validate_sessions_store;

if (config.sessions.store.type === "none") {
    config.sessions.store = <ISessionsConfig["store"]>json_from_schema(config.sessions.store, sessions_none_config_schema);
    validate_sessions_store = ajv.compile(sessions_none_config_schema);
}

if (config.sessions.store.type === "mongodb") {
    config.sessions.store = <ISessionsMongoDBConfig>json_from_schema(config.sessions.store, sessions_mongodb_config_schema);
    validate_sessions_store = ajv.compile(sessions_mongodb_config_schema);
}

if (validate_sessions_store === undefined) {
    console.error(`${chalk.bgRed(" FATAL ")} Config key config.sessions.store must be "none" or "mongodb"`);
    process.exit(1);
}

if (validate_sessions_store(config.sessions.store) === false) {
    const error_text = AjvErrorHelper(validate_sessions_store);
    console.error(`${chalk.bgRed(" FATAL ")} Config key config.sessions.store schema errors:\n${error_text}`);
    process.exit(1);
}

config.api.prefix = `/${config.api.prefix.replace(/(^\/|\/$)/g,"")}`;

if (options.smoke === true) {
    console.log(`Config files ${chalk.green("correct")}`);
    console.log(JSON.stringify(config, null, 2));
    process.exit();
}

export default config;