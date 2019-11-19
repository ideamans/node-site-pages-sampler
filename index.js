const Cheerio = require('cheerio-httpcli'),
  { default: PQueue } = require('p-queue'),
  { URL } = require('url'),
  Path = require('path')

const userAgents = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3864.0 Safari/537.36',  
}

class Interruption extends Error {
  constructor() {
    super('Pages reache to limit')
  }
}

class AppOptions {
  constructor(args={}) {
    Object.assign(this, {
      url: args.url,
      userAgentType: args.userAgentType || 'mobile',
      pageExtnames: args.pageExtnames || ',.html,.htm,.php,.asp,.aspx,.jsp,.cgi',
      limit: args.limit || 100,
      verify: !!args.verify,
      shuffle: !!args.shuffle,
      timeout: args.timeout || 10,
      concurrency: args.concurrency || 8,
      format: args.format || 'text',
      debug: !!args.debug,
    })
  }
}

class App {
  constructor(args={}) {
    this.options = new AppOptions(args)

    this.pageExtnames = this.options.pageExtnames.split(/\s*,\s*/)
    this.urls = []
    this.urlDictionary = {}
  }

  get queue() {
    if (this._queue) return this._queue
    return this._queue = new PQueue({
      concurrency: this.options.concurrency,
    })
  }

  isPageUrl(url) {
    if (!url.protocol.match(/^https?:/)) return false
    const extname = Path.extname(url.pathname)
    if (!this.pageExtnames.includes(extname)) return false
    return true
  }

  urlAddable() {
    return this.urls.length < this.options.limit
  }

  alreadyHasUrl(url) {
    return !!this.urlDictionary[url.href]
  }

  addUrl(url) {
    if (this.urlAddable() && !this.alreadyHasUrl(url)) {
      this.urls.push(url)
      this.urlDictionary[url.href] = true
      this.log('add', url.href)
    }

    if (!this.urlAddable()) throw new Interruption()
  }

  log(...args) {
    if (this.options.debug) console.log(...args)
  }

  async run() {
    // First url
    if (!this.options.url) throw new Error('No starting url in options')
    const url = new URL(this.options.url)

    // Timeout
    Cheerio.set('timeout', this.options.timeout * 1000)

    // User agent
    const ua = App.userAgents[this.options.userAgentType] || App.userAgents.mobile
    this.log('user agent', ua)
    Cheerio.set('headers', {
      'User-Agent': ua
    })

    // Start to crawl
    await this.crawl(url)

    // Wait for queue idle
    await this.queue.onIdle()
  }

  async output() {
    if (this.options.format == 'json') {
      process.stdout.write(JSON.stringify({ pages: this.urls.map(url => ({ url })) }))
    } else {
      process.stdout.write(this.urls.join("\n"))
    }
  }

  scrapeNewLinksFromCheerioRes(url, res) {
    const allLinks = []
    res.$('a[href]').each((idx, el) => {
      const href = res.$(el).attr('href')
      const link = new URL(href, url.href)
      allLinks.push(link)
    })

    const newLinks = allLinks.filter(link => {
      // Same host and not crawled
      if ( link.host != url.host ) return false
      if ( this.alreadyHasUrl(link) ) return false
      if ( !this.isPageUrl(link) ) return false
      return true
    })

    const sorted = this.options.shuffle ? newLinks.sort(() => Math.random() - 0.5) : newLinks

    return sorted
  }

  async crawl(url) {
    try {
      this.log('fetch', url.href)
      const res = await Cheerio.fetch(url.href)
      this.addUrl(url)

      const links = this.scrapeNewLinksFromCheerioRes(url, res)
      this.log('found', links.length, 'new links in', url.href)

      if (!this.options.verify) {
        for (let link of links) {
          this.addUrl(link)
        }
      }

      for (let link of links) {
        this.queue.add(() => this.crawl(link))
      }
    } catch(ex) {
      if (ex instanceof Interruption) {
        this.log('reached to limit')
        this.queue.clear()
        return
      } else {
        console.error(ex)
      }
    }
  }
}

App.userAgents = userAgents

module.exports = { App, AppOptions }
