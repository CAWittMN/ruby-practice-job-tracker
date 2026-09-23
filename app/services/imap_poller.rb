require "net/imap"
require "mail"

# Connects out to a user's configured mailbox over IMAP, ingests unseen
# messages, and marks them read. Designed for locally deployed apps: the app
# dials out, so no public inbound endpoint is required.
class ImapPoller
  class NotConfiguredError < StandardError; end

  def initialize(user:)
    @user = user
    @setting = user&.email_setting
  end

  def configured?
    @setting&.ready?
  end

  def poll
    raise NotConfiguredError, "IMAP is not configured or is disabled" unless configured?

    imap = connect
    imap.select(@setting.mailbox)

    results = []
    imap.search(["UNSEEN"]).each do |seq|
      raw = imap.fetch(seq, "RFC822").first.attr["RFC822"]
      mail = Mail.read_from_string(raw)
      parsed = EmailParser.new(mail).parse
      results << EmailIngestor.new(parsed, user: @user).call
      imap.store(seq, "+FLAGS", [:Seen])
    end

    @setting.update_column(:last_polled_at, Time.current)
    results
  ensure
    imap&.logout
    imap&.disconnect
  rescue IOError
    # Connection already closed; nothing to clean up.
  end

  # Attempt a login to verify the stored credentials, then disconnect.
  def test_connection
    raise NotConfiguredError, "IMAP is not configured or is disabled" unless configured?

    imap = connect
    imap.select(@setting.mailbox)
    true
  ensure
    imap&.logout
    imap&.disconnect
  rescue IOError
    true
  end

  private

  def connect
    imap = Net::IMAP.new(@setting.imap_host, port: @setting.imap_port, ssl: @setting.imap_ssl)
    imap.login(@setting.imap_username, @setting.imap_password)
    imap
  end
end
