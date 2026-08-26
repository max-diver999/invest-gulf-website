/**
 * Wraps content tables in a horizontal scroll container.
 *
 * `main` uses overflow-x: clip, so a table wider than the viewport used to lose
 * its right-hand columns. The previous fix made the table itself the scroll
 * container (display: block), which solved clipping but broke table layout:
 * with display: block the cells no longer share a column context, so narrow
 * two- and three-column tables collapsed to content width and left the rest of
 * the measure empty.
 *
 * Wrapping instead keeps the table a real table (display: table, width: 100%)
 * and moves the scrolling to the wrapper, so columns fill the measure on wide
 * screens and wide tables still scroll on narrow ones.
 */
import { visit } from 'unist-util-visit';

export function rehypeTableScroll() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === null) return;
      if (parent.type === 'element' && parent.properties?.className?.includes?.('table-scroll')) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      };
    });
  };
}
