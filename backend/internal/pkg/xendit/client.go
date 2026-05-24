// Package xendit provides an HTTP client for the Xendit payment API.
package xendit

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const defaultBaseURL = "https://api.xendit.co"

// Client is an HTTP client for the Xendit API.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// New creates a new Xendit Client with the given API key.
func New(apiKey string) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: defaultBaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CreateInvoiceRequest is the request body for creating a Xendit invoice.
type CreateInvoiceRequest struct {
	ExternalID  string  `json:"external_id"`
	Amount      float64 `json:"amount"`
	PayerEmail  string  `json:"payer_email"`
	Description string  `json:"description"`
	Currency    string  `json:"currency,omitempty"`
	SuccessURL  string  `json:"success_redirect_url,omitempty"`
	FailureURL  string  `json:"failure_redirect_url,omitempty"`
}

// InvoiceResponse is the response from Xendit's create invoice endpoint.
type InvoiceResponse struct {
	ID          string    `json:"id"`
	ExternalID  string    `json:"external_id"`
	Status      string    `json:"status"`
	Amount      float64   `json:"amount"`
	PayerEmail  string    `json:"payer_email"`
	Description string    `json:"description"`
	InvoiceURL  string    `json:"invoice_url"`
	ExpiryDate  time.Time `json:"expiry_date"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

// DisbursementRequest is the request body for creating a Xendit disbursement.
type DisbursementRequest struct {
	ExternalID        string  `json:"external_id"`
	BankCode          string  `json:"bank_code"`
	AccountHolderName string  `json:"account_holder_name"`
	AccountNumber     string  `json:"account_number"`
	Description       string  `json:"description"`
	Amount            float64 `json:"amount"`
}

// DisbursementResponse is the response from Xendit's create disbursement endpoint.
type DisbursementResponse struct {
	ID                string    `json:"id"`
	ExternalID        string    `json:"external_id"`
	Status            string    `json:"status"`
	BankCode          string    `json:"bank_code"`
	AccountHolderName string    `json:"account_holder_name"`
	AccountNumber     string    `json:"account_number"`
	Description       string    `json:"description"`
	Amount            float64   `json:"amount"`
	Created           time.Time `json:"created"`
	Updated           time.Time `json:"updated"`
}

// CreateInvoice calls POST https://api.xendit.co/v2/invoices to create a payment invoice.
func (c *Client) CreateInvoice(ctx context.Context, req CreateInvoiceRequest) (*InvoiceResponse, error) {
	var resp InvoiceResponse
	if err := c.do(ctx, http.MethodPost, "/v2/invoices", req, &resp); err != nil {
		return nil, fmt.Errorf("xendit: create invoice: %w", err)
	}
	return &resp, nil
}

// CreateDisbursement calls POST https://api.xendit.co/disbursements to create a bank disbursement.
func (c *Client) CreateDisbursement(ctx context.Context, req DisbursementRequest) (*DisbursementResponse, error) {
	var resp DisbursementResponse
	if err := c.do(ctx, http.MethodPost, "/disbursements", req, &resp); err != nil {
		return nil, fmt.Errorf("xendit: create disbursement: %w", err)
	}
	return &resp, nil
}

// do executes an authenticated HTTP request against the Xendit API.
func (c *Client) do(ctx context.Context, method, path string, body, out any) error {
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("xendit: marshal request: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
	if err != nil {
		return fmt.Errorf("xendit: build request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	// Xendit uses HTTP Basic Auth: apiKey as username, empty password
	req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(c.apiKey+":")))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("xendit: http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("xendit: read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("xendit: api error status=%d body=%s", resp.StatusCode, string(respBody))
	}

	if out != nil {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("xendit: unmarshal response: %w", err)
		}
	}

	return nil
}
