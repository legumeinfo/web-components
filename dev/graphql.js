// query a local instance of the LIS GraphQL server:
// https://github.com/legumeinfo/graphql-server
const uri = 'http://localhost:4000/';

// A function that gets data from a GraphQL server via a POST request.
// Adapted from https://graphql.org/graphql-js/graphql-clients/
function graphqlQuery(uri, query, variables={}, abortSignal=undefined) {
  return fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    signal: abortSignal,
  }).then(r => r.json());
}
// TODO: implement error handling
