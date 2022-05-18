import * as fs from "fs";
import * as fsp from "fs/promises";
import { createServer } from "http";
import type { RequestListener } from "http";
import * as path from "path";
import { installGlobals, formatServerError } from "@remix-run/node";
import { createRequestHandler } from "@remix-run/server-runtime";
import * as build from "@remix-run/server-build";
import mime from "mime";
import { RemixGunContext } from "./load-context";
import Gun, { GunOptions, IGunHookContext, ISEAPair, _GunRoot } from "gun";
import 'gun/lib/path'
import 'gun/sea'
import 'gun/lib/webrtc'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'
import 'gun/lib/then'
import 'gun/lib/later'
import 'gun/lib/load'
import 'gun/lib/open'
import 'gun/lib/not'
import 'gun/axe'
import { data } from "../data.config";
import jsesc from "jsesc";
import { checkIf } from "~/lib/utils/helpers";
function isCyclic(obj: any) {
  var keys: any[] = [];
  var stack: any[] = [];
  var stackSet = new Set();
  var detected = false;

  function detect(obj: any, key: string) {
    if (obj && typeof obj != 'object') { return; }

    if (stackSet.has(obj)) { // it's cyclic! Print the object and its locations.
      var oldindex = stack.indexOf(obj);
      var l1 = keys.join('.') + '.' + key;
      var l2 = keys.slice(0, oldindex + 1).join('.');
      detected = true;
      return;
    }

    keys.push(key);
    stack.push(obj);
    stackSet.add(obj);
    for (var k in obj) { //dive on the object's children
      if (Object.prototype.hasOwnProperty.call(obj, k)) { detect(obj[k], k); }
    }

    keys.pop();
    stack.pop();
    stackSet.delete(obj);
    return;
  }

  detect(obj, 'obj');
  return detected;
}

// export type _GunOptions = GunOptions & { accessToken: Function }
// Gun.on('opt', function (this: IGunHookContext<_GunRoot>, context: _GunRoot) {
//   if (Object.getOwnPropertyNames(context).includes('once')) {
//     return
//   }
//   // Pass to subsequent opt handlers
//   this.to.next(context)

//   const { accessToken } = context.opt as _GunOptions

//   if (!accessToken) {
//     throw new Error('you must pass in an isValid function')
//   }

//   if (!checkIf.isFn(accessToken)) {
//     // throw new Error('isValid must be a function')
//     console.log('isValid must be a function - TODO: Change to Error')
//   }

//   // Check all incoming traffic
//   context.on('in', function (msg) {
//     var to = this.to
//     // restrict put
//     if (msg.put) {
//       if (accessToken(msg)) {
//         to.next(msg)
//       }
//     } else {
//       to.next(msg)
//     }
//   })
// })

installGlobals();
const env = {
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

let remixHandler = createRequestHandler(
  build,
  { formatServerError },
  process.env.NODE_ENV
);

let cwd = process.cwd();
let requestListener: RequestListener = async (req, res) => {
  try {
    let url = new URL(req.url || "/", process.env.NODE_ENV !== "production" ? `http://${req.headers.host}` : `https://${req.headers.host}`);
    path.resolve();

    let filepath = path.resolve(cwd, path.join("public", url.pathname));
    let exists = await fsp
      .stat(filepath)
      .then((r) => r.isFile())
      .catch(() => false);
    if (exists) {
      let stream = fs.createReadStream(filepath);
      res.statusCode = 200;
      res.setHeader("Content-Type", mime.getType(filepath) || "text/plain");
      res.setHeader(
        "Cache-Control",
        url.pathname.startsWith("/build/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=10"
      );

      stream.pipe(res);
      return;
    }
  } catch (error) { }

  try {
    let url = new URL(req.url || "/", process.env.NODE_ENV !== "production" ? `http://${req.headers.host}` : `https://${req.headers.host}`);

    let headers = new Headers();

    for (let [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      if (Array.isArray(value)) {
        for (let val of value) {
          headers.append(key, val);
        }
        continue;
      }
      headers.append(key, value);
    }

    let method = (req.method || "get").toLowerCase();
    let body: any = ["get", "head"].includes(method) ? undefined : req;

    let request = new Request(url.toString(), {
      headers,
      body,
      method,
    });

    let response = await remixHandler(request, { RemixGunContext, res });
    if (response) {
      let headers: Record<string, string[]> = {};
      for (const [key, value] of response.headers) {
        headers[key] = headers[key] || [];
        headers[key].push(value);
      }
      res.writeHead(response.status, response.statusText, headers);
      if (Buffer.isBuffer(response.body)) {
        res.end(response.body);
      } else if ((response.body as any)?.pipe) {
        (response.body as any).pipe(res);
      } else {
        res.end();
      }
    }
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
};

let server = createServer(requestListener);

/**
 * GUN STUFF
 */
// Gun.on('opt', function (this: IGunHookContext<_GunRoot>, context: any) {
//   if ((context as any).once) return;
//   // Pass to subsequent opt handlers
//   this.to.next(context)

//   const { isValid } = context.opt

//   if (typeof isValid !== 'function') {
//     throw new Error('you must pass in an isValid function')
//   }

//   // Check all incoming traffic
//   context.on('in', function <
//     MessageExtension extends Partial<{
//       headers: { accessToken: string };
//       err: string;
//     }>,
//     MetaExtension extends Partial<_GunRoot>
//   >(this: IGunHookContext<GunHookMessageIn<MessageExtension, MetaExtension>>, msg: GunHookMessageIn<MessageExtension, MetaExtension>) {
//     var to = this.to
//     // restrict put
//     if (msg.put) {
//       const isValidMsg = isValid(msg)

//       if (isValidMsg instanceof Error) {
//         context.on('in', { '@': msg['#'], err: isValidMsg.message })
//       } else {
//         if (isValidMsg) {
//           to.next(msg)
//         }
//       }
//     } else {
//       to.next(msg)
//     }
//   })
// })
// function verifyToken(msg: { headers: { accessToken: string; }; }) {
//   if (msg?.headers?.accessToken) {
//     try {
//       jwt.verify(msg.headers.accessToken, env.APP_KEY_PAIR.priv as string);

//       return true;
//     } catch (err) {
//       const error = new Error('Invalid access token');

//       // if (err.name === 'TokenExpiredError') {
//       //   // you might want to implement silent refresh here
//       //   error.expiredAt = err.expiredAt;
//       // }

//       return error;
//     }
//   }

//   return false;
// }
export const getDomain = () => {
  if (process.env.NODE_ENV === "development") {
    return `http://${env.DOMAIN}/gun`
  }
  return `https://${env.DOMAIN}/gun`
}
let peerList = {
  DOMAIN: getDomain(),
  PEER: `https://${env.PEER_DOMAIN}/gun`,
};

// async function accessToken(msg: { headers: { accessToken: string; }; }) {
//   if (msg?.headers?.accessToken) {
//     return await Gun.SEA.work(msg.headers.accessToken, env.APP_KEY_PAIR)
//   }
// }

export const gun = Gun({
  peers: [peerList.PEER],
  web: server.listen(env.CLIENT, () => {
    console.log(`Remix.Gun Relay Server is listening on ${getDomain()}`);
  }),
  radisk: true,

});

/**
 * Sync the graph on out
 */
//@ts-ignore
gun.on('out', { get: { '#': { '*': '' } } });

//@ts-ignore




const user = gun.user();
gun.on("auth", function (data) {
  // console.log("auth", data);
  // JSON.stringify(data);
});
user.auth(env.APP_KEY_PAIR as any, (ack) => {
  if ((ack as any).err) {
    throw new Error("APP AUTH FAILED - Check your app keypair environment variables " + (ack as any).err)
  }
  console.log("APP AUTH SUCCESS")
})
user.get('pages').put(data.pages)
