import { CreateFetchHandler } from "@_/api.trpc/handler";
import { createContext } from "@/lib/context";

const handler = CreateFetchHandler({ ctx: createContext });

export { handler as GET, handler as POST };
