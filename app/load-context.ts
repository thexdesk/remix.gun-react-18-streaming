import type { GunUser, IGun, ISEAPair } from "gun/types";
import { destroySession, getSession } from "~/session.server";
import { errorCheck } from "./lib/utils/helpers";
import { redirect } from "remix";
import { getDomain } from "./server";
export function RemixGunContext(Gun: IGun, request: Request) {
    // log((req), "Request")
    const ENV = {
        DOMAIN: process.env.DOMAIN,
        PEER_DOMAIN: process.env.PEER_DOMAIN,
        CLIENT: process.env.CLIENT_PORT,
        APP_KEY_PAIR: {
            pub: process.env.PUB,
            priv: process.env.PRIV,
            epub: process.env.EPUB,
            epriv: process.env.EPRIV,
        } as ISEAPair,
    };

    let peerList = {
        DOMAIN: getDomain(),
        PEER: `https://${ENV.PEER_DOMAIN}/gun`,
    };
    const gunOpts: {
        peers: string[];
        radisk: boolean;
        localStorage: boolean;
    } = {
        peers: [peerList.DOMAIN, peerList.PEER],
        localStorage: false,
        radisk: true,
    }
    let gun = Gun(gunOpts);
    // Upgrade from Gun's user api sets pubkey and epub as user_info and SEA keypair in session storage ENCRYPTED with remix session api

    async function getSessionData() {
        let session = await getSession(request.headers.get("Cookie"));
        let USER_KEYS = session.get("key_pair");
        let USER_INFO = session.get("user_info");
        if (!USER_INFO || !USER_KEYS) {
            return {
                user_info: null,
                key_pair: null,
            }
        }
        return { user_info: USER_INFO, key_pair: USER_KEYS }

    }
    function getMasterUser() {
        return gun.user().auth(ENV.APP_KEY_PAIR, (ack) => {
            if ((ack as any).err) {
                throw new Error((ack as any).err);
            }
        });
    }

    const aliasAvailable = (alias: string) => {
        return new Promise((resolve, reject) => {
            gun.get(`~@${alias}`).once((exists) => {
                if (exists) {
                    resolve(false)
                }
                resolve(true)
            })
        })
    }
    type T = any
    const SEA = Gun.SEA

    /**
     * 
     * @param pair 
     * @returns 
     */
    async function keyPairAuth(pair: ISEAPair) {
        let session = await getSession(request.headers.get("Cookie") ?? undefined);
        return new Promise((resolve, reject) => gun.user().auth(pair, (ack) => {
            if (errorCheck(ack)) {
                let err = (ack as any).err as string
                reject(err)
            } else {
                let sea = (ack as any).sea as ISEAPair
                let userInfo = (ack as any).put as GunUser
                session.set(`user_info`, JSON.stringify(userInfo))
                session.set(`key_pair`, sea)
                resolve({ userInfo, sea })
            }
        }))
    }
    /**
     * authenticate with username and password
     * If alias is available it automaticatically creates a new user... likewise reasoning for login
     */
    async function credentials(alias: string, password: string) {
        let session = await getSession(request.headers.get("Cookie"));
        if ((await aliasAvailable(alias))) {
            try {
                await createUser(alias, password)
            } catch (error) {
                return error
            }
        }
        return new Promise((resolve, reject) => gun.user().auth(alias, password, async (ack) => {
            if (Object.getOwnPropertyNames(ack).includes('sea')) {
                let sea = (ack as any).sea as ISEAPair
                let userInfo = (ack as any).put as GunUser
                session.set(`user_info`, userInfo)
                session.set(`key_pair`, sea)
                resolve({ userInfo, sea });
            }
            if (errorCheck(ack)) {
                let err = (ack as any).err as string
                reject(err)
            }
        }))
    }
    /**
     * 
   create user with alias and password then authenticate.
     */
    async function createUser(alias: string, password: string) {
        return new Promise((resolve, reject) => gun.user().create(alias, password, async (ack) => {
            if (!errorCheck(ack)) {
                resolve(ack)
            } else {
                let err = (ack as any).err as string
                reject(err)
            }
        }))
    }


    async function logout() {
        const session = await getSession(request.headers.get("Cookie"));
        return redirect(request.headers.get("Referer") ?? "/", {
            headers: {
                "Set-Cookie": await destroySession(session),
            },
        });
    }



    return {
        ENV,
        gunOpts,
        gun,
        SEA,
        user: { keyPairAuth, credentials, logout, getMasterUser, getSessionData },
        formData: async () => {
            let values: Record<string, string> | Record<string, FormDataEntryValue>
            if (request.headers.get("Content-Type") === "application/json") {
                values = Object.fromEntries(await request.json())
            }
            values = Object.fromEntries(await request.formData())
            let obj: Record<string, string> = {}
            return new Promise((resolve, reject) => {
                for (const prop in values) {
                    Object.assign(obj, { [prop]: values[prop] as string });
                }
                resolve(obj)
            })
        }
        // createToken: async (sessionKey = "verify") => {
        //     let session = await getSession();
        //     let token = (await SEA.pair()).epub
        //     session.set(sessionKey, token);
        //     return token;
        // },
        // verifyToken: async (request: Request, sessionKey = "verify") => {

        //     if (request.bodyUsed) {
        //         throw new Error(
        //             "The body of the request was read before calling verifyToken. Ensure you clone it before reading it."
        //         );
        //     }
        //     let session = await getSession();
        //     let formData = await request.clone().formData();

        //     if (!session.has(sessionKey)) {
        //         throw unprocessableEntity({
        //             message: "Can't find token in session.",
        //         });
        //     }

        //     if (!formData.get(sessionKey)) {
        //         throw unprocessableEntity({
        //             message: "Can't find token in body.",
        //         });
        //     }

        //     if (formData.get(sessionKey) !== session.get(sessionKey)) {
        //         throw unprocessableEntity({
        //             message: "Can't verify token authenticity.",
        //         });
        //     }
        // },
    }

}