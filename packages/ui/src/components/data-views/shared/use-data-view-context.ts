import { useContext } from "react";
import { BoardContext } from "../board-view/board-context";
import { GalleryContext } from "../gallery-view/gallery-context";
import { ListContext } from "../list-view/list-context";
import { TableContext } from "../table-view/table-context";

/**
 * Unified hook that works with any data view context
 * Automatically detects which provider is being used
 */
export function useDataViewContext() {
	// Try each context - whichever is defined will be used
	const tableContext = useContext(TableContext);
	const galleryContext = useContext(GalleryContext);
	const listContext = useContext(ListContext);
	const boardContext = useContext(BoardContext);

	const context = tableContext || galleryContext || listContext || boardContext;

	if (!context) {
		throw new Error(
			"useDataViewContext must be used within a data view provider (TableProvider, GalleryProvider, ListProvider, or BoardProvider)",
		);
	}

	return context;
}
