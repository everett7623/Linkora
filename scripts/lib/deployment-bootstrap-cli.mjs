function parseArgs(argv) {
  const options = {
    prefix: '',
    domain: '',
    accountId: '',
    location: '',
    apply: false,
    confirmation: '',
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--prefix') options.prefix = argv[++index] ?? '';
    else if (argument === '--domain') options.domain = argv[++index] ?? '';
    else if (argument === '--account-id') options.accountId = argv[++index] ?? '';
    else if (argument === '--location') options.location = argv[++index] ?? '';
    else if (argument === '--apply') options.apply = true;
    else if (argument === '--confirm') options.confirmation = argv[++index] ?? '';
    else if (argument === '--json') options.json = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Linketry beginner Cloudflare bootstrap

Usage:
  npm run deploy:bootstrap -- --prefix linketry-<unique-name> --domain <hostname> --account-id <id>
  npm run deploy:bootstrap -- --prefix linketry-<unique-name> --domain <hostname> --account-id <id> --apply --confirm <phrase>

The first command is a read-only dry-run. It lists the selected account's D1/KV resources,
shows whether each exact name will be created or reused, and prints the required confirmation.
Apply mode creates only missing D1/KV resources, reads them back, and prints binding values.
It never applies migrations, deploys code, writes secrets, changes DNS, or creates optional resources.`);
}

function printReport(report) {
  console.log(`Linketry beginner bootstrap: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Account: ${report.accountId}`);
  console.log(`Prefix: ${report.prefix || 'not configured'}`);
  console.log(`Domain: ${report.domain || 'not configured'}`);
  console.log(`D1 location: ${report.location}`);
  console.log('Resource plan:');
  for (const [type, resource] of Object.entries(report.resources)) {
    console.log(`  ${type}: ${resource.name} (${resource.action})`);
  }
  if (report.errors.length > 0) {
    console.log('Errors:');
    for (const error of report.errors) console.log(`  - ${error}`);
  }
  if (report.mode === 'dry-run' && report.ok) {
    console.log('No mutations were performed. To apply this exact plan, rerun with:');
    console.log(`  --apply --confirm ${report.confirmation}`);
  }
  if (report.bindingOutputReady) {
    console.log('GitHub repository variables:');
    for (const [key, value] of Object.entries(report.bindings)) console.log(`  ${key}=${value}`);
    console.log('Wrangler TOML bindings:');
    console.log(report.wranglerToml);
  }
  console.log(`Mutations attempted: ${report.mutationAttempted ? 'yes' : 'no'}`);
  console.log(
    `Mutations completed: ${report.mutationPerformed ? report.created.join(', ') : 'none'}`
  );
}

export async function runBootstrapCli({ runBootstrap, argv = process.argv.slice(2) }) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp();
      return;
    }
    const report = await runBootstrap({ options });
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printReport(report);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
