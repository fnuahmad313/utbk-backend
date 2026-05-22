const { execSync } = require('child_process');

// Update PATH
process.env.PATH = "C:\\laragon\\bin\\nodejs\\node-v22;" + process.env.PATH;

try {
  console.log("Running vitest tests in child process...");
  execSync('npx vitest run', { stdio: 'inherit', cwd: 'c:\\Users\\ahmad\\Desktop\\utbk-platform' });
  console.log("Tests completed successfully!");
} catch (error) {
  console.error("Tests failed!");
  process.exit(1);
}
