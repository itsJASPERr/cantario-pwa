/**
 * Arrange Markdown lyrics into musical lines when a paragraph contains chords.
 * Chorded lines reserve an upper lane; plain lines stay compact.
 *
 * This runs after rehype-chords, which has already converted [Am] into
 * chord-anchor spans. A lyric line is separated by a Markdown soft break
 * (newline in a text node) or a hard <br>. Inline formatting is preserved.
 */
const skipTags = new Set(["a", "code", "pre", "script", "style", "kbd", "svg", "math"]);

function isChord(node) {
  return node?.type === "element" &&
    (node.properties?.className || []).includes("chord-anchor");
}

function containsChord(node) {
  if (isChord(node)) return true;
  return Array.isArray(node?.children) && node.children.some(containsChord);
}

// Convert nested inline content into a list of fragments per manual lyric line.
// For example <em>one\n two</em> yields two individually formatted fragments.
function splitChildren(children) {
  const lines = [[]];
  for (const node of children) {
    const groups = splitNode(node);
    lines[lines.length - 1].push(...groups[0]);
    for (let i = 1; i < groups.length; i++) lines.push([...groups[i]]);
  }
  return lines;
}

function splitNode(node) {
  if (node.type === "text") {
    return node.value.split(/\r?\n/).map(part => part ? [{...node, value:part}] : []);
  }
  if (node.type !== "element") return [[node]];
  if (node.tagName === "br") return [[],[]];
  if (skipTags.has(node.tagName) || isChord(node) || !Array.isArray(node.children)) return [[node]];
  return splitChildren(node.children).map(children =>
    children.length ? [{...node, children}] : []
  );
}

export default function rehypeLyricLines() {
  return root => {
    function visit(node) {
      if (!Array.isArray(node.children)) return;
      if (node.tagName === "p" && containsChord(node)) {
        const lines = splitChildren(node.children);
        // Whitespace-only fragments still count as a musical line.
        node.children = lines.map(children => ({
          type:"element",
          tagName:"span",
          properties:{
            className:[
              "lyric-line",
              ...(children.some(containsChord) ? ["has-chord"] : [])
            ]
          },
          children: children.length ? children : [{type:"text",value:"\u00a0"}]
        }));
        return;
      }
      if (skipTags.has(node.tagName)) return;
      for (const child of node.children) visit(child);
    }
    visit(root);
  };
}
