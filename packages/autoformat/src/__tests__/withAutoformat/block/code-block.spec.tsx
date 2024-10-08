/** @jsx jsx */

import type { AutoformatPlugin } from '@udecode/plate-autoformat';
import type { Range } from 'slate';

import {
  ELEMENT_CODE_BLOCK,
  insertEmptyCodeBlock,
} from '@udecode/plate-code-block';
import {
  ELEMENT_DEFAULT,
  type PlateEditor,
  getEditorString,
  getPluginType,
  getRangeFromBlockStart,
  mockPlugin,
} from '@udecode/plate-common';
import { jsx } from '@udecode/plate-test-utils';
import { withReact } from 'slate-react';
import { autoformatPlugin } from 'www/src/lib/plate/demo/plugins/autoformatPlugin';
import { preFormat } from 'www/src/lib/plate/demo/plugins/autoformatUtils';

import { withAutoformat } from '../../../withAutoformat';

jsx;

describe('when ``` at block start', () => {
  it('should insert a code block below', () => {
    const input = (
      <editor>
        <hp>
          ``
          <cursor />
          hello
        </hp>
      </editor>
    ) as any;

    const output = (
      <editor>
        <hp>hello</hp>
        <hcodeblock>
          <hcodeline>new</hcodeline>
        </hcodeblock>
      </editor>
    ) as any;

    input.blockFactory = (node: any) => node;
    const editor = withAutoformat(withReact(input), autoformatPlugin as any);

    editor.insertText('`');
    editor.insertText('new');

    expect(input.children).toEqual(output.children);
  });
});

describe('when ``` at block start, but customising with query we get the most recent character typed', () => {
  it('should insert a code block below', () => {
    const input = (
      <editor>
        <hp>
          ``
          <cursor />
          hello
        </hp>
      </editor>
    ) as any;

    const output = (
      <editor>
        <hp>hello</hp>
        <hcodeblock>
          <hcodeline>inside code-block</hcodeline>
        </hcodeblock>
      </editor>
    ) as any;

    input.blockFactory = (node: any) => node;
    const codeEditor = withAutoformat(
      withReact(input),
      mockPlugin<AutoformatPlugin>({
        options: {
          rules: [
            {
              format: (editor) => {
                insertEmptyCodeBlock(editor, {
                  defaultType: getPluginType(
                    editor as PlateEditor,
                    ELEMENT_DEFAULT
                  ),
                  insertNodesOptions: { select: true },
                });
              },
              match: '```',
              mode: 'block',
              preFormat: preFormat as any,
              query: (editor, rule): boolean => {
                if (!editor.selection) {
                  return false;
                }

                const matchRange = getRangeFromBlockStart(editor) as Range;
                const textFromBlockStart = getEditorString(editor, matchRange);
                const currentNodeText = (textFromBlockStart || '') + rule.text;

                return rule.match === currentNodeText;
              },
              triggerAtBlockStart: false,
              type: ELEMENT_CODE_BLOCK,
            },
          ],
        },
      })
    );

    codeEditor.insertText('`');
    codeEditor.insertText('inside code-block');

    expect(input.children).toEqual(output.children);
  });
});

describe('when ```', () => {
  it('should insert a code block below', () => {
    const input = (
      <editor>
        <hp>
          hello``
          <cursor />
          world
        </hp>
      </editor>
    ) as any;

    const output = (
      <editor>
        <hp>helloworld</hp>
        <hcodeblock>
          <hcodeline>new</hcodeline>
        </hcodeblock>
      </editor>
    ) as any;

    input.blockFactory = (node: any) => node;
    const editor = withAutoformat(
      withReact(input),
      mockPlugin(autoformatPlugin as any)
    );

    editor.insertText('`');
    editor.insertText('new');

    expect(input.children).toEqual(output.children);
  });
});
