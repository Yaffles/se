import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

// Final version with a reliable, pure JavaScript timeout.
function PythonCoding({ defaultCode }) {
  const [code, setCode] = useState(defaultCode || '# Write your Python code here');
  const [output, setOutput] = useState('');
  const [pyodide, setPyodide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    async function setupPyodide() {
      if (window.pyodideInstance) {
        setPyodide(window.pyodideInstance);
        setIsLoading(false);
        return;
      }
      try {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/",
        });
        window.pyodideInstance = pyodideInstance;
        setPyodide(pyodideInstance);
      } catch (error) {
        console.error("Error loading Pyodide:", error);
        setOutput(`❌ Error setting up Python environment: ${error}`);
      } finally {
        setIsLoading(false);
      }
    }
    setupPyodide();
  }, []);

  const runCode = async () => {
    if (!pyodide) return;

    setIsExecuting(true);
    setOutput('⏳ Running...');

    const TIMEOUT_DURATION = 5000; // 5 seconds

    // --- The Promise.race Implementation ---

    // Promise 1: The actual Python code execution
    const executionPromise = (async () => {
      const pythonSetupCode = `
        import sys, builtins
        from js import prompt
        class OutputCatcher:
            def __init__(self): self.data = ""
            def write(self, s): self.data += str(s)
            def flush(self): pass
        catcher = OutputCatcher()
        sys.stdout = catcher
        sys.stderr = catcher
        def custom_input(prompt_text=""):
            return prompt(str(prompt_text))
        builtins.input = custom_input
      `;
      await pyodide.runPythonAsync(pythonSetupCode);
      await pyodide.runPythonAsync(code);
      return pyodide.globals.get('catcher').data;
    })();

    // Promise 2: A simple timer that rejects if it finishes first
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), TIMEOUT_DURATION)
    );

    try {
      // Promise.race waits for the first promise to either resolve or reject.
      const capturedOutput = await Promise.race([executionPromise, timeoutPromise]);
      setOutput(capturedOutput || '(no output)');
    } catch (error) {
      if (error.message === "Timeout") {
        setOutput(`❌ Error: Code execution timed out after 1 second.`);
      } else {
        // This will catch Python errors
        setOutput(`❌ Error: ${error}`);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const isRunning = isLoading || isExecuting;

  return (
    <div className="space-y-3">
      <div className="w-full p-1 border border-gray-600 rounded-md bg-gray-900">
         <Editor
            height="20rem"
            language="python"
            theme="vs-dark"
            defaultValue={code}
            onChange={(value) => setCode(value || '')}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
            }}
        />
      </div>
      <button
        onClick={runCode}
        disabled={isRunning}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 disabled:opacity-60"
      >
        {isLoading ? "Loading Python..." : isExecuting ? "Running..." : "Run Code"}
      </button>
      <pre className="w-full p-4 bg-gray-100 rounded-md text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
        {output}
      </pre>
    </div>
  );
}

export default PythonCoding;
