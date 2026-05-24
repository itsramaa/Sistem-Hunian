package rabbitmq

import (
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
)

// New dials the RabbitMQ broker, opens a channel, and returns both the connection and channel.
// Callers are responsible for closing both when done.
func New(url string) (*amqp.Connection, *amqp.Channel, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, nil, fmt.Errorf("rabbitmq: dial: %w", err)
	}
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, nil, fmt.Errorf("rabbitmq: open channel: %w", err)
	}
	return conn, ch, nil
}
