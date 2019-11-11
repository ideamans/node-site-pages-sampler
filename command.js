#!/usr/bin/env node

const Yargs = require('yargs')
const Package = require('../package.json')
const { App } = require('./index')

Yargs
  .usage(`Usage: $0 <url>"`)
  .version(Package.version, 'version')
  .command('* <url>', 'Starts crawl', yargs => {
    yargs
      .option('user-agent', { alias: 'u', description: 'User agent type (mobile|desktop)', default: 'desktop' })
      .option('limit', { alias: 'l', description: 'URLs limit.', default: 100 })
      .option('timeout', { description: 'Request timeout (seconds).', default: 10 })
      .option('sitemap', { alias: 's', description: 'Refere sitemap.xml', default: false })
      .option('format', { alias: 'f', description: 'Output format (text|json)', default: 'text' })
      .boolean('sitemap')
      .option('verify', { alias: 'v', description: 'Verify each url.', default: false })
      .boolean('verify')
  }, async (argv) => {
    const app = new App(argv)
    await app.run()
    await app.output()
  })
  .argv