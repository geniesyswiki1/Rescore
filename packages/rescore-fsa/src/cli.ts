/**
 * Runs the watcher from the command line, for a manual run or a cron on a box.
 *
 * node dist/cli.js --authority 112 --authority 99
 * node dist/cli.js --all --slack "$SLACK_LEADS_WEBHOOK"
 */
import { pathToFileURL } from "node:url";
import { FsaClient } from "./client.js";
import { InMemoryLeadStore, GET_TO_FIVE_KEYS, LOW_RATING_KEYS, postToSlack, runWatch, slackMessage } from "./watcher.js";

function argValues(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((value, index) => {
    if (value === `--${name}` && process.argv[index + 1]) out.push(process.argv[index + 1] as string);
  });
  return out;
}

async function main(): Promise<void> {
  const authorityIds = argValues("authority").map((v) => Number.parseInt(v, 10)).filter(Number.isFinite);
  const all = process.argv.includes("--all");
  const getToFive = process.argv.includes("--get-to-five");
  const slackWebhook = argValues("slack")[0] ?? process.env.SLACK_LEADS_WEBHOOK ?? null;

  if (!all && authorityIds.length === 0) {
    console.error("Pass --authority <id> one or more times, or --all for every FHRS authority.");
    process.exit(1);
  }

  const store = new InMemoryLeadStore();
  const result = await runWatch({
    client: new FsaClient(),
    store,
    ...(all ? {} : { authorityIds }),
    ratingKeys: getToFive ? GET_TO_FIVE_KEYS : LOW_RATING_KEYS,
  });

  console.log(
    `Scanned ${result.authoritiesScanned} authorities, saw ${result.establishmentsSeen} establishments, ${result.newLeads.length} new leads.`,
  );
  for (const error of result.errors) {
    console.error(`Authority ${error.authorityId} rating ${error.ratingKey}: ${error.message}`);
  }

  for (const lead of result.newLeads.slice(0, 20)) {
    console.log(`\n${slackMessage(lead)}`);
  }

  if (slackWebhook) {
    let posted = 0;
    for (const lead of result.newLeads) {
      if (await postToSlack(slackWebhook, lead)) posted += 1;
    }
    console.log(`\nPosted ${posted} of ${result.newLeads.length} leads to Slack.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
