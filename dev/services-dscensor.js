// query a local instance of the LIS GraphQL server:
// https://github.com/legumeinfo/graphql-server

// Note: using port 4444 since port 4000 is default for jekyll site
const uri = 'https://services.lis.ncgr.org/dscensor/';
const exampleQuery = 'genomes?genus=arachis'
const url = uri + exampleQuery
const getGenus = 'https://services.lis.ncgr.org/dscensor/genera'
// A function that gets data from a GraphQL server via a POST request.
// Adapted from https://graphql.org/graphql-js/graphql-clients/
function dscensorQuery(url) {
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })
    .then(r => r.json())
    .then((response) => {
      if (response.errors) {
        response.errors.forEach(console.error);
      }
      return response;
    });
}

function dscensorFormQuery(event, url) {
    event.preventDefault(); // prevent the form from submitting normally
    // your custom code here
    console.log('Form submitted');
    console.log('URL:', url);
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })
    .then(r => r.json())
    .then((response) => {
      if (response.errors) {
        response.errors.forEach(console.error);
      }
      return response;
    });
}

// Flatten GraphQL results that contain objects
const flatten = (obj, out={}, prefixes=[]) => {
    if (obj != null) {
        Object.keys(obj).forEach(key => {
            const key_prefixes = [...prefixes, key];
            if (typeof obj[key] == 'object' && !Array.isArray(obj[key])) {
                out = flatten(obj[key], out, key_prefixes);
            } else {
//                const prefix_key = key_prefixes.join('_');
                out[key] = obj[key];
            }
        });
    }
    return out;
};
