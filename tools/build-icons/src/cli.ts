import { parseArgs } from 'node:util';
import { runPipeline } from './pipeline';

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: {
      icon: { type: 'string' },
      year: { type: 'string' },
      watch: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(
      [
        'build-icons — generate framework packages from icons/',
        '',
        'Usage:',
        '  build-icons [--icon=<slug>] [--year=<year>] [--watch]',
        '',
        'Flags:',
        '  --icon=<slug>   Rebuild only one brand',
        '  --year=<year>   Rebuild only one millésime of --icon',
        '  --watch         Re-run on icons/ changes',
        '  -h, --help      Show this message',
        '',
      ].join('\n'),
    );
    return;
  }

  await runPipeline({
    iconFilter: values.icon,
    yearFilter: values.year,
    watch: values.watch ?? false,
  });
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`build-icons: ${message}\n`);
  process.exit(1);
});
