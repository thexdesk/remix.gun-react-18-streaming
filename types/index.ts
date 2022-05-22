import type { GunOptions, GunUser, IGun, IGunChain, IGunInstance, IGunUserInstance, ISEA } from "gun/types";
import type { ISEAPair } from "gun/types";
import type { Params } from "react-router";
import type { ServerResponse } from "http";
import { User } from "dockerode";
export * from "./loaders"


export type MenuLinks = {
    id: string;
    link: string;
    label: string;
    icon?: string;
}[];
export interface UserAuth {
    keyPairAuth(pair: ISEAPair, cookie?: boolean): Promise<unknown>;
    credentials(alias: string, password: string): Promise<{ user_info: GunUser, sea: ISEAPair }>;
    logout(): Promise<Response>
    getMasterUser(): IGunUserInstance
    getSessionData(): Promise<{
        user_info: GunUser;
        key_pair: ISEAPair;
    }>

}

export type LoadCtx = { RemixGunContext: RmxGunCtx, res: ServerResponse }

export interface RmxGunCtx {
    (Gun: IGun, request: Request): {
        ENV: {
            DOMAIN: string | undefined;
            PEER_DOMAIN: string | undefined;
            CLIENT: string | undefined;
            APP_KEY_PAIR: ISEAPair;
        },
        gunOpts: {
            peers: string[];
            localStorage: boolean;
        };
        gun: IGunInstance;
        SEA: ISEA
        auth: UserAuth
        formData: () => Promise<Record<string, string>>;
    }
    // createToken: (sessionKey?: string) => Promise<string>,
    // verifyToken: (request: Request, sessionKey?: string) => Promise<void>,
};

