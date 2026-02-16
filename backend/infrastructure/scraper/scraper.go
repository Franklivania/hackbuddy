package scraper

import (
	"errors"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/gocolly/colly"
)

var (
	ErrURLNotAllowed = errors.New("url is not allowed: blocked for security (private/metadata/localhost)")
)

type Scraper interface {
	Scrape(url string) (string, error)
}

type CollyScraper struct {
	allowedDomains []string // nil or empty = allow any host except SSRF blocks
}

// NewCollyScraper creates a scraper. allowedDomains is optional; when non-empty,
// only these domains (and subdomains) are allowed. Private IPs and metadata URLs are always blocked.
func NewCollyScraper(allowedDomains []string) *CollyScraper {
	return &CollyScraper{allowedDomains: allowedDomains}
}

func (s *CollyScraper) Scrape(rawURL string) (string, error) {
	if err := s.validateURL(rawURL); err != nil {
		return "", err
	}

	c := colly.NewCollector()
	if len(s.allowedDomains) > 0 {
		c.AllowedDomains = s.allowedDomains
	}
	c.SetRequestTimeout(30 * time.Second)

	var sb strings.Builder
	c.OnHTML("body", func(e *colly.HTMLElement) {
		e.DOM.Find("script, style, noscript").Remove()
		sb.WriteString(e.DOM.Text())
	})

	if err := c.Visit(rawURL); err != nil {
		return "", err
	}
	return sb.String(), nil
}

// validateURL blocks private IPs, loopback, link-local (e.g. 169.254.169.254), and localhost.
// If allowedDomains is set, host must be in the list (or a subdomain of one).
func (s *CollyScraper) validateURL(rawURL string) error {
	u, err := url.Parse(rawURL)
	if err != nil {
		return err
	}
	host := strings.TrimSpace(strings.ToLower(u.Hostname()))
	if host == "" {
		return ErrURLNotAllowed
	}
	// Block common metadata and localhost hostnames
	if host == "localhost" || host == "metadata" || strings.HasPrefix(host, "metadata.") || strings.HasSuffix(host, ".local") {
		return ErrURLNotAllowed
	}
	// If host is an IP, reject private/loopback/link-local
	if ip := net.ParseIP(host); ip != nil {
		if ip.IsLoopback() || ip.IsPrivate() || isLinkLocal(ip) {
			return ErrURLNotAllowed
		}
	}
	// If allowed list is set, host must match one or be a subdomain
	if len(s.allowedDomains) > 0 {
		allowed := false
		for _, d := range s.allowedDomains {
			d = strings.TrimSpace(strings.ToLower(d))
			if d == "" {
				continue
			}
			if host == d || strings.HasSuffix(host, "."+d) {
				allowed = true
				break
			}
		}
		if !allowed {
			return errors.New("url host is not in allowed scrape domains")
		}
	}
	return nil
}

func isLinkLocal(ip net.IP) bool {
	if ip4 := ip.To4(); ip4 != nil {
		return ip4[0] == 169 && ip4[1] == 254 // 169.254.0.0/16
	}
	return ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast()
}
