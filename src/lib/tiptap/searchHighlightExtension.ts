import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchHighlight: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      setMatchIndex: (matchIndex: number) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export interface SearchHighlightStorage {
  searchTerm: string;
  matchIndex: number;
  resultsCount: number;
}

export interface SearchHighlightPluginState {
  decorations: DecorationSet;
  searchTerm: string;
  matchIndex: number;
  resultsCount: number;
}

export const searchHighlightPluginKey = new PluginKey<SearchHighlightPluginState>('searchHighlight');

/**
 * Tiptap custom extension for WYSIWYG search highlighting using ProseMirror
 * DecorationSet API. Highlights all instances of `searchTerm` in the editor
 * document and marks the active match at `matchIndex`.
 */
export const SearchHighlightExtension = Extension.create<Record<string, any>, SearchHighlightStorage>({
  name: 'searchHighlight',

  addStorage() {
    return {
      searchTerm: '',
      matchIndex: 0,
      resultsCount: 0,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ dispatch, tr }) => {
          if (dispatch) {
            tr.setMeta(searchHighlightPluginKey, { searchTerm, matchIndex: 0 });
            dispatch(tr);
          }
          return true;
        },

      setMatchIndex:
        (matchIndex: number) =>
        ({ dispatch, tr }) => {
          if (dispatch) {
            tr.setMeta(searchHighlightPluginKey, { matchIndex });
            dispatch(tr);
          }
          return true;
        },

      clearSearch:
        () =>
        ({ dispatch, tr }) => {
          if (dispatch) {
            tr.setMeta(searchHighlightPluginKey, { searchTerm: '', matchIndex: 0 });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extensionStorage = this.storage;

    return [
      new Plugin<SearchHighlightPluginState>({
        key: searchHighlightPluginKey,
        state: {
          init: () => ({
            decorations: DecorationSet.empty,
            searchTerm: '',
            matchIndex: 0,
            resultsCount: 0,
          }),
          apply(tr, pluginState) {
            const meta = tr.getMeta(searchHighlightPluginKey);
            const searchTerm = meta?.searchTerm !== undefined ? meta.searchTerm : pluginState.searchTerm;
            const matchIndex = meta?.matchIndex !== undefined ? meta.matchIndex : pluginState.matchIndex;

            if (!searchTerm.trim()) {
              extensionStorage.searchTerm = '';
              extensionStorage.matchIndex = 0;
              extensionStorage.resultsCount = 0;
              return {
                decorations: DecorationSet.empty,
                searchTerm: '',
                matchIndex: 0,
                resultsCount: 0,
              };
            }

            const decorations: Decoration[] = [];
            const termLower = searchTerm.toLowerCase();
            let matchesFound = 0;

            tr.doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const textLower = node.text.toLowerCase();
                let index = textLower.indexOf(termLower);

                while (index !== -1) {
                  const start = pos + index;
                  const end = start + termLower.length;
                  const isActive = matchesFound === matchIndex;

                  decorations.push(
                    Decoration.inline(start, end, {
                      class: isActive ? 'search-result search-result--active' : 'search-result',
                    }),
                  );

                  matchesFound++;
                  index = textLower.indexOf(termLower, index + termLower.length);
                }
              }
            });

            const safeIndex = matchesFound > 0 ? ((matchIndex % matchesFound) + matchesFound) % matchesFound : 0;

            extensionStorage.searchTerm = searchTerm;
            extensionStorage.matchIndex = safeIndex;
            extensionStorage.resultsCount = matchesFound;

            return {
              decorations: DecorationSet.create(tr.doc, decorations),
              searchTerm,
              matchIndex: safeIndex,
              resultsCount: matchesFound,
            };
          },
        },
        props: {
          decorations(state) {
            return searchHighlightPluginKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});
