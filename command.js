#!/usr/bin/env node

const Yargs = require('yargs')
const { App, AppOptions } = require('./index')

const defaults = new AppOptions()

Yargs
  .usage(`Usage: $0 <url>"`)
  .command('* <url>', 'Starts to crawl samples pages from the URL.', yargs => {
    yargs
      .option('user-agent-type', { alias: 'u', description: 'User agent type. (mobile|desktop)', default: defaults.userAgentType })
      .option('limit', { alias: 'l', description: 'Sample pages limit.', default: defaults.limit })
      .option('concurrency', { alias: 'c', description: 'Concurrency of requests.', default: defaults.concurrency })
      .option('timeout', { description: 'Request timeout. (seconds)', default: defaults.timeout })
      .option('verify', { alias: 'v', description: 'Verifies each url can be got.', default: defaults.verify })
      .boolean('verify')
      .option('shuffle', { description: 'Shuffles links order.', default: defaults.shuffle })
      .boolean('shuffle')
      .option('debug', { alias: 'd', description: 'Outputs debug logs to stderr.', default: defaults.debug })
      .boolean('debug')
      .option('page-extnames', { description: 'Comma separated extension names of pages.', default: defaults.pageExtnames })
      .option('format', { alias: 'f', description: 'Output format. (text|json)', default: defaults.format })
      // .option('sitemap', { alias: 's', description: 'Referes sitemap.xml', default: false }) // future
      // .boolean('sitemap')
    }, async (argv) => {
    const app = new App(argv)
    await app.run()
    await app.output()
  })
  .argv