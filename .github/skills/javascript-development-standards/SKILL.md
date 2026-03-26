---
name: javascript-development-standards
description: Guide for writing JavaScript code in this project. Use this whenever creating, editing, or reviewing JavaScript or JSX files.
---

## Core principles

- Write code that communicates intent through naming and structure, not comments
- Never add inline comments or block comments to code — if a comment feels necessary, the code needs to be refactored instead
- Each function does exactly one thing
- Each module/file has a single responsibility
- Prefer explicit over implicit; prefer clarity over cleverness

---

## Naming

- Variables and functions: `camelCase`
- React components: `PascalCase`
- Constants with wide scope: `UPPER_SNAKE_CASE`
- Names must reveal intent — avoid abbreviations, single letters, or generic names like `data`, `info`, `temp`, `obj`, `val`
- Boolean variables and functions must read as a predicate: `isLoading`, `hasError`, `canSubmit`
- Functions must be named as verbs or verb phrases: `fetchDocument`, `parseMarkdown`, `buildFilePath`

---

## Functions

- A function must do one thing only
- If a function requires a comment to explain what it does, rename it or extract logic into smaller functions
- Avoid side effects in functions that compute or transform — side effects belong in dedicated functions
- Keep functions short — if it does not fit on one screen, it probably has more than one responsibility
- Parameter count: prefer 0–2; if more than 2 are needed, use a named options object
- Avoid boolean flag parameters — split into two separate functions instead
- Avoid output arguments — return values instead of mutating passed references
- Pure functions are preferred; isolate impure operations (I/O, state mutation, DOM) at the edges

```js
const buildFilePath = (directory, filename) => `${directory}/${filename}`;

const readFileContent = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
};

const parseMarkdownSections = (rawContent) => rawContent.split(/^## /m).filter(Boolean);
```

---

## Variables and state

- Declare variables as close to their usage as possible
- Prefer `const`; use `let` only when reassignment is unavoidable; never use `var`
- Avoid mutation — create new values instead of modifying existing ones
- Destructure objects and arrays when extracting multiple values

```js
const { title, body, createdAt } = document;

const updatedItems = items.map((item) => ({ ...item, selected: false }));
```

---

## Conditionals

- Avoid negated conditions when a positive form is clear
- Replace complex conditions with named predicates

```js
const isExpired = (document) => Date.now() > document.expiresAt;

const isValidDocument = (document) => document !== null && document.id !== undefined;
```

- Use guard clauses to return early and avoid deep nesting

```js
const processDocument = (document) => {
  if (!isValidDocument(document)) return null;
  if (isExpired(document)) return null;

  return formatDocument(document);
};
```

---

## Modules and file structure

- One component or one concern per file
- Group related functionality into dedicated modules: `fileUtils.js`, `markdownParser.js`, `documentService.js`
- Export only what is needed — keep internal helpers unexported
- Avoid cross-layer imports (e.g., renderer importing main-process modules directly)
- Dependency direction: `pages` → `components` → `hooks` → `services` → `utils`

---

## Error handling

- Never silently swallow errors
- Errors must be handled at the boundary layer (IPC handlers, event handlers, service calls)
- Use specific, descriptive error messages
- Propagate errors as thrown values or rejected promises; do not encode errors as return values like `null` or `-1` unless the API contract explicitly requires it

```js
const loadDocument = async (filePath) => {
  try {
    return await readFileContent(filePath);
  } catch (error) {
    throw new Error(`Failed to load document at ${filePath}: ${error.message}`);
  }
};
```

---

## Async

- Always use `async/await` — avoid `.then()` chains
- Always handle rejections — use `try/catch` around `await` calls at the boundary
- Never use `async` functions inside array methods like `.map()` without explicit handling of the resulting promises
- Use `Promise.all` when executing independent async operations concurrently

```js
const loadAllDocuments = async (filePaths) => {
  const documents = await Promise.all(filePaths.map(loadDocument));
  return documents;
};
```

---

## React components

- One component per file
- Components must only handle rendering and user interaction — no business logic inside JSX
- Extract all non-trivial logic into custom hooks or service functions
- Props must be explicitly destructured at the top of the component
- Avoid inline object/function creation in JSX — define them outside the return block
- Keep the JSX return block as flat and readable as possible

```jsx
const DocumentCard = ({ title, path, onOpen }) => {
  const handleClick = () => onOpen(path);

  return (
    <div className={styles.card} onClick={handleClick}>
      <span className={styles.title}>{title}</span>
    </div>
  );
};
```

---

## Custom hooks

- Hook name must start with `use`
- Each hook encapsulates one concern: data fetching, form state, UI state, etc.
- Hooks must not contain JSX
- Hooks must return only what the consumer needs

```js
const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const result = await api.listDocuments();
      setDocuments(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return { documents, isLoading, error, refetch: fetchDocuments };
};
```

---

## What not to do

- Do not add comments explaining what code does — rename or refactor instead
- Do not add comments about argument types, return types, or side effects — these should be clear from the code itself
- Do not write functions that do two things joined by "and" in their name
- Do not mix business logic with rendering logic inside components
- Do not use magic numbers or magic strings — assign them to named constants
- Do not rely on deep nesting — flatten with early returns and extracted functions
- Do not duplicate logic — extract and reuse
