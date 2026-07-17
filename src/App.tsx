import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  Code2,
  Download,
  FileCode2,
  FolderClock,
  Hammer,
  Mic,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { downloadProject, getClientId, projectPreview, readSourceFiles } from "./lib";
import type { Project, ProjectSummary, SourceFile } from "./types";

type ForgeSpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type ForgeSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: () => void;
  onresult: (event: ForgeSpeechRecognitionEvent) => void;
  start: () => void;
};

const starters = [
  "A neighborhood tool library with inventory and reservations",
  "A field notes app for tracking plants and wildlife",
  "A bold portfolio for an independent furniture maker",
];

const languageLabel = (path: string) => path.split(".").pop()?.toUpperCase() || "TXT";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [history, setHistory] = useState<ProjectSummary[]>([]);
  const [selectedPath, setSelectedPath] = useState("index.html");
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [isBuilding, setIsBuilding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const clientId = useMemo(getClientId, []);

  const selectedFile = project?.files.find((file) => file.path === selectedPath) || project?.files[0];
  const preview = useMemo(() => (project ? projectPreview(project.files) : ""), [project]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/projects?clientId=${encodeURIComponent(clientId)}`);
      if (response.ok) setHistory(await response.json());
    } catch {
      // History is non-blocking; generation remains available.
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const addFiles = async (files: FileList | File[]) => {
    setError("");
    try {
      const incoming = await readSourceFiles(files);
      setSourceFiles((current) => [...current, ...incoming].slice(0, 12));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Those files could not be read.");
    }
  };

  const build = async () => {
    if (!prompt.trim() && sourceFiles.length === 0) {
      setError("Describe what to build or attach blueprint files first.");
      return;
    }

    setError("");
    setIsBuilding(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, prompt, files: sourceFiles }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The build failed.");
      setProject(payload);
      setSelectedPath("index.html");
      setActiveView("preview");
      await loadHistory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The build failed.");
    } finally {
      setIsBuilding(false);
    }
  };

  const openHistoryProject = async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/projects?clientId=${encodeURIComponent(clientId)}&id=${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Project not found.");
      setProject(payload);
      setSelectedPath("index.html");
      setHistoryOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That project could not be opened.");
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setError("Voice input stopped. Try again or type your blueprint.");
    recognition.onresult = (event) => {
      const words = event.results[0][0].transcript;
      setPrompt((current) => `${current}${current ? " " : ""}${words}`);
    };
    recognition.start();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setProject(null)} aria-label="Forge home">
          <span className="brand-mark"><Hammer size={18} strokeWidth={2.4} /></span>
          <span>FORGE</span>
          <small>OPEN BUILDER</small>
        </button>
        <div className="topbar-right">
          <span className="status"><i /> SYSTEM READY</span>
          <button className="history-button" onClick={() => setHistoryOpen(true)}>
            <FolderClock size={16} /> BUILDS <span>{history.length}</span>
          </button>
          <a className="source-link" href="/LICENSE.txt" target="_blank" rel="noreferrer">
            MIT LICENSE <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <main className={project ? "workspace has-project" : "workspace"}>
        <section className="brief-panel">
          <div className="section-kicker"><span>01</span> THE BLUEPRINT</div>
          <div className="intro">
            <p className="eyebrow">FROM IDEA TO WORKING FILES</p>
            <h1>What are we<br /><em>building?</em></h1>
            <p>Describe it, paste it, say it, or drop in the files you already have. Forge turns your blueprint into a working project.</p>
          </div>

          <div
            className={`brief-box ${isDragging ? "dragging" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); void addFiles(event.dataTransfer.files); }}
          >
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Build me a community repair hub where people can list broken items, book a repair volunteer, and track each fix..."
              aria-label="Project blueprint"
            />
            <div className="brief-tools">
              <div>
                <button onClick={() => fileInput.current?.click()} aria-label="Attach files"><Paperclip size={17} /> ATTACH</button>
                <button className={isListening ? "listening" : ""} onClick={startVoice} aria-label="Use voice input"><Mic size={17} /> {isListening ? "LISTENING" : "SPEAK"}</button>
              </div>
              <span>{prompt.length.toLocaleString()} CHARS</span>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".html,.css,.js,.jsx,.ts,.tsx,.json,.md,.txt,.py,.toml,.yaml,.yml,.xml,.svg"
              onChange={(event) => event.target.files && void addFiles(event.target.files)}
            />
          </div>

          {sourceFiles.length > 0 && (
            <div className="attachments">
              <div className="attachments-title"><span>ATTACHED MATERIAL</span><span>{sourceFiles.length}/12</span></div>
              {sourceFiles.map((file, index) => (
                <div className="attachment" key={`${file.name}-${index}`}>
                  <FileCode2 size={16} />
                  <span>{file.name}</span>
                  <small>{Math.max(1, Math.round(file.content.length / 1024))} KB</small>
                  <button onClick={() => setSourceFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><X size={15} /></button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message"><Square size={10} fill="currentColor" /> {error}</div>}

          <button className="build-button" onClick={build} disabled={isBuilding}>
            {isBuilding ? <><RefreshCw className="spin" size={19} /> FORGING YOUR PROJECT</> : <><Zap size={19} fill="currentColor" /> BUILD IT <ChevronRight size={19} /></>}
          </button>

          {!project && (
            <div className="starters">
              <span>OR START WITH A SPARK</span>
              {starters.map((starter) => (
                <button key={starter} onClick={() => setPrompt(starter)}><Plus size={14} /> {starter}</button>
              ))}
            </div>
          )}
        </section>

        <section className="output-panel">
          <div className="section-kicker"><span>02</span> THE BUILD</div>
          {isBuilding ? (
            <div className="building-state">
              <div className="anvil"><Hammer size={45} /><span /><span /><span /></div>
              <p className="eyebrow">ASSEMBLING THE PARTS</p>
              <h2>Blueprint on the bench.</h2>
              <p>Planning the structure, writing the files, and checking the details.</p>
              <div className="build-steps"><span className="done"><Check size={13} /> Reading blueprint</span><span className="active"><i /> Building interface</span><span><i /> Packaging files</span></div>
            </div>
          ) : project ? (
            <div className="project-view">
              <div className="project-header">
                <div><p className="eyebrow">BUILD COMPLETE</p><h2>{project.name}</h2><p>{project.summary}</p></div>
                <button className="download-button" onClick={() => void downloadProject(project)}><Download size={17} /> DOWNLOAD ZIP</button>
              </div>
              <div className="build-toolbar">
                <div className="view-tabs">
                  <button className={activeView === "preview" ? "active" : ""} onClick={() => setActiveView("preview")}><Play size={14} /> PREVIEW</button>
                  <button className={activeView === "code" ? "active" : ""} onClick={() => setActiveView("code")}><Code2 size={14} /> CODE</button>
                </div>
                <span><i /> LIVE OUTPUT</span>
              </div>
              {activeView === "preview" ? (
                <div className="preview-frame">
                  <div className="browser-bar"><span /><span /><span /><div>forge-preview.local</div></div>
                  <iframe title={`${project.name} preview`} srcDoc={preview} sandbox="allow-scripts allow-forms allow-modals" />
                </div>
              ) : (
                <div className="code-workspace">
                  <nav className="file-list">
                    <p>PROJECT FILES</p>
                    {project.files.map((file) => (
                      <button className={selectedFile?.path === file.path ? "active" : ""} key={file.path} onClick={() => setSelectedPath(file.path)}>
                        <FileCode2 size={15} /><span>{file.path}</span><small>{languageLabel(file.path)}</small>
                      </button>
                    ))}
                  </nav>
                  <div className="code-pane">
                    <div className="code-title"><span>{selectedFile?.path}</span><small>{selectedFile?.content.split("\n").length} LINES</small></div>
                    <pre><code>{selectedFile?.content}</code></pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-build">
              <div className="blueprint-grid">
                <div className="blueprint-object"><Box size={66} strokeWidth={1} /><span className="measure measure-x">BUILD AREA</span><span className="measure measure-y">READY</span></div>
              </div>
              <p className="eyebrow">YOUR OUTPUT APPEARS HERE</p>
              <h2>Empty bench.<br />Plenty of potential.</h2>
              <p>Give Forge a blueprint and the working preview, source files, and download package appear right here.</p>
              <div className="output-specs"><span><Check size={14} /> WORKING PREVIEW</span><span><Check size={14} /> EDITABLE CODE</span><span><Check size={14} /> ZIP DOWNLOAD</span></div>
            </div>
          )}
        </section>
      </main>

      <footer><span>FORGE / FREE &amp; OPEN SOURCE</span><span>YOUR IDEAS. YOUR CODE. YOURS TO KEEP.</span></footer>

      {historyOpen && (
        <div className="drawer-backdrop" onClick={() => setHistoryOpen(false)}>
          <aside className="history-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header"><div><p className="eyebrow">YOUR WORKBENCH</p><h2>Recent builds</h2></div><button onClick={() => setHistoryOpen(false)} aria-label="Close history"><X /></button></div>
            {history.length ? history.map((item) => (
              <button className="history-card" key={item.id} onClick={() => void openHistoryProject(item.id)}>
                <span className="history-icon"><Hammer size={17} /></span>
                <span><strong>{item.name}</strong><small>{item.summary}</small><time>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time></span>
                <ChevronRight size={17} />
              </button>
            )) : <div className="history-empty"><FolderClock size={38} /><p>No builds yet.</p><span>Your completed projects stay within reach.</span></div>}
          </aside>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ForgeSpeechRecognition;
    webkitSpeechRecognition?: new () => ForgeSpeechRecognition;
  }
}
