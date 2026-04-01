const { execFileSync } = require("node:child_process");

function run() {
  const npmCmd = "npm";
  const env = { ...process.env, NODE_ENV: "production" };
  execFileSync(npmCmd, ["run", "build", "--prefix", "frontend-react"], {
    stdio: "inherit",
    env,
    shell: true
  });
}

run();

