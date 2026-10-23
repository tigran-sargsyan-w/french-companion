import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(directory, "../public/data/conjugaison/verbs");
const destination = path.resolve(directory, "../public/data/conjugaison/verbs-bundle.json");
const files = fs.readdirSync(source).filter((file) => file.endsWith(".json")).sort();
if (!files.length) throw new Error("Aucun fichier JSON de conjugaison trouvé.");
const verbs = files.map((filename) =>
  JSON.parse(fs.readFileSync(path.join(source, filename), "utf8")),
);
fs.writeFileSync(destination, JSON.stringify({ verbs }) + "\n");
console.log(`Generated conjugation bundle (${verbs.length} verbs) at ${destination}`);
