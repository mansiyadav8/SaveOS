import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import UploadSave from "../UploadSave";
import PatternFinder from "./PatternFinder";
import ActionAgent from "./ActionAgent";

const navigation = [
  { id: "intent", label: "Intent Dashboard", icon: "✧" },
  { id: "memory", label: "Memory Board", icon: "▦" },
  { id: "patterns", label: "Pattern Finder", icon: "⌁" },
  { id: "pipeline", label: "Action Pipeline", icon: "☷" },
];

const baseCollections = [
  { label: "AI Tools", icon: "✺" },
  { label: "Travel & Nomading", icon: "⌖" },
  { label: "Business & Startups", icon: "⌁" },
  { label: "Outfits & Wardrobe", icon: "♧" },
  { label: "Things to Learn", icon: "◇" },
];

const getSaveTitle = (save) => save.goldenNugget || save.fileName || "Saved insight";
const getSaveCategory = (save) => save.category || "Uncategorized";
const getSaveDescription = (save) =>
  save.extractedData?.items?.slice(0, 2).join(" · ") ||
  save.actionItems?.[0] ||
  save.fileName ||
  "Open this memory to explore the details.";

const getSaveDate = (save) => {
  const date = save.createdAt?.toDate?.();
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently saved";
};

function SaveCard({ save, onAddTask, activePlanId, onTogglePlan }) {
  return (
    <article className="board-card">
      <div className="board-card-top">
        <span>{save.fileName || "Saved reel"}</span>
      </div>
      <div className="board-card-content">
        <div className="memory-footer">
          <span className="category-chip">{getSaveCategory(save)}</span>
          <span className="memory-date">{getSaveDate(save)}</span>
        </div>
        <h2>{getSaveTitle(save)}</h2>
        <p>{getSaveDescription(save)}</p>
        {save.extractedData?.items?.length > 0 && (
          <div className="memory-footer">
            {save.extractedData.items.slice(0, 2).map((item) => (
              <span className="tiny-chip" key={item}>{item}</span>
            ))}
          </div>
        )}
        <div className="memory-footer">
          <button className="green-button" onClick={() => onAddTask(save)}>
            ✓ Turn into task
          </button>
          <button className="icon-button" aria-label="Generate an action plan" onClick={() => onTogglePlan(save.id)}>
            ↗
          </button>
        </div>
        {activePlanId === save.id && <ActionAgent saveData={save} />}
      </div>
    </article>
  );
}

function StatCard({ title, value, note, description, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value-row">
        <span className="stat-value">{value}</span>
        {note && <span className="stat-note">{note}</span>}
      </div>
      <p className="stat-description">{description}</p>
    </article>
  );
}

export default function Dashboard({ user, onSignOut }) {
  const [saves, setSaves] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeView, setActiveView] = useState("intent");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Saves");
  const [layout, setLayout] = useState("Cards");
  const [showIngest, setShowIngest] = useState(false);
  const [activePlanId, setActivePlanId] = useState(null);
  const [pipelineTasks, setPipelineTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "saves"),
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setSaves(fetched);
        setLoadError("");
      },
      (error) => {
        console.error("Could not load SaveOS memories:", error);
        setLoadError("Your memories could not be loaded. Check your connection and try again.");
      },
    );
    return unsubscribe;
  }, []);

  const categories = useMemo(
    () => [...new Set(saves.map(getSaveCategory))].filter((category) => category !== "Uncategorized"),
    [saves],
  );
  const filteredSaves = useMemo(() => {
    const term = search.trim().toLowerCase();
    return saves.filter((save) => {
      const matchesCategory = categoryFilter === "All Saves" || getSaveCategory(save) === categoryFilter;
      const searchText = [
        getSaveTitle(save),
        save.fileName,
        getSaveCategory(save),
        ...(save.extractedData?.items || []),
      ].join(" ").toLowerCase();
      return matchesCategory && (!term || searchText.includes(term));
    });
  }, [categoryFilter, saves, search]);

  const taskCount = pipelineTasks.length;
  const doneCount = completedTasks.length;
  const completionRate = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";
  const initials = displayName.split(/[ ._-]/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  const navigateTo = (view) => {
    setActiveView(view);
    if (view !== "memory") setCategoryFilter("All Saves");
  };

  const addSaveTasks = (save) => {
    const items = save.actionItems?.length ? save.actionItems : [getSaveTitle(save)];
    const newTasks = items.map((title, index) => ({
      id: `${save.id}-${index}`,
      title,
      source: getSaveTitle(save),
      category: getSaveCategory(save),
    }));
    setPipelineTasks((current) => {
      const existing = new Set(current.map((task) => task.id));
      return [...current, ...newTasks.filter((task) => !existing.has(task.id))];
    });
    setActiveView("pipeline");
  };

  const toggleTask = (taskId) => {
    setCompletedTasks((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  };

  const startSearch = (event) => {
    if (event.key === "Enter") {
      setActiveView("memory");
      setCategoryFilter("All Saves");
    }
  };

  const selectCollection = (category) => {
    setCategoryFilter(category);
    setActiveView("memory");
  };

  const renderSaveGrid = (items, viewMode = "Cards") => {
    if (!items.length) {
      return (
        <div className="empty-state">
          <strong>{saves.length ? "No memories match this view" : "Your memory is ready to grow"}</strong>
          {saves.length
            ? "Try another search or collection."
            : "Ingest your first reel to turn saved ideas into searchable knowledge."}
        </div>
      );
    }
    return (
      <div className={`memory-grid ${viewMode.toLowerCase()}${viewMode === "Table" || viewMode === "compact" ? " compact-list" : ""}`}>
        {items.map((save) => (
          <SaveCard
            key={save.id}
            save={save}
            onAddTask={addSaveTasks}
            activePlanId={activePlanId}
            onTogglePlan={(id) => setActivePlanId((current) => current === id ? null : id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">▣</span>
          <span>
            <span className="brand-name">SaveOS</span>
            <span className="brand-caption">Autonomous Memory</span>
          </span>
        </div>

        <p className="nav-heading">Core views</p>
        <nav className="nav-list" aria-label="Core views">
          {navigation.map((item) => (
            <button
              className={`nav-link${activeView === item.id ? " active" : ""}`}
              key={item.id}
              onClick={() => navigateTo(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="collections-heading">
          <p className="nav-heading">Smart collections</p>
          <button className="icon-button" aria-label="View all memories" onClick={() => navigateTo("memory")}>＋</button>
        </div>
        <div className="nav-list">
          {baseCollections.map((item) => {
            const count = saves.filter((save) => getSaveCategory(save).toLowerCase().includes(item.label.split(" ")[0].toLowerCase())).length;
            return (
              <button
                className={`nav-link collection-link${categoryFilter === item.label && activeView === "memory" ? " active" : ""}`}
                key={item.label}
                onClick={() => selectCollection(item.label)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span className="collection-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-status">
          <div className="status-title"><span className="status-dot" />SaveOS memory active</div>
          <div className="status-copy">{saves.length} {saves.length === 1 ? "save" : "saves"} indexed</div>
          <div className="status-meter"><span /></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <label className="top-search">
            <span>⌕</span>
            <input
              aria-label="Search memories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={startSearch}
              placeholder={`Search across ${saves.length} saved reels, topics, or action steps...`}
            />
            <span className="shortcut">⌘ K</span>
          </label>
          <button className="primary-button" onClick={() => { navigateTo("memory"); setShowIngest(true); }}>ϟ&nbsp; Sync / Ingest Reel</button>
          <button className="icon-button" aria-label="Notifications">♧</button>
          <div className="profile-button">
            <span className="avatar">{initials || "S"}</span>
            <span>
              <span className="profile-name">{displayName}</span>
              <span className="profile-email">{user?.email || "SaveOS account"}</span>
            </span>
          </div>
          <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={onSignOut}>↪</button>
        </header>

        <main className="page-content">
          {loadError && <div className="notice" role="alert">{loadError}</div>}

          {activeView === "intent" && (
            <>
              <div className="announcement">
                <strong>● SaveOS intelligence</strong>
                <span>{saves.length ? `${saves.length} memories are indexed and ready to explore.` : "Your memory workspace is ready for its first reel."}</span>
                <span className="announcement-spacer" />
                <button className="announcement-link" onClick={() => navigateTo("patterns")}>Explore insights&nbsp; →</button>
              </div>

              <section className="hero-panel">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-pill">✧ Gemini synthesis engine</span>
                    <span className="eyebrow-pill green">✓ Memory in sync</span>
                  </div>
                  <h1>Welcome back, {displayName}.</h1>
                  <p className="hero-description">
                    SaveOS brings your saved reels together, finds the ideas that matter, and turns them into practical next steps.
                  </p>
                </div>
                <div className="hero-actions">
                  <button className="secondary-button" onClick={() => navigateTo("memory")}>⌁&nbsp; Browse memories</button>
                  <button className="primary-button" onClick={() => navigateTo("patterns")}>✧&nbsp; Find patterns</button>
                </div>
              </section>

              <section className="stats-grid" aria-label="Memory overview">
                <StatCard title="Action pipeline" value={taskCount} note={doneCount ? `${doneCount} completed` : "Ready"} description="Actionable steps created from your saved reels" icon="✓" />
                <StatCard title="Emerging themes" value={categories.length} note="Collections" description="Topics represented across your saved memories" icon="⌘" />
                <StatCard title="Smart collections" value={categories.length || baseCollections.length} note="Explore" description="Organize your ideas into useful knowledge hubs" icon="▣" />
                <StatCard title="Execution velocity" value={`${completionRate}%`} note={taskCount ? "Tasks done" : "Start anytime"} description="Your progress turning saved ideas into action" icon="⌁" />
              </section>

              <div className="dashboard-columns">
                <div className="column-stack">
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <div className="panel-title">⇧&nbsp; Ingest a new reel</div>
                        <div className="panel-subtitle">Extract searchable insights from your video</div>
                      </div>
                      <span className="tiny-chip">AI analysis</span>
                    </div>
                    <UploadSave />
                  </section>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <div className="panel-title">◷&nbsp; Recent memories</div>
                        <div className="panel-subtitle">Your latest saved ideas</div>
                      </div>
                      <button className="panel-link" onClick={() => navigateTo("memory")}>View all →</button>
                    </div>
                    {renderSaveGrid(saves.slice(0, 2), "compact")}
                  </section>
                </div>

                <div className="column-stack">
                  <section className="intent-panel">
                    <div className="intent-head">
                      <div>
                        <div className="panel-title">✧&nbsp; Intent Board</div>
                        <div className="panel-subtitle">Autonomous reasoning across your memory</div>
                      </div>
                      <span className="intent-live">Realtime synthesis</span>
                    </div>
                    <div className="intent-step">
                      <span className="intent-step-icon">⌘</span>
                      <div>
                        <strong>Connect the dots across {saves.length} saves</strong>
                        <p>Find the goals and themes hiding in your saved ideas.</p>
                      </div>
                      <button className="intent-cta" onClick={() => navigateTo("patterns")}>✧ Find patterns</button>
                    </div>
                    <div className="theme-quote">
                      <span className="theme-label">◎&nbsp; Overall theme</span>
                      {saves.length
                        ? `Your collection is taking shape around ${categories.slice(0, 3).join(", ") || "the ideas you save"}. Run Pattern Finder to discover deeper connections.`
                        : "Your saved ideas will come together here. Add a few reels, then let SaveOS find the bigger picture."}
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <div className="panel-title">⌁&nbsp; Turn insight into action</div>
                        <div className="panel-subtitle">Build a focused pipeline from your memories</div>
                      </div>
                      <button className="panel-link" onClick={() => navigateTo("pipeline")}>Open pipeline →</button>
                    </div>
                    <div className="empty-state">
                      <strong>{taskCount ? `${taskCount} action steps in your pipeline` : "Your next step starts with a save"}</strong>
                      {taskCount ? "Continue your work in the Action Pipeline." : "Add a save to your pipeline from the Memory Board."}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {activeView === "memory" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-pill">Dynamic visual vault</span><span>•</span> Autonomously tagged</div>
                  <h1>Memory Board <span className="tiny-chip">{saves.length} saved</span></h1>
                  <p>Your saved reels become searchable, organized memories. Browse by category or search the ideas inside them.</p>
                </div>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => setShowIngest((current) => !current)}>＋ Ingest reel</button>
                  <button className="secondary-button" onClick={() => setActivePlanId("all")}>↻ Re-index transcripts</button>
                  <button className="green-button" onClick={() => navigateTo("patterns")}>✧ Agentic pattern scan</button>
                </div>
              </div>
              {showIngest && (
                <section className="panel ingest-panel">
                  <div className="panel-heading">
                    <div><div className="panel-title">⇧&nbsp; Ingest a new reel</div><div className="panel-subtitle">Analyze a video, then add its insights to your memory</div></div>
                    <button className="icon-button" aria-label="Close reel ingest" onClick={() => setShowIngest(false)}>×</button>
                  </div>
                  <UploadSave onSaved={() => setShowIngest(false)} />
                </section>
              )}
              <section className="board-toolbar">
                <div className="board-search-row">
                  <label className="board-search"><span>⌕</span><input aria-label="Filter memories" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Semantic search by concept, caption, transcript, or topic..." /></label>
                  <div className="view-tabs" aria-label="Memory layout">
                    {["Cards", "Reels", "Table", "Kanban"].map((tab) => (
                      <button key={tab} className={`view-tab${layout === tab ? " selected" : ""}`} onClick={() => setLayout(tab)}>{tab}</button>
                    ))}
                  </div>
                </div>
                <div className="filter-row">
                  {["All Saves", ...categories].map((category) => (
                    <button key={category} className={`filter-chip${categoryFilter === category ? " selected" : ""}`} onClick={() => setCategoryFilter(category)}>
                      {category}{category === "All Saves" ? `  ${saves.length}` : `  ${saves.filter((save) => getSaveCategory(save) === category).length}`}
                    </button>
                  ))}
                </div>
              </section>
              {activePlanId === "all" && (
                <div className="notice">
                  Existing memories are already indexed for search. New reels are indexed automatically when saved.
                  <button className="panel-link" onClick={() => setActivePlanId(null)}>&nbsp; Dismiss</button>
                </div>
              )}
              {renderSaveGrid(filteredSaves, layout)}
            </>
          )}

          {activeView === "patterns" && (
            <>
              <section className="page-hero page-hero-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-pill">✧ Agentic cross-save engine</span><span className="eyebrow-pill green">● {saves.length} saves indexed</span></div>
                  <h1>AI Pattern Finder · Cross-Save Synthesis</h1>
                  <p className="hero-description">Find the connections between your saved reels, topics, and goals. SaveOS uses your memories to surface patterns you might not notice on your own.</p>
                </div>
                <div className="pattern-count"><span>Patterns found</span><strong>{categories.length}</strong><small>{categories.length ? "Topics" : "Ready to explore"}</small></div>
              </section>

              <section className="synthesis-panel">
                <div className="synthesis-toolbar">
                  <div>
                    <h2>⌘&nbsp; Synthesis node matrix</h2>
                    <p>Autonomous associative clustering across your saved memories</p>
                  </div>
                  <span className="tiny-chip">✧ Gemini synthesis</span>
                </div>
                <div className="synthesis-map">
                  <div className="synthesis-side">
                    <div className="synthesis-node">
                      <strong>{categories[0] || "Your saved interests"}</strong>
                      <p>{saves[0] ? getSaveTitle(saves[0]) : "Add memories to begin connecting your ideas."}</p>
                    </div>
                    {categories[1] && <div className="synthesis-node"><strong>{categories[1]}</strong><p>Another thread in your growing collection.</p></div>}
                  </div>
                  <div className="synthesis-center">
                    <strong>Personal knowledge<br />in motion</strong>
                    <p>Save more ideas and explore the connections between them.</p>
                    <span className="confidence">{saves.length} memories connected</span>
                  </div>
                  <div className="synthesis-side">
                    <div className="synthesis-node">
                      <strong>{categories[2] || "Emerging themes"}</strong>
                      <p>{saves[1] ? getSaveTitle(saves[1]) : "Patterns appear as your memory grows."}</p>
                    </div>
                    {categories[3] && <div className="synthesis-node"><strong>{categories[3]}</strong><p>A related theme from your saved reels.</p></div>}
                  </div>
                </div>
              </section>
              <div className="dashboard-columns" style={{ marginTop: 16 }}>
                <section className="panel">
                  <div className="panel-heading">
                    <div><div className="panel-title">✧ Find connections</div><div className="panel-subtitle">Let Gemini reason across your saved memories</div></div>
                  </div>
                  <div className="component-card"><PatternFinder /></div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div><div className="panel-title">↗ Action pipeline</div><div className="panel-subtitle">Make your discoveries actionable</div></div>
                    <button className="panel-link" onClick={() => navigateTo("pipeline")}>Open →</button>
                  </div>
                  {renderSaveGrid(saves.slice(0, 1))}
                </section>
              </div>
            </>
          )}

          {activeView === "pipeline" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-pill">✓ Autonomous execution engine</span><span className="eyebrow-pill green">{completionRate}% complete</span></div>
                  <h1>Master Action Plan Pipeline</h1>
                  <p>Stop collecting content. Start using it. Turn saved insights into clear, actionable next steps.</p>
                </div>
                <div className="hero-actions">
                  <button className="green-button" onClick={() => navigateTo("memory")}>＋ Add tasks from memories</button>
                  <button className="secondary-button" onClick={() => { setPipelineTasks([]); setCompletedTasks([]); }}>Clear pipeline</button>
                </div>
              </div>
              <section className="action-summary">
                <div className="action-stat"><span className="action-stat-icon">▣</span><div><strong>{taskCount} Tasks</strong><span>Added from your memories</span></div></div>
                <div className="action-stat"><span className="action-stat-icon" style={{ color: "#078d68", background: "#dcfaef" }}>✓</span><div><strong>{doneCount} Completed</strong><span>Keep your momentum</span></div></div>
                <div className="action-stat"><span className="action-stat-icon" style={{ color: "#d74d97", background: "#ffebf5" }}>◉</span><div><strong>{taskCount - doneCount} In flight</strong><span>Ready for your next session</span></div></div>
                <div className="action-stat"><span className="action-stat-icon">◷</span><div><strong>{completionRate}%</strong><span>Execution progress</span></div></div>
              </section>
              <div className="stream-row">
                <span className="stream-label">Stream:</span>
                <span className="filter-chip selected">All projects ({taskCount})</span>
                {categories.slice(0, 4).map((category) => <span key={category} className="filter-chip">{category}</span>)}
              </div>
              <section className="pipeline-columns">
                {[
                  { title: "To Execute", tasks: pipelineTasks.filter((task) => !completedTasks.includes(task.id)) },
                  { title: "In Progress", tasks: [] },
                  { title: "Completed & Used", tasks: pipelineTasks.filter((task) => completedTasks.includes(task.id)) },
                ].map((column) => (
                  <div className="pipeline-column" key={column.title}>
                    <div className="pipeline-column-heading"><span className="pipeline-dot" />{column.title}<span className="collection-count">{column.tasks.length}</span></div>
                    {column.tasks.map((task) => (
                      <article className={`pipeline-card${completedTasks.includes(task.id) ? " completed" : ""}`} key={task.id}>
                        <label className="pipeline-card-title">
                          <input type="checkbox" checked={completedTasks.includes(task.id)} onChange={() => toggleTask(task.id)} />
                          <span>{task.title}</span>
                        </label>
                        <p>From: {task.source}</p>
                        <span className="tiny-chip">{task.category}</span>
                      </article>
                    ))}
                    {!column.tasks.length && (
                      <div className="empty-state">
                        <strong>{column.title === "To Execute" && !taskCount ? "No tasks yet" : "Nothing here yet"}</strong>
                        {column.title === "To Execute" && !taskCount ? "Choose “Turn into task” on any memory to build your pipeline." : "Tasks will move here as you work through your plan."}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
