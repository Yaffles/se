// public/pyodide-worker.js
importScripts("pyodide/pyodide.js");

let pyodide;
let inputResolver = null;

async function setupPyodide() {
  if (pyodide) return;
  pyodide = await loadPyodide({ indexURL: "pyodide/" });

  self.getInputFromMainThread = (promptText) => {
    return new Promise((resolve) => {
      inputResolver = resolve;
      self.postMessage({ type: 'input_request', prompt: promptText });
    });
  };

  pyodide.globals.set("get_input_from_main_thread", self.getInputFromMainThread);

  const pythonSetupCode = `
    import sys, builtins, traceback, ast

    class OutputCatcher:
        def __init__(self): self.data = ""
        def write(self, s): self.data += str(s)
        def flush(self): pass

    catcher = OutputCatcher()
    sys.stdout = catcher
    sys.stderr = catcher

    async def custom_input(prompt_text=""):
        return await get_input_from_main_thread(str(prompt_text))

    builtins.input = custom_input

    def format_error():
        full_traceback = "".join(
            traceback.format_exception(sys.last_type, sys.last_value, sys.last_traceback)
        )
        lines = full_traceback.strip().split('\\n')
        try:
            start_index = next(i for i, line in enumerate(lines) if 'File "<exec>"' in line)
            # trim all lines and remove "File "<exec>"" from each line
            lines = [line.replace('File "<exec>", ', '') for line in lines]
            lines = [line.strip() for line in lines]
            return '\\n'.join(lines[start_index:])
        except StopIteration:
            return lines[-1]

    class AwaitInputTransformer(ast.NodeTransformer):
        def __init__(self):
            super().__init__()
            self.transformed = False

        def visit_Call(self, node):
            # If the function being called is 'input'
            if isinstance(node.func, ast.Name) and node.func.id == 'input':
                self.transformed = True # Mark that we made a change.
                # Wrap the original Call node in an Await node.
                return ast.Await(value=self.generic_visit(node))
            return self.generic_visit(node)

    def transform_code(source_code):
        """
        Parses the user's code. If 'input()' is used, it adds 'await' before each call.
        Otherwise, it returns the original code to preserve line numbers for errors.
        """
        try:
            tree = ast.parse(source_code)
            transformer = AwaitInputTransformer()
            new_tree = transformer.visit(tree)

            # Only unparse (rebuild the code) if a transformation was actually made.
            if transformer.transformed:
                ast.fix_missing_locations(new_tree)
                return ast.unparse(new_tree)
            else:
                # IMPORTANT: Return the original code if no 'input()' was found.
                return source_code
        except (SyntaxError, Exception):
            # On user syntax error, return original code to show the correct error.
            return source_code

  `;
  await pyodide.runPythonAsync(pythonSetupCode);
}

self.onmessage = async (event) => {
  const { code, input, type } = event.data;

  await setupPyodide();

  if (type === 'input_response' && inputResolver) {
    inputResolver(input);
    inputResolver = null;
    return;
  }

  if (type === 'run_code') {
    try {
      const transform_code = pyodide.globals.get("transform_code");

      // --- FIX: Convert the PyProxy result to a JS string ---
      const transformedCode = transform_code(code).toString();

      pyodide.globals.get('catcher').data = "";

      await pyodide.runPythonAsync(transformedCode);

      const output = pyodide.globals.get('catcher').data;
      self.postMessage({ type: 'output', output: output || '(no output)' });
    } catch (error) {
      const formattedError = pyodide.globals.get("format_error")();
      self.postMessage({ type: 'error', error: `❌ Error:\n${formattedError}` });
    }
  }
};
