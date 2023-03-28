// directly query an LIS linkout service:
// https://github.com/legumeinfo/microservices/tree/main/linkouts

const linkoutUri = 'https://cicer.legumeinfo.org/services/gene_linkouts';

// A function that gets linkouts for the given list of genes
function geneLinkouts(uri, genes, abortSignal=undefined) {
  return fetch(uri, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({genes}),
    signal: abortSignal,
  }).then((response) => response.json());
}
