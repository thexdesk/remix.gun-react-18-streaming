import React from "react";
import { Link } from "remix";

interface Props {
  withBorder?: boolean;
  withInfo?: boolean;
  img?: string;
  size?: "small" | "normal" | "big" | "monster";
  type?: "square" | "rounded" | "full";
  to?: string;
}
function Avatar({ src }: { src: string }) {
  const [loading, setLoading] = React.useState(true);

  return (
    <div className="relative rounded-full w-full h-full overflow-hidden shadow">
      <img
        alt="Avatar"
        src={src}
        width="256"
        height="256"
        className={`w-full h-auto transition-opacity duration-200 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => {
          setLoading(false);
        }}
      />
      {loading && (
        <div className="absolute w-full h-full top-0 animate-pulse bg-gray-100 dark:bg-gray-900" />
      )}
    </div>
  );
}
export default Avatar;
