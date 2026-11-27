import { useQuery } from "@tanstack/react-query";
import { getSession } from "./API";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession
  })
}