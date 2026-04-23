/**
 * Note command group - All note/card operations
 */

import { Command } from 'commander';
import { createAddCommand } from './add';
import { createListCommand } from './list';
import { createEditCommand } from './edit';
import { createDeleteCommand } from './delete';
import { createGenerateCommand } from './generate';
import { importCommand } from './import';
import { createTagCommand } from './tag';

export function createNoteCommand(): Command {
  const command = new Command('note');

  command.description('Create, read, update, and delete notes/cards');

  command.addCommand(createAddCommand());
  command.addCommand(createListCommand());
  command.addCommand(createEditCommand());
  command.addCommand(createDeleteCommand());
  command.addCommand(createGenerateCommand());
  command.addCommand(importCommand);
  command.addCommand(createTagCommand());

  return command;
}
