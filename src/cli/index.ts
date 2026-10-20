import { Command } from 'commander';

const program = new Command()
  .name('mandao')
  .description('Spec-Driven Development for coding agents, across harnesses.')
  .version('0.1.0');

await program.parseAsync();
