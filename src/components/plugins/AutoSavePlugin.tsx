import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState } from "lexical";
import { useCallback } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
const initialEditorState = atomWithStorage("initialEditorState", false);

export function AutoSavePlugin() {
  const [, setEditorState] = useAtom(initialEditorState);
  const onChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const state = editorState.toJSON();
        setEditorState(state as any);
      });
    },
    [setEditorState]
  );
  return <OnChangePlugin onChange={onChange} />;
}
