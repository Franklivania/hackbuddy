package mailer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"

	"hackbuddy-backend/config"
)

const resendAPIURL = "https://api.resend.com/emails"

// ResendMailer sends email via Resend HTTP API (works in cloud where SMTP ports are blocked).
type ResendMailer struct {
	cfg      *config.Config
	otpTmpl  *template.Template
	fromAddr string
}

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html,omitempty"`
	Text    string   `json:"text,omitempty"`
}

type resendError struct {
	Message string `json:"message"`
	Name    string `json:"name"`
}

func NewResendMailer(cfg *config.Config) *ResendMailer {
	tmpl, _ := template.ParseFS(templatesFS, otpVerTemplateName)
	if tmpl == nil {
		tmpl = template.Must(template.New("otp").Parse("<p>Your verification code is: <strong>{{.Code}}</strong></p>"))
	}
	from := cfg.ResendFrom
	if from == "" {
		from = "HackBuddy <onboarding@resend.dev>"
	}
	return &ResendMailer{cfg: cfg, otpTmpl: tmpl, fromAddr: from}
}

func (m *ResendMailer) Send(to []string, subject string, body string) error {
	if len(to) == 0 {
		return fmt.Errorf("no recipient")
	}
	payload := resendPayload{From: m.fromAddr, To: to, Subject: subject, Text: body}
	return m.send(payload)
}

func (m *ResendMailer) SendOTPVerification(to string, code string) error {
	if to == "" {
		return fmt.Errorf("no recipient")
	}
	var buf bytes.Buffer
	if err := m.otpTmpl.Execute(&buf, struct{ Code string }{Code: code}); err != nil {
		log.Printf("[mailer] resend template execute: %v", err)
		return err
	}
	payload := resendPayload{
		From:    m.fromAddr,
		To:      []string{to},
		Subject: otpVerSubject,
		HTML:    buf.String(),
		Text:    "Your HackBuddy verification code is: " + code,
	}
	log.Printf("[mailer] sending OTP via Resend to %s", to)
	if err := m.send(payload); err != nil {
		log.Printf("[mailer] OTP send failed (to=%s): %v", to, err)
		return err
	}
	log.Printf("[mailer] OTP sent successfully to %s", to)
	return nil
}

func (m *ResendMailer) send(payload resendPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, resendAPIURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.cfg.ResendAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	var errBody struct {
		Message string       `json:"message"`
		Name    string       `json:"name"`
		Errors  []resendError `json:"errors,omitempty"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&errBody)
	if errBody.Message != "" {
		return fmt.Errorf("resend api %d: %s", resp.StatusCode, errBody.Message)
	}
	return fmt.Errorf("resend api %d", resp.StatusCode)
}
