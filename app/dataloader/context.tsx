import { createContext, useContext } from "react";
import type { FC } from "react";
import type { IGun } from "gun";

export interface ClientContext {
  load(route: string): Promise<Response>;
};

let context = createContext<ClientContext | undefined>(undefined);

export let DataloaderProvider = ({
  children,
  dataloader,
}: {
  children: React.PropsWithChildren<any>;
  dataloader: ClientContext;
}) => {
  return <context.Provider value={dataloader}>{children}</context.Provider>;
};

export let useDataLoader = () => useContext(context);

