import * as React from 'react';
import { GridPrivateApiCommunity } from '../../../models/api/gridApiCommunity';
import { useGridApiOptionHandler, useGridNativeEventListener } from '../../utils';
import { gridFocusCellSelector } from '../focus/gridFocusStateSelector';
import { serializeCellValue } from '../export/serializers/csvSerializer';
import type { DataGridProcessedProps } from '../../../models/props/DataGridProps';

function writeToClipboardPolyfill(data: string) {
  const span = document.createElement('span');
  span.style.whiteSpace = 'pre';
  span.style.userSelect = 'all';
  span.style.opacity = '0px';
  span.textContent = data;

  document.body.appendChild(span);

  const range = document.createRange();
  range.selectNode(span);
  const selection = window.getSelection();
  selection!.removeAllRanges();
  selection!.addRange(range);

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(span);
  }
}

function copyToClipboard(data: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(data).catch(() => {
      writeToClipboardPolyfill(data);
    });
  } else {
    writeToClipboardPolyfill(data);
  }
}

function hasNativeSelection(element: HTMLInputElement) {
  // When getSelection is called on an <iframe> that is not displayed Firefox will return null.
  if (window.getSelection()?.toString()) {
    return true;
  }

  // window.getSelection() returns an empty string in Firefox for selections inside a form element.
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=85686.
  // Instead, we can use element.selectionStart that is only defined on form elements.
  if (element && (element.selectionEnd || 0) - (element.selectionStart || 0) > 0) {
    return true;
  }

  return false;
}

/**
 * @requires useGridCsvExport (method)
 * @requires useGridSelection (method)
 */
export const useGridClipboard = (
  apiRef: React.MutableRefObject<GridPrivateApiCommunity>,
  props: Pick<
    DataGridProcessedProps,
    'unstable_ignoreValueFormatterDuringExport' | 'onClipboardCopy' | 'clipboardCopyCellDelimiter'
  >,
): void => {
  const ignoreValueFormatterProp = props.unstable_ignoreValueFormatterDuringExport;
  const ignoreValueFormatter =
    (typeof ignoreValueFormatterProp === 'object'
      ? ignoreValueFormatterProp?.clipboardExport
      : ignoreValueFormatterProp) || false;

  const clipboardCopyCellDelimiter = props.clipboardCopyCellDelimiter;

  const handleCopy = React.useCallback(
    (event: KeyboardEvent) => {
      const isModifierKeyPressed = event.ctrlKey || event.metaKey;
      // event.code === 'KeyC' is not enough as event.code assume a QWERTY keyboard layout which would
      // be wrong with a Dvorak keyboard (as if pressing J).
      if (String.fromCharCode(event.keyCode) !== 'C' || !isModifierKeyPressed) {
        return;
      }

      // Do nothing if there's a native selection
      if (hasNativeSelection(event.target as HTMLInputElement)) {
        return;
      }

      let textToCopy = '';
      const selectedRows = apiRef.current.getSelectedRows();
      if (selectedRows.size > 0) {
        textToCopy = apiRef.current.getDataAsCsv({
          includeHeaders: false,
          // TODO: make it configurable
          delimiter: clipboardCopyCellDelimiter,
        });
      } else {
        const focusedCell = gridFocusCellSelector(apiRef);
        if (focusedCell) {
          const cellParams = apiRef.current.getCellParams(focusedCell.id, focusedCell.field);
          textToCopy = serializeCellValue(cellParams, {
            delimiterCharacter: clipboardCopyCellDelimiter,
            ignoreValueFormatter,
          });
        }
      }

      textToCopy = apiRef.current.unstable_applyPipeProcessors('clipboardCopy', textToCopy);

      if (textToCopy) {
        copyToClipboard(textToCopy);
        apiRef.current.publishEvent('clipboardCopy', textToCopy);
      }
    },
    [apiRef, ignoreValueFormatter, clipboardCopyCellDelimiter],
  );

  useGridNativeEventListener(apiRef, apiRef.current.rootElementRef!, 'keydown', handleCopy);

  useGridApiOptionHandler(apiRef, 'clipboardCopy', props.onClipboardCopy);
};
