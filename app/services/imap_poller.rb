require "net/imap"
require "mail"

# Connects out to a mailbox over IMAP, ingests unseen messages, and marks them
# read. Designed for locally deployed apps: the app dials out, so no public
# inbound endpoint is required.
class ImapPoller
  class NotConfiguredError < StandardError; end

  def self.config_from_env
    {
      host: ENV["IMAP_HOST"],
      port: (ENV["IMAP_PORT"] || 993).to_i,
      ssl: ENV.fetch("IMAP_SSL", "true") != "false",
      username: ENV["IMAP_USERNAME"],
      password: ENV["IMAP_PASSWORD"],
      mailbox: ENV.fetch("IMAP_MAILBOX", "INBOX")
    }
  end

  def initialize(config: self.class.config_from_env, user: User.first)
    @config = config
    @user = user
  end

  def configured?
    @config[:host].present? && @config[:username].present? && @config[:password].present?
  end

  def poll
    raise NotConfiguredError, "Set IMAP_HOST, IMAP_USERNAME and IMAP_PASSWORD" unless configured?

    imap = Net::IMAP.new(@config[:host], port: @config[:port], ssl: @config[:ssl])
    imap.login(@config[:username], @config[:password])
    imap.select(@config[:mailbox])

    results = []
    imap.search(["UNSEEN"]).each do |seq|
      raw = imap.fetch(seq, "RFC822").first.attr["RFC822"]
      mail = Mail.read_from_string(raw)
      parsed = EmailParser.new(mail).parse
      results << EmailIngestor.new(parsed, user: @user).call
      imap.store(seq, "+FLAGS", [:Seen])
    end

    results
  ensure
    imap&.logout
    imap&.disconnect
  rescue IOError
    # Connection already closed; nothing to clean up.
  end
end
