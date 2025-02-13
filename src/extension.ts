import * as vscode from "vscode"
import { Rx, sedrx } from "./sedrx"

declare type RxStore = {[key: string]: {pattern: string, used?: number}}
const ROOT = 'rxl'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.concat([
    vscode.commands.registerCommand(`${ROOT}.add`, add),
    vscode.commands.registerCommand(`${ROOT}.remove`, remove),
    vscode.commands.registerTextEditorCommand(
      `${ROOT}.apply`,
      (editor, edit, args) => apply(editor, edit, args?.regex)
    )
  ])
}

async function add() {
  const pattern = await vscode.window.showInputBox({
    prompt: "Add regex",
    ignoreFocusOut: true,
    validateInput: (input) => {
      const rx = sedrx(input)
      if (!rx) return "Invalid regex"
      try {new RegExp(rx.find, rx.flags)}
      catch {return "Invalid regex"}
      return null
    }
  })
  if (!pattern) return

  const store_lbl = await vscode.window.showQuickPick(
    ["Global", "Workspace"],
    {
      title: "Global or workspace scope?",
      ignoreFocusOut: true,
    }
  )
  if (!store_lbl) return
  const config = vscode.workspace.getConfiguration()
  const store: RxStore = store_lbl === "Global"
    ? config.inspect(ROOT)?.globalValue as RxStore || {} as RxStore
    : config.inspect(ROOT)?.workspaceValue as RxStore || {} as RxStore

  const label = await vscode.window.showInputBox({
    prompt: "Label",
    ignoreFocusOut: true,
    validateInput: (input) => {
      if (input in store) return `Label ${input} already in use in scope`
      return null
    }
  })
  if (!label) return

  store[label] = {pattern: pattern, used: 0}
  await config.update(ROOT, store, store_lbl === "Global" ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace)

  vscode.window.showInformationMessage("Regex saved")
}

async function remove() {
  const config = vscode.workspace.getConfiguration()
  const root = config.get(ROOT) as RxStore
  const items =  Object.entries(root).map(([label, rx]) => {return {label: label, description: rx.pattern, used: rx.used || 0}})
  items.sort((a, b) => a.used > b.used ? -1 : 1)
  const rx = await vscode.window.showQuickPick(items, {placeHolder: "Delete regex"})
  if (!rx) return null

  if (rx.label in (config.inspect(ROOT)?.workspaceValue as RxStore || {})) {
    const cfg = config.inspect(ROOT)?.workspaceValue as RxStore
    delete cfg[rx.label]
    await config.update(ROOT, cfg, vscode.ConfigurationTarget.Workspace)
  } else {
    const cfg = config.inspect(ROOT)?.globalValue as RxStore
    delete cfg[rx.label]
    await config.update(ROOT, cfg, vscode.ConfigurationTarget.Global)
  }
  vscode.window.showInformationMessage("Regex deleted")
}

async function apply(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, regex?: string) {
  const config = vscode.workspace.getConfiguration()
  const root = config.get(ROOT) as RxStore
  let pattern = ''
  if (!regex) {
    const items = Object.entries(root).map(([label, rx]) => {return {label: label, description: rx.pattern, used: rx.used || 0}})
    items.sort((a, b) => a.used > b.used ? -1 : 1)
    const item = await vscode.window.showQuickPick(items, {placeHolder: "Apply regex"})
    if (!item) return

    // update use timestamp
    if (item.label in (config.inspect(ROOT)?.workspaceValue as RxStore || {})) {
      const cfg = config.inspect(ROOT)?.workspaceValue as RxStore
      cfg[item.label].used = Date.now()
      await config.update(ROOT, cfg, vscode.ConfigurationTarget.Workspace)
    } else {
      const cfg = config.inspect(ROOT)?.globalValue as RxStore
      cfg[item.label].used = Date.now()
      await config.update(ROOT, cfg, vscode.ConfigurationTarget.Global)
    }

    pattern = item.description
  } else if (regex in root) {
    pattern = root[regex].pattern
  }

  const rx = sedrx(pattern)
  if (!rx) {
    pattern ||= '<undefined>'
    vscode.window.showErrorMessage(`Invalid regex: ${pattern}`)
    return null
  }

  // find or replace
  const {selection} = editor
  if (rx.replace !== null) {
    const text = selection.isEmpty
      ? editor.document.getText()
      : editor.document.getText(selection)
    const range = selection.isEmpty
      ? new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(text.length))
      : selection

      editor.edit(editBuilder => editBuilder.replace(range, text.replace(new RegExp(rx.find, rx.flags), rx.replace!)))
  } else {
    vscode.commands.executeCommand("editor.actions.findWithArgs", {
      searchString: rx.find,
      isRegex: true,
      findInSelection: !selection.isEmpty
    })
  }
}
