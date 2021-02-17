import { Keys } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { TinyAssertions, TinyContentActions, TinyHooks, TinySelections } from '@ephox/mcagar';
import { PlatformDetection } from '@ephox/sand';

import Editor from 'tinymce/core/api/Editor';
import Theme from 'tinymce/themes/silver/Theme';

describe('browser.tinymce.core.keyboard.PageUpDownKeyTest', () => {
  const hook = TinyHooks.bddSetupLight<Editor>({
    add_unload_trigger: false,
    base_url: '/project/tinymce/js/tinymce',
    indent: false
  }, [ Theme ], true);
  const platform = PlatformDetection.detect();

  context('Page Up', () => {
    it('TINY-4612: caret should be placed before the inline element if it is at the start of it', () => {
      const editor = hook.editor();
      editor.setContent('<p>text<a href="google.com">link</a></p>');
      TinySelections.setCursor(editor, [ 0, 1, 0 ], 0);
      TinyContentActions.keyup(editor, Keys.pageUp());

      if (platform.browser.isIE()) {
        TinyAssertions.assertCursor(editor, [ 0, 0 ], 4);
      } else {
        TinyAssertions.assertCursor(editor, [ 0 ], 1);
      }
    });

    it('TINY-4612: caret should be placed before the inline element if it is at the end of it', () => {
      const editor = hook.editor();
      editor.setContent('<p>text<a href="google.com">link</a>text</p>');
      TinySelections.setCursor(editor, [ 0, 1, 0 ], 4);
      TinyContentActions.keystroke(editor, Keys.pageUp());

      if (platform.browser.isIE()) {
        TinyAssertions.assertCursor(editor, [ 0, 0 ], 4);
      } else {
        TinyAssertions.assertCursor(editor, [ 0 ], 1);
      }
    });

    it('TINY-4612: caret wont move if it is not at the beginning/end of the inline element', () => {
      const editor = hook.editor();
      editor.setContent('<p>text<a href="google.com">link</a>text</p>');
      TinySelections.setCursor(editor, [ 0, 1, 0 ], 2);
      TinyContentActions.keystroke(editor, Keys.pageUp());
      TinyAssertions.assertCursor(editor, [ 0, 1, 0 ], 2);
    });
  });

  context('Page Down', () => {
    it('TINY-4612: caret should be placed after the inline element if it is at the start of it', () => {
      const editor = hook.editor();
      editor.setContent('<p>text<a href="google.com">link</a>text</p>');
      TinySelections.setCursor(editor, [ 0, 1, 0 ], 0);
      TinyContentActions.keystroke(editor, Keys.pageDown());

      if (platform.browser.isIE()) {
        TinyAssertions.assertCursor(editor, [ 0, 2 ], 0);
      } else {
        TinyAssertions.assertCursor(editor, [ 0 ], 2);
      }
    });

    it('TINY-4612: caret should be placed after the inline element if it is at the end of it', () => {
      const editor = hook.editor();
      editor.setContent('<p>text<a href="google.com">link</a>text</p>');
      TinySelections.setCursor(editor, [ 0, 1, 0 ], 4);
      TinyContentActions.keystroke(editor, Keys.pageDown());

      if (platform.browser.isIE()) {
        TinyAssertions.assertCursor(editor, [ 0, 2 ], 0);
      } else {
        TinyAssertions.assertCursor(editor, [ 0 ], 2);
      }
    });

    it('TINY-4612: caret wont move if it is not at the beginning/end of the inline element', () => {
      const editor = hook.editor();
      editor.setContent('<p>text<a href="google.com">link</a>text</p>');
      TinySelections.setCursor(editor, [ 0, 1, 0 ], 2);
      TinyContentActions.keystroke(editor, Keys.pageDown());
      TinyAssertions.assertCursor(editor, [ 0, 1, 0 ], 2);
    });
  });
});
