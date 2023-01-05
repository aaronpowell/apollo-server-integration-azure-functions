import { azureFunctionsApollo } from '..';
import { app } from '@azure/functions';

// The GraphQL schema
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world',
  },
};

azureFunctionsApollo(app, { typeDefs, resolvers });
