// Give headings permanent links and wide content its own keyboard-accessible scroller.
// This runs on the build-time HTML tree; it adds no browser JavaScript.
export function accessibleMarkdown() {
  return (tree) => {
    function visit(parent) {
      if (!parent.children) return;
      parent.children = parent.children.map((node) => {
        if (node.type !== 'element') { visit(node); return node; }
        visit(node);
        if (/^h[2-6]$/.test(node.tagName) && node.properties?.id && !node.properties.className?.includes('sr-only')) {
          const label = (child) => child.value || (child.children || []).map(label).join('');
          const title = node.children.map(label).join('');
          node.children.push({
            type: 'element', tagName: 'a',
            properties: { href: `#${node.properties.id}`, className: ['heading-anchor'], ariaLabel: `Link to ${title}` },
            children: [],
          });
        }
        if (node.tagName === 'pre') {
          node.properties = { ...node.properties, tabIndex: 0, role: 'region', ariaLabel: 'Code example' };
        }
        if (node.tagName === 'table') {
          return {
            type: 'element', tagName: 'div',
            properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Data table' },
            children: [node],
          };
        }
        return node;
      });
    }
    visit(tree);
  };
}
