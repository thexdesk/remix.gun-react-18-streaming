import { Suspense } from "react";
import Gun from "gun";
import {
  ActionFunction,
  json,
  LoaderFunction,
  useLoaderData,
  useActionData,
  useCatch,
} from "remix";
import { useDeferedLoaderData } from "~/dataloader/lib";
import { useIf } from "bresnow_utility-react-hooks";
import { LoadCtx } from "types";
import { Card } from "~/components/Card";
import Display from "~/components/DisplayHeading";
import { useGunStatic } from "~/lib/gun/hooks";
import FormBuilder from "~/components/FormBuilder";
import SimpleSkeleton from "~/components/skeleton/SimpleSkeleton";
import invariant from "@remix-run/react/invariant";

const noop = () => {};
type ErrObj = {
  path?: string;
  key?: string;
  value?: string;
  form?: string;
};
type LoadError = {
  error: ErrObj;
};
export let loader: LoaderFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  let { graph } = RemixGunContext(Gun, request);
  let data;
  try {
    data = await graph.get("pages.index").val();
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
    let { prop, value, path } = await formData();
    console.log(path, prop, value, "prop, value");

    if (!/^(?![0-9])[a-zA-Z0-9$_]+$/.test(prop)) {
      error.key =
        "Invalid property name : Follow Regex Pattern /^(?![0-9])[a-zA-Z0-9$_]+$/";
    }
    if (typeof value !== "string" || value.length < 1 || value.length > 240) {
      error.value =
        "Property values must be greater than 1 and less than 240 characters";
    }

    if (Object.values(error).length > 0) {
      return json<LoadError>({ error });
    }
    return json({ path: path && path, data: { [prop]: value } });
  } catch (err) {
    error.form = err as string;
    return json<LoadError>({ error });
  }
};

function WelcomeCard() {
  let { title, pageText, pageTitle, src } = useLoaderData();
  let img = { src, alt: "RemixGun" };
  return (
    <div
      className="w-full mx-auto rounded-xl mt-5 p-5  relative"
      style={{
        minHeight: "320px",
        minWidth: "420px",
        maxWidth: "520px",
      }}
    >
      <SectionTitle
        heading={pageTitle}
        description={pageText}
        align={"center"}
        color={"primary"}
        showDescription={true}
      />
      <Card image={img} name={pageTitle} label={title} />
    </div>
  );
}
function SuspendedTest({ getData }: { getData(): Record<string, any> }) {
  function RenderedData() {
    let data = getData();
    if (data.error) {
      return <></>;
    }
    let path = data._["#"];
    return (
      <div className="grid grid-cols-1 gap-4 p-4">
        <div className="col-span-1">
          <h5>
            Fetched data at document path <pre>{path}</pre>
          </h5>
          {data &&
            Object.entries(data).map((val) => {
              let [key, value] = val;
              if (key === "_") {
                return;
              }
              return (
                <div className="flex flex-row items-center space-y-5 justify-center space-x-5">
                  <div className="w-1/3 p-5 rounded-md ">{key}</div>
                  <div className="w-1/2 bg-gray-300 p-5 rounded-md flex-wrap">
                    {`${value}`}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }
  return <RenderedData />;
}
type LoadAction = {
  path: string;
  data: Record<string, string>;
};
export default function Index() {
  let action = useActionData<LoadAction | LoadError>(),
    error = action && (action as LoadError).error,
    ackData = action && (action as LoadAction).data,
    path = (action as LoadAction).path
      ? (action as LoadAction).path.replace("/", ".")
      : "posts.test";
  const [gun] = useGunStatic(Gun);
  const ObjectBuilder = FormBuilder();
  useIf([ackData, !error], () => {
    invariant(ackData, "ackData is undefined");
    gun.path(path).put(ackData);
  });
  let testLoader = useDeferedLoaderData<any>(`/api/gun/${path}`);

  return (
    <>
      <WelcomeCard />
      <div
        className="w-full mx-auto rounded-xl gap-4  p-4 relative"
        style={{
          minHeight: "320px",
          minWidth: "420px",
          maxWidth: "520px",
        }}
      >
        <ObjectBuilder.Form method={"post"}>
          <ObjectBuilder.Input
            type="text"
            name="path"
            label={"Document Path"}
            placeholder={"posts/test"}
            error={error?.path}
          />
          <ObjectBuilder.Input
            type="text"
            required
            name="prop"
            label={"Key"}
            error={error?.key}
          />
          <ObjectBuilder.Input
            type="text"
            required
            name="value"
            label={"Value"}
            error={error?.value}
          />
          <ObjectBuilder.Submit label={"Submit"} />
        </ObjectBuilder.Form>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 p-4">
              <div className="col-span-1">
                <h5>Cached Data From Radisk/ IndexedDB</h5>
                {testLoader.cachedData &&
                  Object.entries(testLoader.cachedData).map((val) => {
                    let [key, value] = val;
                    if (key === "_") {
                      return;
                    }
                    return (
                      <div className="flex animate-pulse flex-row items-center space-y-5 justify-center space-x-5">
                        <div className="w-1/3 p-5 rounded-md ">{key}</div>
                        <div className="w-1/2 bg-gray-300 p-5 rounded-md flex-wrap">
                          {`${value}`}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          }
        >
          <SuspendedTest getData={testLoader.load} />
        </Suspense>
      </div>
    </>
  );
}

export const SectionTitle = ({
  heading,
  description,
  align,
  color,
  showDescription,
}: TitleProps) => {
  const title = {
    showDescription: showDescription || false,
    align: align ? align : "center",
    color: color ? color : "primary",
  };
  return (
    <div className="section-title">
      <div className="container">
        <div className={`align-${title.align} mx-auto`}>
          <h2 className="font-bold max-w-3xl">{heading}</h2>
          {title.showDescription && (
            <p className="max-w-xl mt-2 leading-7 text-18base">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
type TitleProps = {
  heading: string;
  description: string;
  align?: "left" | "right" | "center";
  color?: "white" | "primary";
  showDescription: boolean;
};

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
  console.error(error);
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
