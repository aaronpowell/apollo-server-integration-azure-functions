import {
  ApolloServer,
  ApolloServerOptions,
  BaseContext,
  ContextFunction,
} from '@apollo/server';
import type { HttpHandler, InvocationContext } from '@azure/functions';
import type { app } from '@azure/functions';
import { normalizeRequest } from './normalizeRequest';

export interface AzureFunctionsContextFunctionArgument {
  context: InvocationContext;
}

export type AzureFunctionsMiddlewareOptions<TContext extends BaseContext> = {
  context?: ContextFunction<[AzureFunctionsContextFunctionArgument], TContext>;
  endpoint?: string;
} & ApolloServerOptions<BaseContext>;

const defaultContext: ContextFunction<
  [AzureFunctionsContextFunctionArgument],
  any
> = async () => ({});

export const azureFunctionsApollo = <TContext extends BaseContext>(
  functionsApp: typeof app,
  options: AzureFunctionsMiddlewareOptions<TContext>,
) => {
  const { context, ...serverOptions } = options;
  const server = new ApolloServer(serverOptions);

  const handler: HttpHandler = async (req, context) => {
    const contextFunction = options?.context ?? defaultContext;
    try {
      const normalizedRequest = await normalizeRequest(req);

      const { body, headers, status } = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: normalizedRequest,
        context: () => contextFunction({ context }),
      });

      if (body.kind === 'chunked') {
        throw Error('Incremental delivery not implemented');
      }

      return {
        status: status || 200,
        headers: {
          ...Object.fromEntries(headers),
          'content-length': Buffer.byteLength(body.string).toString(),
        },
        body: body.string,
      };
    } catch (e) {
      context.error('Failure processing GraphQL request', e);
      return {
        status: 400,
        body: (e as Error).message,
      };
    }
  };

  functionsApp.http(options.endpoint || 'graphql', {
    handler,
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
  });

  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
};
