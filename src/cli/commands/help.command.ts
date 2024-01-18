import { Command } from './command.interface.js';
import chalk from 'chalk';

export default class HelpCommand implements Command {
  public getName(): string {
    return '--help';
  }

  public async execute(..._parameters: string[]): Promise<void> {
    console.info(`
        ${chalk.bgBlue('Программа для подготовки данных для REST API сервера.')}
        ${chalk.bgYellow('Пример:')}
            ${chalk.green('cli.js --<command> [--arguments]')}
        ${chalk.bgYellow('Команды:')}
            ${chalk.green('--version:')}                   ${chalk.magenta('# выводит номер версии')}
            ${chalk.green('--help:')}                      ${chalk.magenta('# печатает этот текст')}
            ${chalk.green('--import <path>:')}             ${chalk.magenta('# импортирует данные из TSV')}
            ${chalk.green('--generate <n> <path> <url>')}  ${chalk.magenta('# генерирует произвольное количество тестовых данных')}
    `);
  }
}
