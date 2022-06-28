import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { MATCHERS } from "./plugins/AutoLinkPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { editorConfig } from "./plugins/config";
import { atomWithStorage } from "jotai/utils";
import { AutoSavePlugin } from "./plugins/AutoSavePlugin";
import { useAtom } from "jotai";
import AudioTranscribePlugin from "./plugins/AudioTranscribePlugin";
import { UserAgent, useUserAgent } from "next-useragent";
const initialEditorState = atomWithStorage("initialEditorState", null);

const defaultState = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};
export const Editor: React.FC<{ uaString: string }> = (props) => {
  const [EditorState] = useAtom(initialEditorState);
  let ua = useUserAgent(
    props.uaString ||
      (typeof window === "undefined" ? "ssr" : window.navigator.userAgent)
  );

  return (
    <div className="relative  w-full justify-center flex">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: EditorState
            ? JSON.stringify(EditorState)
            : JSON.stringify(defaultState),
        }}
      >
        <div className="w-full my-6 rounded-sm max-w-3xl p-1 text-black relative leading-5 font-normal text-left rounded-tl-lg">
          <AudioTranscribePlugin ua={ua} />
          <ToolbarPlugin lang="fr-FR" />
          <div className="bg-gray-200 rounded-lg relative h-[400px]  ">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="min-h-[150px]  h-full border-transparent focus:outline-none  focus:border-transparent max-h-[400px] overflow-auto resize-none text-base caret-black relative  pt-3.5 px-2.5" />
              }
              placeholder={
                <div className="tex-black opacity-50 overflow-hidden absolute text-ellipsis top-4 left-2.5 text-base select-none inline-block pointer-events-none">
                  Enter some text...
                </div>
              }
            />
            <AutoSavePlugin />
            <HistoryPlugin />
            {/* <TreeViewPlugin /> */}
            <CodeHighlightPlugin />
            <ListPlugin />
            <LinkPlugin />
            <AutoLinkPlugin matchers={MATCHERS} />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <HistoryPlugin />
            <AutoFocusPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
};
