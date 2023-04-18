// query a local instance of the LIS GraphQL server:
// https://github.com/legumeinfo/graphql-server

// Note: using port 4444 since port 4000 is default for jekyll site
const uri = 'http://localhost:4444/';

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

// Flatten GraphQL results that contain objects
const flatten = (obj, out={}, prefixes=[]) => {
    if (obj != null && typeof obj == 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
            const key_prefixes = [...prefixes, key];
            if (typeof obj[key] == 'object' && !Array.isArray(obj[key])) {
                out = flatten(obj[key], out, key_prefixes);
            } else {
                const prefix_key = key_prefixes.join('_');
                if (Array.isArray(obj[key])) {
                    out[prefix_key] = obj[key].map((value) => flatten(value));
                } else {
                    out[prefix_key] = obj[key];
                }
            }
        });
    }
    return out;
};
