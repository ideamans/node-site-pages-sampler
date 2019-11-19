To get 10 URLs of webpage in the website from a starting URL.

```bash
site-pages-sampler -l 10 -s 'https://www.ideamans.com/'
```

# Usage

```
site-pages-sampler <url>

Starts to crawl samples pages from the URL.

Options:
  --help                 Show help                                     [boolean]
  --version              Show version number                           [boolean]
  --user-agent-type, -u  User agent type. (mobile|desktop)   [default: "mobile"]
  --limit, -l            Sample pages limit.                      [default: 100]
  --concurrency, -c      Concurrency of requests.                   [default: 8]
  --timeout              Request timeout. (seconds)                [default: 10]
  --verify, -v           Verifies each url can be got.[boolean] [default: false]
  --shuffle              Shuffles links order.        [boolean] [default: false]
  --debug, -d            Outputs debug logs to stderr.[boolean] [default: false]
  --page-extnames        Comma separated extension names of pages.
                              [default: ",.html,.htm,.php,.asp,.aspx,.jsp,.cgi"]
  --format, -f           Output format. (text|json)            [default: "text"]
```