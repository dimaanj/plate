import { MutableRefObject, useEffect, useRef } from 'react';
import { useEditorRef, useElement } from '@udecode/plate-common';
import { useReadOnly } from 'slate-react';

import { ELEMENT_TABLE, ELEMENT_TR } from '../../createTablePlugin';
import { getClosest } from '../../merge/getClosest';
import { getColSpan } from '../../merge/getColSpan';
import { getRowSpan } from '../../merge/getRowSpan';
import { getTableColumnIndex, getTableRowIndex } from '../../queries/index';
import { useTableStore } from '../../stores/tableStore';
import {
  TTableCellElement,
  TTableElement,
  TTableRowElement,
} from '../../types';
import {
  BorderStylesDefault,
  getTableCellBorders,
} from './getTableCellBorders';
import { useIsCellSelected } from './useIsCellSelected';

export type TableCellElementState = {
  colIndex: number;
  rowIndex: number;
  readOnly: boolean;
  hovered: boolean;
  hoveredLeft: boolean;
  selected: boolean;
  rowSize: number | undefined;
  borders: BorderStylesDefault;
  isSelectingCell: boolean;

  // Merge: cell colspan.
  colSpan: number;
  cellRef: MutableRefObject<HTMLTableCellElement | undefined>;
};

export const useTableCellElementState = ({
  ignoreReadOnly,
}: {
  /**
   * Ignores editable readOnly mode
   */
  ignoreReadOnly?: boolean;
} = {}): TableCellElementState => {
  const editor = useEditorRef();
  const cellElement = useElement<TTableCellElement>();
  const cellRef = useRef<HTMLTableDataCellElement>();

  // TODO: get rid of mutating element here
  // currently needed only for pasting tables from clipboard to gather span attributes
  cellElement.colSpan = getColSpan(cellElement);
  cellElement.rowSpan = getRowSpan(cellElement);

  const rowIndex =
    getTableRowIndex(editor, cellElement) + cellElement.rowSpan - 1;

  const readOnly = useReadOnly();

  const isCellSelected = useIsCellSelected(cellElement);
  const hoveredColIndex = useTableStore().get.hoveredColIndex();
  const selectedCells = useTableStore().get.selectedCells();
  const cellOffsets = useTableStore().get.cellsOffsets();

  const tableElement = useElement<TTableElement>(ELEMENT_TABLE);
  const rowElement = useElement<TTableRowElement>(ELEMENT_TR);
  const rowSizeOverrides = useTableStore().get.rowSizeOverrides();
  const rowSize =
    rowSizeOverrides.get(rowIndex) ?? rowElement?.size ?? undefined;

  const endColIndex = useRef<number>(getTableColumnIndex(editor, cellElement));
  const startCIndex = useRef<number>(getTableColumnIndex(editor, cellElement));

  // TODO: measure performance on huge tables with the following approach.
  // consider using cached offsets to calculate "closest" per column only (not for each cell)
  if (cellRef.current && hoveredColIndex === null && cellOffsets) {
    const cellOffset = cellRef.current.offsetLeft;
    const startColIndex = getClosest(cellOffset, cellOffsets);

    startCIndex.current = startColIndex;
    endColIndex.current = startColIndex + cellElement.colSpan - 1;
  }

  const isFirstCell = startCIndex.current === 0;
  const isFirstRow = tableElement.children?.[0] === rowElement;

  const borders = getTableCellBorders(cellElement, {
    isFirstCell,
    isFirstRow,
  });

  return {
    colIndex: endColIndex.current,
    rowIndex,
    colSpan: cellElement.colSpan,
    readOnly: !ignoreReadOnly && readOnly,
    selected: isCellSelected,
    hovered: hoveredColIndex === endColIndex.current,
    hoveredLeft: isFirstCell && hoveredColIndex === -1,
    rowSize,
    borders,
    isSelectingCell: !!selectedCells,
    cellRef,
  };
};

export const useTableCellElement = ({
  element,
}: {
  element: TTableCellElement;
}) => {
  const setHoveredColIndex = useTableStore().set.hoveredColIndex();

  useEffect(() => {
    setHoveredColIndex(null);
  }, [element, setHoveredColIndex]);

  return {
    props: {
      colSpan: element.colSpan,
      rowSpan: element.rowSpan,
    },
  };
};
