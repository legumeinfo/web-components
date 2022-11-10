
      // GraphQL
      const uri = 'http://dev.lis.ncgr.org:50054/server';
      const query = `
        query ExampleQuery($keyword: String!, $start: Int, $size: Int) {
	   geneSearch(keyword: $keyword, start: $start, size: $size) {
             name
             description
	   }
        }
      `;

      // Web Components
      const geneListElement = document.getElementById('gene-list');
      const paginationElement = document.getElementById('pagination');
      
      // Search
      const searchSubmit = document.getElementById('submit-search');
      const searchTerm = document.getElementById('search-term');

      // GraphQL query
      function getGenes(e) {
        // clear the gene list element
	console.log(e.type);
//        geneListElement.genes = [];
        geneListElement.searchTerm = searchTerm.value;
        if(e.type === "click" || e.type === "keyup"){
          paginationElement.page = 1;  // reset the page element for new search submit
	}
        // request new genes
        const start = (paginationElement.page-1)*10;
        console.log(start, geneListElement.searchTerm);
        const variables = {keyword: geneListElement.searchTerm, start, size: 10};
//        const variables = {keyword: "NB-ARC", start, size: 10};
        graphqlQuery(uri, query, variables)
          .then(({data}) => {
            console.log(data);
            if(data.geneSearch.length > 0){
              geneListElement.genes = data.geneSearch;
	    }
          });
      }

      // pagination event
      paginationElement.addEventListener('pageChange', getGenes);
      // search event
      searchSubmit.addEventListener('click', getGenes);
      searchTerm.addEventListener('keyup', function(event){if(event.keyCode === 13){getGenes(event)}});

      // load initial gene list when DOM is ready
//      document.addEventListener('DOMContentLoaded', (event) => {
//        getGenes();
//      });
