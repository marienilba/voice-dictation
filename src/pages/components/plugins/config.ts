import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";

export const theme = {
  ltr: "text-left",
  rtl: "text-right",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph",
  quote:
    "m-0 ml-5 text-base bg-none border-l-gray-300 border-l-4 border-solid pl-4",
  heading: {
    h1: "text-2xl font-normal mb-3",
    h2: "text-base font-normal mb-3",
    h3: "text-sm font-normal mb-3",
    h4: "text-sm font-normal mb-3",
    h5: "text-xs font-normal mb-3",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal p-O m-O ml-4",
    ul: "list-disc p-O m-O ml-4",
    listitem: "my-2 mx-2",
  },
  image: "",
  link: "text-cyan-400",
  text: {
    bold: "font-bold",
    italic: "italic",
    overflowed: "",
    hashtag: "",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "line-through underline",
    code: "bg-gray-200 py-[1px] px-[0.25rem] text-[94%]",
  },
  code: "bg-gray-200 block p-2 pl-10 leading-[1.53] text-xs mt-2 mb-2 overflow-x-auto relative",
  codeHighlight: {
    atrule: "bg-cyan-200",
    attr: "bg-cyan-200",
    boolean: "bg-pink-400",
    builtin: "bg-green-400",
    cdata: "bg-slate-400",
    char: "bg-green-400",
    class: "bg-red-400",
    "class-name": "bg-red-400",
    comment: "bg-slate-400",
    constant: "bg-pink-400",
    deleted: "bg-pink-400",
    doctype: "bg-slate-400",
    entity: "bg-orange-400",
    function: "bg-red-400",
    important: "bg-green-400",
    inserted: "bg-green-400",
    keyword: "bg-cyan-200",
    namespace: "bg-green-400",
    number: "bg-pink-400",
    operator: "bg-orange-400",
    prolog: "bg-slate-400",
    property: "bg-pink-400",
    punctuation: "bg-green-200",
    regex: "bg-green-400",
    selector: "bg-green-400",
    string: "bg-green-400",
    symbol: "bg-pink-400",
    tag: "bg-pink-400",
    url: "bg-orange-400",
    variable: "bg-green-400",
  },
};

export const editorConfig = {
  namespace: "myEditor",
  // The editor theme
  theme: theme,
  // Handling of errors during update
  onError(error: any) {
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
  ],
};
