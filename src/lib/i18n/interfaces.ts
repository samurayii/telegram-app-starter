export interface II18n {
    get: (locale: string) => II18nStore
}

export interface II18nConfig {
    path: string
    default: string
}

export interface II18nStore {
    text: (key: string, data?: unknown) => string
}

export interface II18nStoreLocaleFile {
    [key: string]: string
}