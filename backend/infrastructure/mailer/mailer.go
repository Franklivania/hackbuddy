package mailer

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"log"

	"hackbuddy-backend/config"

	"gopkg.in/gomail.v2"
)

//go:embed templates/*.html
var templatesFS embed.FS

const (
	otpVerTemplateName = "templates/otp-ver.html"
	otpVerSubject      = "Verify your email – HackBuddy"
)

type Mailer interface {
	Send(to []string, subject string, body string) error
	SendOTPVerification(to string, code string) error
}

type GomailMailer struct {
	cfg      *config.Config
	dialer   *gomail.Dialer
	fromAddr string
	fromName string
	otpTmpl  *template.Template
}

func NewGomailMailer(cfg *config.Config) *GomailMailer {
	tmpl, _ := template.ParseFS(templatesFS, otpVerTemplateName)
	if tmpl == nil {
		tmpl = template.Must(template.New("otp").Parse("<p>Your verification code is: <strong>{{.Code}}</strong></p>"))
	}
	return &GomailMailer{
		cfg:      cfg,
		dialer:   gomail.NewPlainDialer(cfg.SMTPServer, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword),
		fromAddr: cfg.SMTPUser,
		fromName:  "HackBuddy",
		otpTmpl:  tmpl,
	}
}

func (m *GomailMailer) Send(to []string, subject string, body string) error {
	if len(to) == 0 {
		return fmt.Errorf("no recipient")
	}
	if !m.configured() {
		err := fmt.Errorf("SMTP not configured: set SMTP_USER, SMTP_PASSWORD, SMTP_SERVER in env")
		log.Printf("[mailer] %v", err)
		return err
	}

	msg := gomail.NewMessage()
	msg.SetHeader("From", m.fromHeader())
	msg.SetHeader("To", to[0])
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/plain", body)

	if err := m.dialer.DialAndSend(msg); err != nil {
		log.Printf("[mailer] send failed (to=%s): %v", to[0], err)
		return err
	}
	return nil
}

func (m *GomailMailer) SendOTPVerification(to string, code string) error {
	if to == "" {
		return fmt.Errorf("no recipient")
	}
	if !m.configured() {
		err := fmt.Errorf("SMTP not configured: set SMTP_USER, SMTP_PASSWORD, SMTP_SERVER in env")
		log.Printf("[mailer] %v", err)
		return err
	}

	log.Printf("[mailer] sending OTP to %s (server=%s:%d)", to, m.cfg.SMTPServer, m.cfg.SMTPPort)

	var buf bytes.Buffer
	if err := m.otpTmpl.Execute(&buf, struct{ Code string }{Code: code}); err != nil {
		log.Printf("[mailer] template execute: %v", err)
		return err
	}
	htmlBody := buf.String()

	msg := gomail.NewMessage()
	msg.SetHeader("From", m.fromHeader())
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", otpVerSubject)
	msg.SetBody("text/html", htmlBody)
	msg.AddAlternative("text/plain", "Your HackBuddy verification code is: "+code)

	if err := m.dialer.DialAndSend(msg); err != nil {
		log.Printf("[mailer] OTP send failed (to=%s): %v — if in cloud (e.g. Render), outbound SMTP ports 587/465 are often blocked; use an HTTP-based provider (SendGrid, Resend, Mailgun)", to, err)
		return err
	}
	log.Printf("[mailer] OTP sent successfully to %s", to)
	return nil
}

func (m *GomailMailer) configured() bool {
	return m.cfg.SMTPUser != "" && m.cfg.SMTPPassword != "" && m.cfg.SMTPServer != ""
}

func (m *GomailMailer) fromHeader() string {
	return m.fromName + " <" + m.fromAddr + ">"
}
