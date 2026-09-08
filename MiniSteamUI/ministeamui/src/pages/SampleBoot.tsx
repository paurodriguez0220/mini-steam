import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useApi } from "../hooks/useApi";

/**
 * Bootstraps the API for the design samples.
 *
 * The samples read games straight from the store but none of them fetches, because
 * `App` is what normally triggers `initApi` on mount and the samples render outside it.
 */
export function SampleBoot() {
  const { initApi } = useApi();

  useEffect(() => {
    initApi();
  }, [initApi]);

  return <Outlet />;
}

export default SampleBoot;
