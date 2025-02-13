# Rx lib

Visual Studio Code extension to create library of reusable `sed`-style regular expressions.

## Features

Open the Command Palette (ctrl/cmd + shift + P) and start typing in "rxl" to see the commands available. The available commands are:

- Add new regex: add a new regex to the workspace or globally
- Remove regex: remove a saved regex
- Apply regex: apply regex, substitution regexes will be applied in the current editor, find regexes will open the find dialog.
- Regex format is `sed`, i.e. `s/foo/bar/gi` for substitution and `/foo/gi` for find (like `sed` any non-whitespace/non-alphanum delimiters are supported).
- Uses the JavaScript regex engine, i.e. permitted flags are the JavaScript ones, groups are referenced by `$1` etc.

## Extension Settings

- Use `Rx lib: Add regex`/`Rx lib: Remove regex` from the command palette (`ctrl+shift+p`).
- Edit saved regexes in `User settings (JSON)`.
  ```js
  "rxl": {
    "Unbold": {
      "pattern": "s/\\*\\*(.*?)\\*\\*/$1/g",
    }
  }  
  ```

- Bind keyboard shortcuts to saved regexes in `Keyboad shortcuts (JSON)`:
  ```js
  {
    "key": "shift+ctrl+alt+u",
    "command": "rxl.apply",
    "args": {
      "regex": "Unbold"
    }
  }
  ```

### Object options

`key`: Label for regex, will be shown in menus.

`pattern`: `sed` style regex, NOTE: `\` needs to be escaped when editing directly in the JSON.

## Credits

Idea from <https://github.com/phitranphitranphitran/regexp-saver>
