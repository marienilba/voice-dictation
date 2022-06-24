import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  LexicalEditor,
  RangeSelection,
  NodeSelection,
  GridSelection,
  $getRoot,
  $createTextNode,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isParentElementRTL,
  $wrapLeafNodesInElements,
  $isAtNodeEnd,
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const LowPriority = 1;

const supportedBlockTypes = new Set([
  "paragraph",
  "quote",
  "code",
  "h1",
  "h2",
  "ul",
  "ol",
]);

const blockTypeToBlockName = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List",
};

const blockTypeBackgroundUrl = {
  code: "code",
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
  h4: "type-h3",
  h5: "type-h3",
  ol: "list-ol",
  paragraph: "text-paragraph",
  quote: "chat-square-quote",
  ul: "list-ul",
};

function Divider() {
  return <div className="divider" />;
}
type Rect = {
  top: number;
  left: number;
  height: number;
  width: number;
} | null;
function positionEditorElement(editor: any, rect: Rect) {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${
      rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

function FloatingLinkEditor({ editor }: { editor: LexicalEditor }) {
  const editorRef = useRef(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mouseDownRef = useRef(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }
    const editorElem = editorRef.current;
    if (typeof window === "undefined") return;
    const nativeSelection = window.getSelection();
    if (!nativeSelection) return;
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner: HTMLElement | Element = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      if (!mouseDownRef.current) {
        positionEditorElement(editorElem, rect);
      }
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div
      ref={editorRef}
      className="absolute z-20 top-[-10000px] left-[-10000px] -mt-2 w-full opacity-0 bg-white shadow-md rounded-lg transition-opacity"
    >
      {isEditMode ? (
        <input
          ref={inputRef}
          className="block w-[calc(100%-24px)] box-border mt-2 mx-3 pt-2 px-3 bg-gray-100 text-black border-0 outline-none relative"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== "") {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className="block w-[calc(100%-24px)] box-border mt-2 mx-3 pt-2 px-3 bg-gray">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkUrl}
            </a>
            <div
              className="bg-[length:16px] bg-center bg-no-repeat w-10 align-[-0.25rem] absolute right-0 top-0 bottom-0 cursor-pointer"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
type SelectProps = {
  onChange: (e: any) => void;
  className: string;
  options: string[];
  value: string;
};
function Select({ onChange, className, options, value }: SelectProps) {
  return (
    <select className={className} onChange={onChange} value={value}>
      <option hidden={true} value="" />
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function getSelectedNode(selection: RangeSelection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}
type BlockOptionsDropdownListProps = {
  editor: LexicalEditor;
  blockType: keyof typeof blockTypeToBlockName;
  toolbarRef: MutableRefObject<HTMLDivElement | null>;
  setShowBlockOptionsDropDown: Dispatch<SetStateAction<boolean>>;
};
function BlockOptionsDropdownList({
  editor,
  blockType,
  toolbarRef,
  setShowBlockOptionsDropDown,
}: BlockOptionsDropdownListProps) {
  const dropDownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const dropDown = dropDownRef.current;

    if (toolbar !== null && dropDown !== null) {
      const { top, left } = toolbar.getBoundingClientRect();
      dropDown.style.top = `${top + 40}px`;
      dropDown.style.left = `${left}px`;
    }
  }, [dropDownRef, toolbarRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle = (event: MouseEvent) => {
        const target = event.target as Node;
        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = () => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createHeadingNode("h1"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = () => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createHeadingNode("h2"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, null);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, null);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, null);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, null);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div
      className="z-10 block absolute shadow-lg rounded-lg min-w-[100px] min-h-[40px] bg-white"
      ref={dropDownRef}
    >
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  mt-2 hover:bg-gray-100 "
        onClick={formatParagraph}
      >
        <span className="bg-[url(/images/icons/text-paragraph.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Normal</span>
        {blockType === "paragraph" && <span className="active" />}
      </button>
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  hover:bg-gray-100 "
        onClick={formatLargeHeading}
      >
        <span className="bg-[url(/images/icons/type-h1.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Large Heading</span>
        {blockType === "h1" && <span className="active" />}
      </button>
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  hover:bg-gray-100 "
        onClick={formatSmallHeading}
      >
        <span className="bg-[url(/images/icons/type-h2.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Small Heading</span>
        {blockType === "h2" && <span className="active" />}
      </button>
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  hover:bg-gray-100 "
        onClick={formatBulletList}
      >
        <span className="bg-[url(/images/icons/list-ul.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Bullet List</span>
        {blockType === "ul" && <span className="active" />}
      </button>
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  hover:bg-gray-100 "
        onClick={formatNumberedList}
      >
        <span className="bg-[url(/images/icons/list-ol.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Numbered List</span>
        {blockType === "ol" && <span className="active" />}
      </button>
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  hover:bg-gray-100 "
        onClick={formatQuote}
      >
        <span className="bg-[url(/images/icons/chat-square-quote.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Quote</span>
        {blockType === "quote" && <span className="active" />}
      </button>
      <button
        className="mx-2 p-4 cursor-pointer flex leading-4 text-xs content-center flex-row flex-shrink-0 justify-between bg-white border-0 min-w-[265px] active:bg-contain  mb-2 hover:bg-gray-100 "
        onClick={formatCode}
      >
        <span className="bg-[url(/images/icons/code.svg)] flex w-5 h-5 select-none mr-3 leading-4 bg-contain" />
        <span className="flex leading-5 grow w-[200px]">Code Block</span>
        {blockType === "code" && <span className="active" />}
      </button>
    </div>
  );
}

export default function ToolbarPlugin({ lang }: { lang?: string }) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(
    null
  );
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] =
    useState(false);
  const [codeLanguage, setCodeLanguage] = useState("");
  const [isRTL, setIsRTL] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const commands = [
    {
      command: "richard reset",
      callback: () => resetTranscript(),
    },
    {
      command: "richard stop",
      callback: () => SpeechRecognition.stopListening(),
    },
    {
      command: "richard bold",
      callback: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"),
    },
    {
      command: "richard italic",
      callback: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"),
    },
    {
      command: "richard underline",
      callback: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline"),
    },
    {
      command: "richard code",
      callback: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code"),
    },
    {
      command: "richard left",
      callback: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left"),
    },
    {
      command: "richard right",
      callback: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right"),
    },
    {
      command: "Richard Center",
      callback: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center"),
    },
    {
      command: "richard justify",
      callback: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center"),
    },
    {
      command: "richard numero liste",
      callback: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, null),
    },
    {
      command: "richard liste",
      callback: () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, null),
    },
    {
      command: "richard paragraphe",
      callback: () => {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            $wrapLeafNodesInElements(selection, () => $createParagraphNode());
          }
        });
      },
    },
    {
      command: "richard h1",
      callback: () => {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            $wrapLeafNodesInElements(selection, () => $createHeadingNode("h1"));
          }
        });
      },
    },
    {
      command: "richard h2",
      callback: () => {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            $wrapLeafNodesInElements(selection, () => $createHeadingNode("h2"));
          }
        });
      },
    },
    {
      command: `richard ${lang === "fr-FR" ? "citation" : "quote"}`,
      callback: () => {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            $wrapLeafNodesInElements(selection, () => $createQuoteNode());
          }
        });
      },
    },
  ];
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
    isMicrophoneAvailable,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({ commands });

  useEffect(() => {
    if (finalTranscript !== "") {
      editor.update(() => {
        const root = $getRoot();
        const paragraphNode = $createParagraphNode();
        const textNode = $createTextNode(finalTranscript);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      });
      resetTranscript();
    }
  }, [interimTranscript, finalTranscript, resetTranscript, editor]);

  const listenContinuously = async () => {
    if (!browserSupportsSpeechRecognition) {
      console.warn(
        "Your browser does not support speech recognition software! Try Chrome desktop, maybe?"
      );
      return;
    }
    if (!browserSupportsSpeechRecognition) {
      return null;
    }
    await SpeechRecognition.startListening({
      continuous: true,
      language: lang || "en-EN",
    });
    if (!isMicrophoneAvailable) {
      SpeechRecognition.abortListening();
    }
  };

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type: keyof typeof blockTypeToBlockName = parentList
            ? parentList.getTag()
            : element.getTag();
          if (!Object.keys(blockTypeToBlockName).includes(type)) return;
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (!Object.keys(blockTypeToBlockName).includes(type)) return;
          setBlockType(type as keyof typeof blockTypeToBlockName);
          if ($isCodeNode(element)) {
            setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
          }
        }
      }
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(!!payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(!!payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const codeLanguges = useMemo(() => getCodeLanguages(), []);
  const onCodeLanguageSelect = useCallback(
    (e: any) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(e.target.value);
          }
        }
      });
    },
    [editor, selectedElementKey]
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div
      className="flex mb-0.5 bg-white p-1 rounded-t-xl align-middle flex-wrap"
      ref={toolbarRef}
    >
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, null);
        }}
        className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
        aria-label="Undo"
      >
        <i
          className={`bg-[url(/images/icons/arrow-counterclockwise.svg)]  h-4 w-4 mt-0.5 align-[-0.25rem] opacity-60 ${
            !canUndo ? "opacity-20" : "opacity-60"
          }`}
        />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, null);
        }}
        className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
        aria-label="Redo"
      >
        <i
          className={`bg-[url(/images/icons/arrow-clockwise.svg)]  h-4 w-4 mt-0.5 align-[-0.25rem] ${
            !canRedo ? "opacity-20" : "opacity-60"
          }`}
        />
      </button>
      <Divider />
      {supportedBlockTypes.has(blockType) && (
        <div>
          <button
            className="border-0 flex  bg-none rounded-xl p-2 cursor-pointer align-middle bg-gray-100 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
            onClick={() =>
              setShowBlockOptionsDropDown(!showBlockOptionsDropDown)
            }
            aria-label="Formatting Options"
          >
            <span
              className={`flex w-4 h-4 select-none m-0.5 leading-4 bg-contain bg-[url(/images/icons/${blockTypeBackgroundUrl[blockType]}.svg)]`}
            />
            <span className="flex grow ml-2 leading-5 text-sm w-[100px]">
              {blockTypeToBlockName[blockType]}
            </span>
            <i className="bg-[url(/images/icons/chevron-down.svg)] flex w-4 h-4 select-none ml-3 leading-4 bg-contain" />
          </button>
          {showBlockOptionsDropDown &&
            createPortal(
              <BlockOptionsDropdownList
                editor={editor}
                blockType={blockType}
                toolbarRef={toolbarRef}
                setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
              />,
              document.body
            )}
          <Divider />
        </div>
      )}
      {blockType === "code" ? (
        <>
          <Select
            className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle code-language disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
            onChange={onCodeLanguageSelect}
            options={codeLanguges}
            value={codeLanguage}
          />
          <i className="mt-2 w-4 h-4 select-none flex pointer-events-none mr-2 -ml-4" />
        </>
      ) : (
        <>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={
              "border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200 enabled:font-bold"
            }
            aria-label="Format Bold"
          >
            <i className="bg-[url(/images/icons/type-bold.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={
              "border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 active:italic disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200 "
            }
            aria-label="Format Italics"
          >
            <i className="bg-[url(/images/icons/type-italic.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={
              "border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200 " +
              (isUnderline ? "active" : "")
            }
            aria-label="Format Underline"
          >
            <i className="bg-[url(/images/icons/type-underline.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
            }}
            className={
              "border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200 " +
              (isStrikethrough ? "active" : "")
            }
            aria-label="Format Strikethrough"
          >
            <i className="bg-[url(/images/icons/type-strikethrough.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            }}
            className={
              "border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200" +
              (isCode ? "active" : "")
            }
            aria-label="Insert Code"
          >
            <i className="bg-[url(/images/icons/code.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={insertLink}
            className={
              "border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200" +
              (isLink ? "active" : "")
            }
            aria-label="Insert Link"
          >
            <i className="bg-[url(/images/icons/link.svg)]  h-4 w-4 mt-0.5" />
          </button>
          {isLink &&
            createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
          <Divider />
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
            }}
            className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
            aria-label="Left Align"
          >
            <i className="bg-[url(/images/icons/text-left.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
            }}
            className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
            aria-label="Center Align"
          >
            <i className="bg-[url(/images/icons/text-center.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
            }}
            className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle mr-0.5 disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
            aria-label="Right Align"
          >
            <i className="bg-[url(/images/icons/text-right.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
            }}
            className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
            aria-label="Justify Align"
          >
            <i className="bg-[url(/images/icons/justify.svg)]  h-4 w-4 mt-0.5" />
          </button>
          <div className=" flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (listening) {
                  SpeechRecognition.stopListening();
                } else {
                  listenContinuously();
                }
              }}
              className="border-0 flex bg-none rounded-xl p-2 cursor-pointer align-middle disabled:cursor-not-allowed active:bg-gray-600 active:opacity-100 hover:enabled:bg-gray-200"
              aria-label="Justify Align"
            >
              {listening ? (
                <i
                  className={`bg-[url(/images/icons/dictaphone-on.svg)] h-5 w-5 bg-no-repeat`}
                />
              ) : (
                <i
                  className={`bg-[url(/images/icons/dictaphone-off.svg)] h-5 w-5 bg-no-repeat`}
                />
              )}
            </button>
            {listening &&
              (transcript ? (
                <div className="flex items-center justify-center mr-2 ">
                  <button
                    data-text="wavewave"
                    className="pointer-events-none relative mb-2 text-transparent cursor-none text-xs  right-0 overflow-hidden before:content-[attr(data-text)attr(data-text)] before:underline before:underline-offset-10  before:decoration-wavy before:decoration-sky-400 before:absolute before:whitespace-nowrap before:text-transparent before:animate-wave"
                  >
                    wavewave
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center mr-2">
                  <button
                    data-text="wavewave"
                    className="pointer-events-none mb-2 relative items-center  text-transparent cursor-none text-xs  right-0 overflow-hidden before:content-[attr(data-text)attr(data-text)] before:underline before:underline-offset-10  before:decoration-dashed before:decoration-sky-400 before:absolute before:whitespace-nowrap before:text-transparent "
                  >
                    wavewave
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
