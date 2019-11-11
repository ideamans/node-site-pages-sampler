const { App } = require('./index')

async function main() {
  const app = new App({
    url: 'https://blog.ideamans.com/',
    limit: 10,
    verify: false,
    format: 'json',
  })
  await app.run()
  await app.output()
}

main()