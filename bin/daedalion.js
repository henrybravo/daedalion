#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { init } from '../src/commands/init.js';
import { build } from '../src/commands/build.js';
import { validate } from '../src/commands/validate.js';
import { clean } from '../src/commands/clean.js';

function displayLogo() {
  const logo = `
██████╗  █████╗ ███████╗██████╗  █████╗ ██╗     ██╗ ██████╗ ███╗   ██╗
██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██║██╔═══██╗████╗  ██║
██║  ██║███████║█████╗  ██║  ██║███████║██║     ██║██║   ██║██╔██╗ ██║
██║  ██║██╔══██║██╔══╝  ██║  ██║██╔══██║██║     ██║██║   ██║██║╚██╗██║
██████╔╝██║  ██║███████╗██████╔╝██║  ██║███████╗██║╚██████╔╝██║ ╚████║
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
`;

  console.log(chalk.cyan(logo));
  console.log(chalk.gray(`Author: Henry Bravo`));
  console.log(chalk.gray(`Email: info@henrybravo.nl`));
  //console.log(chalk.gray(`Date: ${new Date().toISOString().split('T')[0]}`));
  console.log(chalk.gray(`Date: 2026-01-11`));
  console.log(chalk.gray(`Version: 0.0.1`));
  console.log();
}

// Display logo unless help is requested
if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
  displayLogo();
}

program
  .name('daedalion')
  .description('OpenSpec-to-Agent compiler for GitHub Copilot')
  .version('0.0.1')
  .helpOption('-h, --help', 'display help for command');

program
  .command('init')
  .description('Scaffold config + example spec')
  .action(async () => {
    try {
      await init(process.cwd());
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(2);
    }
  });

program
  .command('build')
  .description('Generate .github/ from openspec/')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--verbose', 'Detailed output for debugging')
  .option('--force', 'Overwrite without confirmation')
  .action(async (options) => {
    try {
      await build(process.cwd(), options);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Check specs and generated output')
  .action(async () => {
    try {
      const valid = await validate(process.cwd());
      if (!valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remove generated files')
  .action(async () => {
    try {
      await clean(process.cwd());
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
