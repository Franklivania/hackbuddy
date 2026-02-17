package mailer

import (
	"fmt"
	"hackbuddy-backend/config"
	"net/smtp"
)

type Mailer interface {
	Send(to []string, subject string, body string) error
}

type SMTPMailer struct {
	cfg *config.Config
}

func NewSMTPMailer(cfg *config.Config) *SMTPMailer {
	return &SMTPMailer{cfg: cfg}
}

func (m *SMTPMailer) Send(to []string, subject string, body string) error {
	from := m.cfg.SMTPUser
	password := m.cfg.SMTPPassword
	smtpHost := m.cfg.SMTPServer
	smtpPort := fmt.Sprintf("%d", m.cfg.SMTPPort)

	auth := smtp.PlainAuth("", from, password, smtpHost)

	fromHeader := "HackBuddy <" + from + ">"
	msg := []byte("From: " + fromHeader + "\r\n" +
		"To: " + to[0] + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	addr := smtpHost + ":" + smtpPort
	return smtp.SendMail(addr, auth, from, to, msg)
}
