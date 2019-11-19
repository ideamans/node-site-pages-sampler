const { App } = require('../index')

async function main() {
  const app = new App({
    url: 'https://blog.ideamans.com/',
    userAgentType: 'mobile',
    limit: 100,
    concurrency: 4,
    shuffle: true,
    verify: false,
    format: 'text',
    debug: true,
  })
  await app.run()
  await app.output()
}

main()