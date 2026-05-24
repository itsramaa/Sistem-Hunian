package resend

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "https://api.resend.com"

// Client is a minimal Resend API client.
type Client struct {
	apiKey     string
	from       string
	httpClient *http.Client
}

// New creates a new Resend client.
func New(apiKey, from string) *Client {
	return &Client{
		apiKey: apiKey,
		from:   from,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// SendEmailRequest is the payload for sending an email via Resend.
type SendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

// SendEmailResponse is the response from Resend after sending an email.
type SendEmailResponse struct {
	ID string `json:"id"`
}

// SendEmail sends an email using the Resend API.
func (c *Client) SendEmail(ctx context.Context, req SendEmailRequest) (*SendEmailResponse, error) {
	if req.From == "" {
		req.From = c.from
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("resend: marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/emails", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("resend: create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("resend: send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("resend: read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("resend: API error %d: %s", resp.StatusCode, string(respBody))
	}

	var result SendEmailResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("resend: unmarshal response: %w", err)
	}

	return &result, nil
}
