const Cheerio = require('cheerio-httpcli'),
  { default: PQueue } = require('p-queue'),
  { URL } = require('url')

const userAgents = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3864.0 Safari/537.36',
}

class App {
  constructor(args={}) {
    this.options = {
      url: args.url,
      userAgent: args.userAgent || 'mobile',
      limit: args.limit || 100,
      timeout: args.timeout || 10,
      concurrency: args.concurrency || 8,
      format: args.format || 'text',
      verify: args.verify || false,
    }

    this.queue = new PQueue({
      concurrency: this.options.concurrency,
    })

    this.urls = []
    this.urlDictionary = {}
  }

  noMoreUrl() {
    return this.urls.length > this.options.limit
  }

  hasUrl(url) {
    return this.urlDictionary[url] || false
  }

  addUrl(url) {
    if (!this.noMoreUrl() && !this.hasUrl(url)) {
      this.urls.push(url)
      this.urlDictionary[url] = true
    }
  }

  async run() {
    Cheerio.set('timeout', this.options.timeout * 1000)

    const ua = userAgents[this.options.userAgent] || userAgents.mobile
    Cheerio.set('headers', {
      'User-Agent': ua
    })

    this.queue.add(() => this.crawl(new URL(this.options.url)))
    await this.queue.onIdle()
  }

  async output() {
    if (this.options.format == 'json') {
      process.stdout.write(JSON.stringify({ urls: this.urls }))
    } else {
      process.stdout.write(this.urls.join("\n"))
    }
  }

  async crawl(url) {
    try {
      if (this.noMoreUrl()) return

      let res
      if (this.options.verify) {
        res = await Cheerio.fetch(url.href)
        this.addUrl(url.href)
        if (this.noMoreUrl()) return
      } else {
        this.addUrl(url.href)
        if (this.noMoreUrl()) return
        res = await Cheerio.fetch(url.href)
      }

      const allLinks = []
      res.$('a[href]').each((idx, el) => {
        const href = res.$(el).attr('href')
        const link = new URL(href, url.href)
        allLinks.push(link)
      })

      const targetLinks = allLinks.filter(link => {
        if ( link.host != url.host ) return false
        if ( this.urlDictionary[link.href] ) return false
        return true
      })

      for (let link of targetLinks) {
        this.queue.add(() => this.crawl(link))
      }
    } catch(ex) {
      console.error(ex)
    }
  }
}

module.exports.App = App