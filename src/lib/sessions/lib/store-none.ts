import { ISessionData, ISessionsStore } from "../interfaces";

export class SessionNoneStore implements ISessionsStore {

    async run (): Promise<void> {
        return;
    }
    async close (): Promise<void> {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async loadSession (_key: number): Promise<ISessionData> {
        return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async saveSession (_key: number, _data: ISessionData): Promise<void> {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async clearSession (_key: number): Promise<void> {
        return;
    }
}