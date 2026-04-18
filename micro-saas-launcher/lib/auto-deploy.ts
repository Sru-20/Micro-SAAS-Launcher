import { dirname, join, resolve } from "path";
import fs from "fs-extra";
import simpleGit from "simple-git";
import type { GeneratedFile } from "@/lib/code-generator";

type DeployConfig = {
  enabled: boolean;
  repoPath: string;
  branch: string;
  liveUrl: string;
};

type DeployResult =
  | { ok: true; pushed: boolean; branch: string; liveUrl: string; commitMessage: string }
  | { ok: false; error: string };

function getDeployConfig(): DeployConfig {
  const enabled = process.env.AUTO_DEPLOY_ENABLED === "true";
  const repoPath = process.env.AUTO_DEPLOY_REPO_PATH || "";
  const branch = process.env.AUTO_DEPLOY_BRANCH || "main";
  const liveUrl = process.env.AUTO_DEPLOY_LIVE_URL || "";

  return { enabled, repoPath, branch, liveUrl };
}

async function clearRepoWorkingTree(repoPath: string) {
  const entries = await fs.readdir(repoPath);
  await Promise.all(
    entries
      .filter((entry) => entry !== ".git")
      .map((entry) => fs.remove(join(repoPath, entry)))
  );
}

async function writeManifestToRepo(repoPath: string, files: GeneratedFile[]) {
  for (const file of files) {
    const fullPath = join(repoPath, file.path);
    await fs.ensureDir(dirname(fullPath));
    await fs.writeFile(fullPath, file.content, "utf-8");
  }
}

export async function autoDeployGeneratedApp(params: {
  appName: string;
  projectId: string;
  files: GeneratedFile[];
}): Promise<DeployResult> {
  const config = getDeployConfig();

  if (!config.enabled) {
    return { ok: false, error: "AUTO_DEPLOY_ENABLED is not true" };
  }

  if (!config.repoPath) {
    return { ok: false, error: "AUTO_DEPLOY_REPO_PATH is not configured" };
  }

  if (!config.liveUrl) {
    return { ok: false, error: "AUTO_DEPLOY_LIVE_URL is not configured" };
  }

  const repoPath = resolve(config.repoPath);
  const exists = await fs.pathExists(repoPath);
  if (!exists) {
    return { ok: false, error: `Deploy repo path does not exist: ${repoPath}` };
  }

  const gitDirExists = await fs.pathExists(join(repoPath, ".git"));
  if (!gitDirExists) {
    return { ok: false, error: `Deploy path is not a git repo: ${repoPath}` };
  }

  try {
    await clearRepoWorkingTree(repoPath);
    await writeManifestToRepo(repoPath, params.files);

    const git = simpleGit(repoPath);
    await git.add(".");

    const status = await git.status();
    if (status.files.length === 0) {
      return {
        ok: true,
        pushed: false,
        branch: config.branch,
        liveUrl: config.liveUrl,
        commitMessage: "No changes to deploy",
      };
    }

    const commitMessage = `auto deploy: ${params.appName} (${params.projectId})`;
    await git.commit(commitMessage);
    await git.push("origin", config.branch);

    return {
      ok: true,
      pushed: true,
      branch: config.branch,
      liveUrl: config.liveUrl,
      commitMessage,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Auto deploy failed",
    };
  }
}

