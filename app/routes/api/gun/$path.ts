import { ActionFunction, json, LoaderFunction } from "remix";
import { LoadCtx } from "types";
import Gun from "gun";
export let loader: LoaderFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  let { gun } = RemixGunContext(Gun, request);
  let path = params.path;
  if (typeof path === "string") {
    let data = await gun.path(path).then();
    if (typeof data !== "undefined") {
      return json(data);
    }
    return json({ error: "not found" });

  }
  return json({ err: "node path invalid" });
};



