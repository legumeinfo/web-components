# Tree WebComponents
A TypeScript library that provides WebComponents for drawing phylogenetic trees in newick format.

Install, source and add the ```<phylo-tree treename="string" treedata="newick-tree"></phylo-tree>``` tag to draw a tree.

## Install
```
npm install
npm run build
```

## Example
```
<!DOCTYPE html>
<html>
  <script src="dist/tree-webcomponents.js"></script>
  <body>
    <h1>TEST ME</h1>
    <phylo-tree treename="test-tree" treedata="(A,B,(C,D))"></phylo-tree>
  </body>
</html>
```
