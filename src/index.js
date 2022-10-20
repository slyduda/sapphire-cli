import arg from 'arg';
import create from "./create";
import publish from "./publish";
import mention from './mention';

const parseArgumentsIntoOptions = (rawArgs) => {
  const args = arg(
    {
      '--create': Boolean,
      '--publish': Boolean,
      '--mention': Boolean,
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    c: args['--create'] || false,
    p: args['--publish'] || false,
    m: args['--mention'] || false,
  };
}

export async function cli(args) {
  const { c, p, m } = parseArgumentsIntoOptions(args);
  if (c) await create();
  if (p) await publish();
  if (m) await mention();
}