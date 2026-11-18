import { spawnSync } from "node:child_process";

const isInstalled = (name) => !spawnSync(name, ["-v"], { stdio: "ignore" }).error;

/** Lève en listant les commandes système absentes du PATH. */
export function assertCommands(names, probe = isInstalled) {
  const missing = names.filter((name) => !probe(name));
  if (missing.length) throw new Error(`outil(s) manquant(s) : ${missing.join(", ")} — installe-les puis relance`);
}
