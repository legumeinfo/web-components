// A function that gets data from an instance of the lis linkout microservice
// queryObject has two attributes, query and service.
// The query url is built from the domain and the attributes strings
// the domain is the url of the service. example: 'https://cicer.legumeinfo.org';
// The function returns a promise with a json reponse function.
function queryLinkouts(domain, queryObject) {
    const attributes = `${queryObject.service}?${queryObject.query}/json`;
    const url = domain + '/services/' + attributes;
    console.log(url);
    return fetch(url).then((response) => response.json());
}
