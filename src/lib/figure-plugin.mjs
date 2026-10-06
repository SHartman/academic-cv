/**
 * Markdown figures with captions:   ![Alt text](./image.jpg "Caption, *italics* allowed")
 *
 * An image that sits alone in its paragraph and has a title becomes
 * <figure><img><figcaption>Caption</figcaption></figure>.
 * (A plugin for Sätteri, Astro's built-in Markdown processor.)
 */
const el = (tagName, children = [], properties = {}) => ({ type: 'element', tagName, properties, children });

const captionNodes = (text) =>
  text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith('*') && part.endsWith('*')
        ? el('em', [{ type: 'text', value: part.slice(1, -1) }])
        : { type: 'text', value: part },
    );

export const figureCaptions = {
  name: 'figure-captions',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      const kids = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
      const img = kids[0];
      if (kids.length !== 1 || img?.type !== 'element' || img.tagName !== 'img' || !img.properties?.title) return;
      const { title, ...properties } = img.properties;
      ctx.replaceNode(node, el('figure', [el('img', [], properties), el('figcaption', captionNodes(String(title)))]));
    },
  },
};
