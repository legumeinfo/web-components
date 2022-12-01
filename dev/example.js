// query a local instance of the LIS GraphQL server:
// https://github.com/legumeinfo/graphql-server
const uri = 'http://localhost:4000/';
const geneQuery = `
  query ExampleGeneQuery($keyword: String!, $start: Int, $size: Int) {
    geneSearch(keyword: $keyword, start: $start, size: $size) {
      name
      description
    }
  }
`;
const traitQuery = `
  query ExampleTraitQuery($keyword: String!, $start: Int, $size: Int) {
    traitSearch(keyword: $keyword, start: $start, size: $size) {
      name
      description
    }
  }
`;

// the search function given to the LIS gene search webcomponent
function getGenes(searchText, page=1) {
  const pageSize = 10;
  const start = (page-1)*pageSize;
  const variables = {keyword: searchText, start, size: pageSize};
  // returns a Promise that resolves to an array of Gene objects the gene search
  // webcomponent knows how to parse: {name: string, description: string}[]
  return graphqlQuery(uri, geneQuery, variables)
    .then(({data}) => {
      return data.geneSearch;
    });
}

// the search function given to the LIS trait search webcomponent
function getTraits(searchText, page=1) {
  const pageSize = 10;
  const start = (page-1)*pageSize;
  const variables = {keyword: searchText, start, size: pageSize};
  // returns a Promise that resolves to an array of Trait objects the trait search
  // webcomponent knows how to parse: {name: string, description: string}[]
  return graphqlQuery(uri, traitQuery, variables)
    .then(({data}) => {
      return data.traitSearch;
    });
}

