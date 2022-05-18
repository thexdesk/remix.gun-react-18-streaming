import type { GunOptions, GunUser, IGun, IGunChain, IGunInstance, IGunUserInstance, ISEA } from "gun/types";
import type { ISEAPair } from "gun/types";
import type { Params } from "react-router";
import type { ServerResponse } from "http";
import { User } from "dockerode";
export * from "./loaders"


export type NodeValues = Record<string, string>

export interface UserAuth {
    keyPairAuth(pair: ISEAPair): Promise<unknown>;
    credentials(alias: string, password: string): Promise<{ userInfo: GunUser, sea: ISEAPair }>;
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
            radisk: boolean;
            localStorage: boolean;
            accessToken: Function;
        };
        gun: IGunInstance;
        SEA: ISEA
        user: UserAuth
        formData: () => Promise<Record<string, string>>;
    }
    // createToken: (sessionKey?: string) => Promise<string>,
    // verifyToken: (request: Request, sessionKey?: string) => Promise<void>,
};

