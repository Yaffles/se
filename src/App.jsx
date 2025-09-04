import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";

// Map exam IDs to JSON files
const examFiles = {
  cssa_familiarisation: "data/cssa_familiarisation.json",
  nsb: "data/nsb.json",
  cssa_trial: "data/cssa_trial.json",
  girraween: "data/girraween.json",
  hsc_familiarisation: "data/hsc_familiarisation.json",
  hsc_sample_exam: "data/hsc_sample_exam.json",
  independent: "data/independent.json",
  doe_sample_exam: "data/doe_sample.json",
  normanhurst: "data/normanhurst.json",
};

export default function App() {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  // sync `exam` from query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const examParam = urlParams.get("exam");
    setExam(examParam);
  }, []);

  // fetch questions when exam changes
  useEffect(() => {
    if (!exam) return;
    if (!examFiles[exam]) {
      setError(`❌ Unknown exam: ${exam}`);
      return;
    }

    setLoading(true);
    setError("");
    fetch(examFiles[exam])
      .then((r) => r.json())
      .then((data) => setQuestions(data))
      .catch(() => setError("Failed to load questions."))
      .finally(() => setLoading(false));
  }, [exam]);

  return (
    <div className="container mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Software Engineering Assessments
        </h1>
        {!exam && <p className="text-gray-600 mt-2">Choose a test to begin</p>}
        {exam && (
          <div className="mt-4 space-x-4">
            <a href="/" className="text-indigo-600 hover:underline inline-block">
              ← Back to exams
            </a>
            <a
              href={`/answers/${exam}_answers.pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-rose-600 hover:underline inline-block"
            >
              View Answers document
            </a>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`
              px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm
              ${showAnswers
                ? "bg-red-100 text-red-800 hover:bg-red-200" // Red light theme when answers are visible
                : "bg-green-100 text-green-800 hover:bg-green-200" // Green light theme when answers are hidden
              }
            `}
            >
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          </div>
        )}
      </header>

      <main>
        {!exam && <ExamList />}
        {exam && loading && (
          <div className="text-gray-600">Loading questions…</div>
        )}
        {exam && error && <div className="text-red-600">{error}</div>}
        {exam && !loading && !error && (
          <ExamView exam={exam} questions={questions} showAnswers={showAnswers} />
        )}
      </main>
    </div>
  );
}

function ExamList() {
  const exams = [
    {
      id: "cssa_familiarisation",
      title: "CSSA Familiarisation",
      desc:
        "Practice familiarisation questions for the CSSA Software Engineering exam.",
    },
    {
      id: "cssa_trial",
      title: "CSSA Trial Exam",
      desc: "CSSA Trial Software Engineering exam.",
    },

{
      id: "independent",
      title: "Independent Trial Exam",
      desc: "Independent Trial Exam for Software Engineering."
    },

    {
      id: "hsc_familiarisation",
      title: "HSC Familiarisation Questions",
      desc: "HSC Software Engineering familiarisation questions.",
    },
    {
      id: "hsc_sample_exam",
      title: "HSC Sample Exam",
      desc: "HSC Software Engineering sample exam questions.",
    },

    {
      id: "doe_sample_exam",
      title: "Department of Education Sample Exam",
      desc: "Department of Education (DoE) Sample Exam for some state schools."
    },
    {
      id: "girraween",
      title: "Girraween Exam",
      desc: "Girraween High School Software Engineering exam. Partially adapted from independent exam.",
    },
    { id: "nsb", title: "NSB Exam", desc: "North Sydney Boys High School Software Engineering exam." },
    {
      id: "normanhurst",
      title: "Normanhurst Trial Exam",
      desc: "Normanhurst Boys High School Trial Exam for Software Engineering. Partially adapted from Department of Education and Independent exam."
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <a
          key={exam.id}
          href={`?exam=${exam.id}`}
          className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800">{exam.title}</h2>
          <p className="text-gray-600 mt-2">{exam.desc}</p>
        </a>
      ))}
    </div>
  );
}

function ExamView({ exam, questions, showAnswers }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Exam: {exam.replace(/_/g, " ").toUpperCase()}
        </h2>
        <p className="text-gray-600">Please answer the following questions:</p>
      </div>

      <div className="space-y-8">
        {questions.map((q, idx) => (
          <QuestionCard key={q.id || idx} data={q} showAnswers={showAnswers} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ data, showAnswers }) {
  if (!data?.parts?.length) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {data.parts.map((part, i) => (
        <QuestionPart key={i} qid={data.id} part={part} stimulus={data.stimulusContentItemCollection} showAnswers={showAnswers} />
      ))}
    </div>
  );
}

function QuestionPart({ qid, part, stimulus, showAnswers }) {
  const mark = part?.metadata?.mark;
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
          {part?.title || "Untitled"}
        </h3>
        {typeof mark !== "undefined" && (
          <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
            {mark} {mark === 1 ? "mark" : "marks"}
          </span>
        )}
      </div>

      <StimulusBlock stimulus={stimulus} qid={qid} />

      <div className="question-content prose max-w-none text-gray-800">
        {part?.content?.contentItemCollection?.items?.map((item, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: item.text }} />
        ))}
      </div>

      <div className="mt-4">
        <AnswerRenderer qid={qid} params={part?.answer?.parameters} marks={mark} showAnswers={showAnswers} markingCriteria={part?.markingCriteriaContentItem?.criteria} sampleAnswer={part?.sampleAnswerContentItem} />
      </div>
    </div>
  );
}

function StimulusBlock({ stimulus, qid }) {
  const items = stimulus?.items || [];
  if (!items.length) return null;

  return (
    <div className="stimulus bg-gray-50 p-4 rounded-md mb-4 border border-gray-200 space-y-4">
      {items.map((item, i) => {
        if (item.type === "RICH_TEXT") {
          return (
            <div key={i} className="prose max-w-none" dangerouslySetInnerHTML={{ __html: item.text }} />
          );
        }
        if (item.type === "IMAGE_SLIDER" && item.files) {
          return <ImageSlider key={i} files={item.files} sliderId={`slider-${qid}-${i}`} />;
        }
        if (item.type === "IMAGE" && item.files) {
          return (
            <div key={i} className="space-y-2">
              {item.files.map((file, idx) => (
                <img
                  key={idx}
                  src={file.url}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Not+Found";
                  }}
                />
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function ImageSlider({ files, sliderId }) {
  const [index, setIndex] = useState(0);
  const total = files.length;
  const show = (delta) => setIndex((i) => (i + delta + total) % total);

  return (
    <div className="relative" id={sliderId}>
      {/* Image Display */}
      <div className="relative">
        {files.map((file, i) => (
          <div key={i} className={i === index ? "" : "hidden"}>
            <img
              src={file.url}
              alt={`Slide ${i + 1}`}
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Not+Found";
              }}
            />
          </div>
        ))}
        {/* Navigation Arrows */}
        <button
          type="button"
          className="slider-arrow prev absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/80 rounded shadow"
          onClick={() => show(-1)}
        >
          &#10094;
        </button>
        <button
          type="button"
          className="slider-arrow next absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/80 rounded shadow"
          onClick={() => show(1)}
        >
          &#10095;
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center space-x-2 mt-4">
        {files.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`w-3 h-3 rounded-full ${
              i === index ? "bg-gray-800" : "bg-gray-300"
            }`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}


function AnswerRenderer({ qid, params, marks, showAnswers, markingCriteria=null, sampleAnswer=null }) {
  if (!params) return null;
  switch (params.type) {
    case "MULTI_CHOICE":
      return <MultiChoice qid={qid} params={params} showAnswers={showAnswers} />;
    case "SHORT":
      return <ShortAnswer mark={marks} showAnswers={showAnswers} markingCriteria={markingCriteria} sampleAnswer={sampleAnswer} />;
    case "OBJECTIVE_RESPONSE":
      return <ObjectiveResponse params={params} qid={qid} showAnswers={showAnswers} />;
    case "SORTING_TABLE":
      return <SortingTable rows={params.rows} qid={qid} showAnswers={showAnswers} markingCriteria={markingCriteria} sampleAnswer={sampleAnswer} />;
    case "CODING":
      return <PythonCoding defaultCode={params.defaultCode} showAnswers={showAnswers} markingCriteria={markingCriteria} sampleAnswer={sampleAnswer} />;
    case "PSEUDOCODE":
      return <PseudocodeBlock defaultCode={params.defaultCode} showAnswers={showAnswers} markingCriteria={markingCriteria} sampleAnswer={sampleAnswer} />;
    case "SQL":
      return <SQLBlock defaultSQL={params.defaultCode} datasetSetupQuery={params.datasetSetupQuery} showAnswers={showAnswers} markingCriteria={markingCriteria} sampleAnswer={sampleAnswer} />;
    case "DRAWING_V2":
      return <DrawingEmbed showAnswers={showAnswers} markingCriteria={markingCriteria} sampleAnswer={sampleAnswer} />;
    default:
      return (
        <em className="text-gray-500">(Unsupported answer type: {params.type})</em>
      );
  }
}

function MultiChoice({ qid, params, showAnswers }) {
  const [selectedIndices, setSelectedIndices] = useState([]);
  const isMultiple = params?.settings?.multipleCorrectOptions;
  const inputType = isMultiple ? "checkbox" : "radio";
  const name = `question-${qid}`;

  const correctOptionsIndices = useMemo(() => {
    if (params?.correctOptions) {
      return params.correctOptions.map((id) =>
        params.options.findIndex((o) => o.id === id)
      );
    }
    return params?.correctOptionsIndices || [];
  }, [params]);

  // Handle user's selection
  const handleSelection = (index) => {
    if (isMultiple) {
      // For checkboxes, add or remove the index from the array
      setSelectedIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      // For radio buttons, just set the index
      setSelectedIndices([index]);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {params.options?.map((option, i) => {
        const isCorrect = correctOptionsIndices.includes(i);
        const isSelected = selectedIndices.includes(i);

        // Determine if the "incorrect" style should be applied
        const isIncorrectSelection = showAnswers && isSelected && !isCorrect;

        const labelClasses = `
          flex items-center p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition
          ${showAnswers && isCorrect ? "!border-2 !border-[#a0e6ba] !bg-[#f4fcf7]" : ""}
          ${isIncorrectSelection ? "!border-2 !border-[#f8b4b4] !bg-[#fdecec]" : ""}
        `;

        return (
          <label key={i} className={labelClasses.trim()}>
            <input
              type={inputType}
              name={name}
              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              onChange={() => handleSelection(i)}
              checked={isSelected} // Control the input state
            />
            <span
              className="ml-3 text-gray-700"
              dangerouslySetInnerHTML={{ __html: option.text }}
            />

            {/* Correct Label */}
            {showAnswers && isCorrect && (
              <span className="flex-grow text-right font-bold text-green-800">
                Correct
              </span>
            )}

            {/* Incorrect Label */}
            {isIncorrectSelection && (
              <span className="flex-grow text-right font-bold text-red-800">
                Incorrect
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

function ShortAnswer({ mark, showAnswers, markingCriteria = null, sampleAnswer = null }) {
  return (
    <>
      <textarea
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        rows={1 + 1.5 * mark}
        placeholder="Your answer here..."
      />

      {/* Conditionally render the new MarkingGuide component */}
      {showAnswers && (
        <MarkingGuide
          markingCriteria={markingCriteria}
          sampleAnswer={sampleAnswer}
        />
      )}
    </>
  );
}

function ObjectiveResponse({ params, qid, showAnswers }) {
  // State to track the selected cell index for each row.
  const [selectedCells, setSelectedCells] = useState({});

  const correctCellIds = params?.correctCellIds || [];

  const handleSelection = (rowIndex, cellIndex) => {
    setSelectedCells((prev) => ({
      ...prev,
      [rowIndex]: cellIndex,
    }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {params.header?.map((h, i) => (
              <th
                key={i}
                className="p-2 border border-gray-300 text-center"
                dangerouslySetInnerHTML={{ __html: h.text }}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {params.rows?.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {row.cells?.map((cell, cellIndex) => {
                // First cell is the row header, no special styling needed
                if (cellIndex === 0) {
                  return (
                    <td key={cellIndex} className="p-2 border border-gray-300 font-medium">
                      <span dangerouslySetInnerHTML={{ __html: cell.text }} />
                    </td>
                  );
                }

                const isCorrectCell = correctCellIds.includes(cell.id);
                const isSelectedCell = selectedCells[rowIndex] === cellIndex;
                const isIncorrectSelection = showAnswers && isSelectedCell && !isCorrectCell;

                // Conditionally build the class string for the table cell
                const tdClasses = `
                  p-2 border border-gray-300 text-center transition
                  ${showAnswers && isCorrectCell
                    ? "!border-2 !border-[#a0e6ba] !bg-[#f4fcf7]" // Green "correct" style
                    : ""
                  }
                  ${isIncorrectSelection
                    ? "!border-2 !border-[#f8b4b4] !bg-[#fdecec]" // Red "incorrect" style
                    : ""
                  }
                `;

                return (
                  <td key={cellIndex} className={tdClasses.trim()}>
                    <input
                      type="radio"
                      name={`row-${qid}-${rowIndex}`}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      onChange={() => handleSelection(rowIndex, cellIndex)}
                      checked={isSelectedCell}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortingTable({ rows = [], qid, showAnswers, markingCriteria, sampleAnswer }) {
  const [items, setItems] = useState(() => rows.map((r) => r.cells?.[0]?.text || ""));
  const dragItem = useRef();
  const dragOverItem = useRef();

  const onDragStart = (index) => (dragItem.current = index);
  const onDragEnter = (index) => (dragOverItem.current = index);
  const onDragEnd = () => {
    const listCopy = [...items];
    const draggedItemContent = listCopy[dragItem.current];
    listCopy.splice(dragItem.current, 1);
    listCopy.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setItems(listCopy);
  };

  return (
    <div>
      <ul className="sortable-list border border-gray-300 rounded-md p-2 space-y-2 bg-gray-50">
        {items.map((text, idx) => (
          <li
            key={idx}
            className="p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move sortable-item"
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragEnd={onDragEnd}
          >
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500 mt-2">Drag and drop to reorder the items.</p>
      {showAnswers && (
        <div className="mt-4">
          <MarkingGuide
            markingCriteria={markingCriteria}
            sampleAnswer={sampleAnswer}
          />
        </div>
      )}
    </div>
  );
}

function PythonCoding({ defaultCode, showAnswers, markingCriteria, sampleAnswer }) {
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
          indexURL: "pyodide/",
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
    <div>
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
    {showAnswers && (
        <MarkingGuide
          markingCriteria={markingCriteria}
          sampleAnswer={sampleAnswer}
        />
      )}
    </div>
  );
}

function SQLBlock({ defaultSQL, datasetSetupQuery, showAnswers, markingCriteria, sampleAnswer }) {
  const [sql, setSql] = useState(defaultSQL || "-- Write your SQL query here...\n");
  const [html, setHtml] = useState("");
  const [ready, setReady] = useState(false);
  const dbRef = useRef(null);

  // init sql.js & database once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const SQL = await window.initSqlJs({
          locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
        });
        const db = new SQL.Database();
        if (datasetSetupQuery) {
          try {
            db.run(datasetSetupQuery);
          } catch (e) {
            console.error("Dataset setup failed:", e);
          }
        }
        if (!cancelled) {
          dbRef.current = db;
          setReady(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
      dbRef.current = null;
    };
  }, [datasetSetupQuery]);

  const runSQL = () => {
    if (!dbRef.current) return;
    try {
      const result = dbRef.current.exec(sql);
      if (!result.length) {
        setHtml("(no output)");
        return;
      }
      const r0 = result[0];
      let table = "<table class='border border-gray-300 bg-white'><thead><tr>";
      r0.columns.forEach((c) => {
        table += `<th class=\"border border-gray-300 px-2 py-1 bg-gray-100\">${c}</th>`;
      });
      table += "</tr></thead><tbody>";
      r0.values.forEach((row) => {
        table += "<tr>";
        row.forEach((val) => {
          table += `<td class=\"border border-gray-300 px-2 py-1\">${val}</td>`;
        });
        table += "</tr>";
      });
      table += "</tbody></table>";
      setHtml(table);
    } catch (e) {
      setHtml("❌ Error: " + e);
    }
  };

  return (
    <div>
    <div className="space-y-3">
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        className="w-full p-4 border-gray-600 rounded-md bg-gray-900 text-white font-mono text-sm"
        rows={10}
      />
      <button
        onClick={runSQL}
        disabled={!ready}
        className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 disabled:opacity-60"
      >
        {ready ? "Run SQL" : "Loading SQL engine…"}
      </button>
      <div className="overflow-x-auto w-full p-4 bg-gray-100 rounded-md text-sm text-gray-800">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
    {showAnswers && (
        <MarkingGuide
          markingCriteria={markingCriteria}
          sampleAnswer={sampleAnswer}
        />
      )}
    </div>
  );
}

function DrawingEmbed({ showAnswers, markingCriteria, sampleAnswer }) {
  return (
    <div>
      <div className="mt-4" style={{ height: "600px", width: "100%" }}>
        <Excalidraw>
          <MainMenu></MainMenu>
        </Excalidraw>
      </div>
      {showAnswers && (
        <MarkingGuide
          markingCriteria={markingCriteria}
          sampleAnswer={sampleAnswer}
        />
      )}
    </div>
  );
}

function PseudocodeBlock({ defaultCode, showAnswers, markingCriteria, sampleAnswer }) {
  return (
    <div>
      <Editor
        height="300px"
        defaultLanguage="plaintext"
        defaultValue={defaultCode || "// Write your pseudocode here..."}
        theme="vs-dark"
      options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
      />
      {showAnswers && (
        <MarkingGuide
          markingCriteria={markingCriteria}
          sampleAnswer={sampleAnswer}
        />
      )}
    </div>
  );
}


function MarkingGuide({ markingCriteria = null, sampleAnswer = null }) {
  // If there's no data to show, render nothing.
  const hasMarkingCriteria = markingCriteria && markingCriteria.length > 0;
  const hasSampleAnswer = sampleAnswer?.text;

  if (!hasMarkingCriteria && !hasSampleAnswer) {

    // return null; return placeholder instead
    return (<div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
      <p className="text-gray-600">No marking criteria or sample answer available.</p>
    </div>);
  }

  return (
    <div className="marking-guide mt-4 p-4 bg-red-50 border border-red-400 rounded-lg space-y-6">
      <h3 className="text-xl font-semibold text-red-800 mb-2">
        Marking Guide
      </h3>

      {/* Marking Criteria Table */}
      {hasMarkingCriteria && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Marking Criteria</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 bg-white text-base">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 border border-gray-300 text-left font-medium text-gray-700">Criterion</th>
                  <th className="p-3 border border-gray-300 text-center font-medium text-gray-700 w-28">Marks</th>
                </tr>
              </thead>
              <tbody>
                {markingCriteria.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td
                      className="p-3 border border-gray-300 align-top prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: item.criterion }}
                    />
                    <td
                      className="p-3 border border-gray-300 align-middle text-center"
                      dangerouslySetInnerHTML={{ __html: item.point }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample Answer */}
      {hasSampleAnswer && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Sample Answer</h4>
          <div
            className="prose max-w-none p-4 bg-white border border-gray-200 rounded-md"
            dangerouslySetInnerHTML={{ __html: sampleAnswer.text }}
          />
        </div>
      )}
    </div>
  );
}
