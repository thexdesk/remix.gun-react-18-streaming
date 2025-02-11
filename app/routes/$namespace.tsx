import { Suspense } from "react";
import Gun from "gun";
import {
  ActionFunction,
  json,
  LoaderFunction,
  useLoaderData,
  useActionData,
  useCatch,
  Outlet,
} from "remix";
import { useDeferedLoaderData } from "~/dataloader/lib";
import { useIf } from "bresnow_utility-react-hooks";
import { LoadCtx } from "types";
import { Card } from "~/components/Card";
import Display from "~/components/DisplayHeading";
import { useGunStatic } from "~/lib/gun/hooks";
import FormBuilder from "~/components/FormBuilder";
import SecureRender from "~/components/Browser";
import { SectionTitle } from ".";
import { Navigation } from "~/root";

const noop = () => {};
type ErrObj = {
  _key?: string | undefined;
  _value?: string | undefined;
  _form?: string | undefined;
};
type LoadError = {
  error: ErrObj;
};
export let loader: LoaderFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  let { graph } = RemixGunContext(Gun, request);
  let namespace = params.namespace;
  let data;
  try {
    let _data = await graph.get("pages.index").val();
    data = { namespace, ..._data };
  } catch (error) {
    data = { error };
  }
  return json(data);
};
export let action: ActionFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  let { formData } = RemixGunContext(Gun, request);
  let error: ErrObj = {};
  try {
    let { prop, value } = await formData();

    if (!/^(?![0-9])[a-zA-Z0-9$_]+$/.test(prop)) {
      error._key =
        "Invalid property name : Follow Regex Pattern /^(?![0-9])[a-zA-Z0-9$_]+$/";
    }
    if (typeof value !== "string" || value.length < 1 || value.length > 240) {
      error._value =
        "Property values must be greater than 1 and less than 240 characters";
    }

    console.log({ [prop]: value }, "DATA");

    if (Object.values(error).length > 0) {
      return json<LoadError>({ error });
    }
    return json({ [prop]: value });
  } catch (err) {
    error._form = err as string;
    return json<LoadError>({ error });
  }
};

export default function Index() {
  let action = useActionData<Record<string, string> | LoadError>();
  const [gun] = useGunStatic(Gun);
  const Playground = FormBuilder();
  useIf([action, !action?.error], () => {
    gun.get("posts").get("test").put(action);
  });

  let testLoader = useDeferedLoaderData<any>("/api/gun/pages");
  let [keyErr, valErr] = Object.values(action?.error ?? {});
  return (
    <>
      <Outlet />
    </>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  switch (caught.status) {
    case 401:
    case 403:
    case 404:
      return (
        <div className="min-h-screen py-4 flex flex-col justify-center items-center">
          <Display
            title={`${caught.status}`}
            titleColor="white"
            span={`${caught.statusText}`}
            spanColor="pink-500"
            description={`${caught.statusText}`}
          />
        </div>
      );
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error.message);
  console.trace(error.message);
  return (
    <div className="min-h-screen py-4 flex flex-col justify-center items-center">
      <Display
        title="Error:"
        titleColor="#cb2326"
        span={error.message}
        spanColor="#fff"
        description={`error`}
      />
    </div>
  );
}
