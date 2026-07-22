function parseArgs(argv) {
  const options = {
    repository: '',
    prefix: '',
    domain: '',
    accountId: '',
    apply: false,
    confirmation: '',
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--repo') options.repository = argv[++index] ?? '';
    else if (argument === '--prefix') options.prefix = argv[++index] ?? '';
    else if (argument === '--domain') options.domain = argv[++index] ?? '';
    else if (argument === '--account-id') options.accountId = argv[++index] ?? '';
    else if (argument === '--apply') options.apply = true;
    else if (argument === '--confirm') options.confirmation = argv[++index] ?? '';
    else if (argument === '--json') options.json = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Linketry beginner GitHub configuration

Usage:
  npm run deploy:configure -- --repo <owner/repository> --prefix linketry-<name> --domain <hostname> --account-id <id>
  npm run deploy:configure -- --repo <owner/repository> --prefix linketry-<name> --domain <hostname> --account-id <id> --apply --confirm <phrase>

The first command is a read-only dry-run. It reuses the exact D1/KV resources discovered
by deploy:bootstrap and prints the repository secret/variable plan. Apply requires the
printed confirmation, verifies GitHub authentication and CLOUDFLARE_API_TOKEN, then sets
the account ID plus the minimum fresh-deployment variables. It never reads or prints token values.`);
}

function printReport(report) {
  console.log(`Linketry GitHub configuration: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Repository: ${report.repository}`);
  console.log(`Cloudflare account: ${report.accountId}`);
  console.log(`Prefix: ${report.prefix}`);
  console.log(`Domain: ${report.domain}`);
  console.log('Repository variable plan:');
  for (const [name, value] of Object.entries(report.variables)) console.log(`  ${name}=${value}`);
  console.log(`Required apply confirmation: ${report.confirmation}`);
  console.log(
    report.mutations.length > 0
      ? `Applied: ${report.mutations.join(', ')}`
      : 'No GitHub repository mutations were performed.'
  );
  for (const error of report.errors) console.error(`ERROR: ${error}`);
}

export async function runGitHubConfigurationCli({
  runGitHubConfiguration,
  argv = process.argv.slice(2),
}) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp();
      return;
    }
    const report = await runGitHubConfiguration({ options });
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printReport(report);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
