// query a local instance of the LIS GraphQL server:
// https://github.com/legumeinfo/graphql-server

// Note: using port 4444 since port 4000 is default for jekyll site
// const domain = 'https://cicer.legumeinfo.org/services/';
// const attributes = 'gene_linkouts?genes=cicar.CDCFrontier.gnm3.ann1.Ca1g000600/json';
// const uri = domain + attributes;

// A function that gets data from a GraphQL server via a POST request.
// Adapted from https://graphql.org/graphql-js/graphql-clients/
function queryLinkouts(domain, queryObject) {
    const attributes = `${queryObject.service}?${queryObject.query}/json`;
    const url = domain + '/services/' + attributes;
    console.log(url);
    return fetch(url).then((response) => response.json());
}
