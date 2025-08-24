import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PythonCoding from './PythonCoding';
import { Editor } from "@monaco-editor/react";

// Map exam IDs to JSON files
const examFiles = {
  cssa_familiarisation: "data/cssa_familiarisation.json",
  nsb: "data/nsb.json",
  cssa_trial: "data/cssa_trial.json",
  girraween: "data/girraween.json",
  hsc_familiarisation: "data/hsc_familiarisation.json",
  hsc_sample_exam: "data/hsc_sample_exam.json",
};

export default function App() {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
              View Answers
            </a>
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
          <ExamView exam={exam} questions={questions} />
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
    { id: "nsb", title: "NSB Exam", desc: "NSB Software Engineering exam." },
    {
      id: "cssa_trial",
      title: "CSSA Trial Exam",
      desc: "CSSA Trial Software Engineering exam.",
    },
    {
      id: "girraween",
      title: "Girraween Exam",
      desc: "Girraween High School Software Engineering exam.",
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

function ExamView({ exam, questions }) {
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
          <QuestionCard key={q.id || idx} data={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ data }) {
  if (!data?.parts?.length) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {data.parts.map((part, i) => (
        <QuestionPart key={i} qid={data.id} part={part} stimulus={data.stimulusContentItemCollection} />
      ))}
    </div>
  );
}

function QuestionPart({ qid, part, stimulus }) {
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
        <AnswerRenderer qid={qid} params={part?.answer?.parameters} marks={mark} />
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


function AnswerRenderer({ qid, params, marks }) {
  if (!params) return null;
  switch (params.type) {
    case "MULTI_CHOICE":
      return <MultiChoice qid={qid} params={params} />;
    case "SHORT":
      return <ShortAnswer mark={marks} />;
    case "OBJECTIVE_RESPONSE":
      return <ObjectiveResponse params={params} qid={qid} />;
    case "SORTING_TABLE":
      return <SortingTable rows={params.rows} qid={qid} />;
    case "CODING":
      return <PythonCoding defaultCode={params.defaultCode} />;
    case "PSEUDOCODE":
      return <PseudocodeBlock defaultCode={params.defaultCode} />;
    case "SQL":
      return <SQLBlock defaultSQL={params.defaultCode} datasetSetupQuery={params.datasetSetupQuery} />;
    case "DRAWING_V2":
      return <DrawingEmbed />;
    default:
      return (
        <em className="text-gray-500">(Unsupported answer type: {params.type})</em>
      );
  }
}

function MultiChoice({ qid, params }) {
  const isMultiple = params?.settings?.multipleCorrectOptions;
  const inputType = isMultiple ? "checkbox" : "radio";
  const name = `question-${qid}`;

  return (
    <div className="mt-4 space-y-3">
      {params.options?.map((option, i) => (
        <label
          key={i}
          className="flex items-center p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition"
        >
          <input
            type={inputType}
            name={name}
            className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <span className="ml-3 text-gray-700" dangerouslySetInnerHTML={{ __html: option.text }} />
        </label>
      ))}
    </div>
  );
}

function ShortAnswer({ mark }) {
  // min 3 rows + 1 for each mark
  return (
    <textarea
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      rows={1 + 1.5*mark}
      placeholder="Your answer here..."
    />
  );
}

function ObjectiveResponse({ params, qid }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {params.header?.map((h, i) => (
              <th key={i} className="p-2 border border-gray-300 text-center" dangerouslySetInnerHTML={{ __html: h.text }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {params.rows?.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.cells?.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`p-2 border border-gray-300 ${cellIndex === 0 ? "font-medium" : "text-center"}`}
                >
                  {cellIndex === 0 ? (
                    <span dangerouslySetInnerHTML={{ __html: cell.text }} />
                  ) : (
                    <input
                      type="radio"
                      name={`row-${qid}-${rowIndex}`}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortingTable({ rows = [], qid }) {
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
    </div>
  );
}

// function PythonCoding({ defaultCode }) {
//   const [code, setCode] = useState(defaultCode || "# Write your Python code here...\n");
//   const [output, setOutput] = useState("");
//   const [running, setRunning] = useState(false);

//   const runCode = async () => {
//     try {
//       setRunning(true);
//       setOutput("⏳ Running...");
//       // pyodideReady is created in index.html (global)
//       const pyodide = await window.pyodideReady;
//       await pyodide.runPythonAsync(`
// import sys, builtins
// class OutputCatcher:
//     def __init__(self): self.data = ""
//     def write(self, s): self.data += s
//     def flush(self): pass
// catcher = OutputCatcher()
// sys.stdout = catcher
// sys.stderr = catcher

// def custom_input(prompt_text=""):
//     from js import prompt
//     return prompt(str(prompt_text)) or ""

// builtins.input = custom_input
// `);
//       await pyodide.runPythonAsync(code);
//       const result = pyodide.runPython("catcher.data");
//       setOutput(result || "(no output)");
//     } catch (e) {
//       setOutput("❌ Error: " + e);
//     } finally {
//       setRunning(false);
//     }
//   };

//   return (
//     <div className="space-y-3">
//       <textarea
//         value={code}
//         onChange={(e) => setCode(e.target.value)}
//         className="w-full p-4 border-gray-600 rounded-md bg-gray-900 text-white font-mono text-sm"
//         rows={10}
//       />
//       <button
//         onClick={runCode}
//         disabled={running}
//         className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 disabled:opacity-60"
//       >
//         {running ? "Running..." : "Run Code"}
//       </button>
//       <pre className="w-full p-4 bg-gray-100 rounded-md text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
//         {output}
//       </pre>
//     </div>
//   );
// }

function SQLBlock({ defaultSQL, datasetSetupQuery }) {
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
  );
}

function DrawingEmbed() {
  return (
    <div className="mt-4" style={{ height: "600px", width: "100%" }}>
      <Excalidraw>
        <MainMenu></MainMenu>
      </Excalidraw>
    </div>

  );
}

function PseudocodeBlock({ defaultCode }) {
  return (
    <Editor
      height="300px"
      defaultLanguage="plaintext"
      defaultValue={defaultCode || "// Write your pseudocode here..."}
      theme="vs-dark"
      options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
    />
  );
}
