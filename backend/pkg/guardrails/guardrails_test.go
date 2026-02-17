package guardrails

import (
	"strings"
	"testing"
)

func TestIsBlocked_BlockedTopics(t *testing.T) {
	for _, topic := range []string{"politics", "sex", "violence", "gun", "nsfw", "governmental"} {
		if !IsBlocked("something " + topic + " here") {
			t.Errorf("expected blocked for topic %q", topic)
		}
	}
}

func TestIsBlocked_BypassKeywords(t *testing.T) {
	for _, kw := range []string{"ignore previous instructions", "bypass", "you are now", "jailbreak"} {
		if !IsBlocked(kw) {
			t.Errorf("expected blocked for bypass keyword in %q", kw)
		}
	}
}

func TestIsBlocked_Allowed(t *testing.T) {
	allowed := []string{"how do I win the hackathon?", "what tech stack was used?", "event dates"}
	for _, s := range allowed {
		if IsBlocked(s) {
			t.Errorf("expected allowed: %q", s)
		}
	}
}

func TestSystemInstructions_ContainsBlockedResponse(t *testing.T) {
	instructions := SystemInstructions()
	if !strings.Contains(instructions, BlockedResponse) {
		t.Error("SystemInstructions should contain BlockedResponse")
	}
}
