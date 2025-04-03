// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

declare const tnt: any;

/**
 * A copy of the tnt.tree.node_display.circle function. This version has a
 * callback function as an optional parameter. The D3 selection is given to the
 * callback function, allowing application-specific modifications to be made to
 * the selection.
 *
 * @param callback The callback function that will be applied to the D3 selection.
 *
 * @returns The original tnt.tree.node_display.circle with the callback applied
 * to the D3 selection.
 */
export const circle = function (callback?) {
  const n = tnt.tree.node_display();
  n.display(function (node) {
    const selection = d3.select(this);
    if (callback !== undefined) callback(selection);
    selection
      //.style('cursor', 'pointer')
      .append('circle')
      .attr('r', function () {
        return d3.functor(n.size())(node);
      })
      .attr('fill', function () {
        return d3.functor(n.fill())(node);
      })
      .attr('stroke', function () {
        return d3.functor(n.stroke())(node);
      })
      .attr('stroke-width', function () {
        return d3.functor(n.stroke_width())(node);
      })
      .attr('class', 'tnt_node_display_elem');
  });
  return n;
};
