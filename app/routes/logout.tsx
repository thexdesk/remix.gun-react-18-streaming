import { LoaderFunction, redirect } from "remix";
import { LoadCtx } from "types";
import { getSession, destroySession } from "~/session.server";

export let loader: LoaderFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  const session = await getSession();
  return redirect(request.headers.get("Referer") ?? "/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};
