import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.focus();
    if (typeof window === "undefined") return;
    // editor.update(() => {
    //   // Get the RootNode from the EditorState
    //   const root = $getRoot();

    //   // Get the selection from the EditorState
    //   const selection = $getSelection();

    //   // Create a new ParagraphNode
    //   const paragraphNode = $createParagraphNode();

    //   // Create a new TextNode
    //   const textNode = $createTextNode("Hello world");

    //   // Append the text node to the paragraph
    //   paragraphNode.append(textNode);

    //   // Finally, append the paragraph to the root
    //   root.append(paragraphNode);
    // });
  }, [editor]);

  return null;
}
