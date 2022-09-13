import { IContextExt } from "../connector";

export interface ISessionsStore {
    loadSession: (key: number) => Promise<ISessionData>
    saveSession: (key: number, data: ISessionData) => Promise<void>
    clearSession: (key: number) => Promise<void>
    run: () => Promise<void>
    close: () => Promise<void>
}

export interface ISessions {
    loadSession: (ctx: IContextExt) => Promise<void>
    saveSession: (ctx: IContextExt) => Promise<void>
    run: () => Promise<void>
    close: () => Promise<void>
}

export interface ISessionData {
    user_id: number
    last_request: number
    chat_id: number
}

export interface ISessionsConfig {
    ttl: string
    store: {
        type: "none" | "mongodb"
    }
}

export interface ISessionsMongoDBConfig {
    type: "mongodb"
    host: string
    port: number
    db: string
    auth: {
        user: string
        password: string
    }
    reconnect_interval: string
    buffer_commands: boolean
    max_pool_size: number
    min_pool_size: number
    server_selection_timeout: string
    heartbeat_frequency: string
    auto_index: boolean
    socket_timeout: string
    family: number
    auto_create: boolean
}