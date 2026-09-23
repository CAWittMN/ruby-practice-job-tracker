require "net/imap"
require "mail"

# Connects out to a user's configured mailbox over IMAP, ingests new messages,
# and records how far we've read so nothing is processed twice. Designed for
# locally deployed apps: the app dials out, so no public inbound endpoint is
# required.
#
# Tracking uses IMAP UIDs (a stable, monotonically increasing id per mailbox)
# rather than the \Seen flag, so polling never changes the mailbox's read state
# and messages the user reads themselves are left untouched.
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

    baseline = sync_baseline(imap)
    uids = imap.uid_search(["ALL"]).select { |uid| uid > baseline }

    results = []
    highest = baseline
    uids.sort.each do |uid|
      raw = fetch_raw(imap, uid)
      next if raw.blank?

      mail = Mail.read_from_string(raw)
      parsed = EmailParser.new(mail).parse
      results << EmailIngestor.new(parsed, user: @user).call
      highest = uid if uid > highest
    end

    @setting.update_columns(
      last_uid: highest,
      uid_validity: current_uid_validity(imap),
      last_polled_at: Time.current
    )
    results
  rescue IOError
    results || []
  ensure
    imap&.logout
    imap&.disconnect
  end

  # Attempt a login to verify the stored credentials, then disconnect.
  def test_connection
    raise NotConfiguredError, "IMAP is not configured or is disabled" unless configured?

    imap = connect
    imap.select(@setting.mailbox)
    true
  rescue IOError
    true
  ensure
    imap&.logout
    imap&.disconnect
  end

  private

  def connect
    imap = Net::IMAP.new(@setting.imap_host, port: @setting.imap_port, ssl: @setting.imap_ssl)
    imap.login(@setting.imap_username, @setting.imap_password)
    imap
  end

  # Where to resume reading. If the mailbox was recreated (UIDVALIDITY changed)
  # our stored UID no longer points at the same message, so start from the
  # newest message to avoid re-ingesting the entire archive.
  def sync_baseline(imap)
    validity = current_uid_validity(imap)

    if @setting.last_uid.nil? || (@setting.uid_validity.present? && @setting.uid_validity != validity)
      newest_uid(imap)
    else
      @setting.last_uid
    end
  end

  # UID of the most recent message in the mailbox (0 when empty).
  def newest_uid(imap)
    imap.uid_search(["ALL"]).max || 0
  end

  def current_uid_validity(imap)
    Array(imap.responses["UIDVALIDITY"]).last
  end

  # BODY.PEEK avoids setting the \Seen flag, so polling is non-invasive.
  def fetch_raw(imap, uid)
    data = imap.uid_fetch(uid, "BODY.PEEK[]")&.first
    data&.attr&.dig("BODY[]")
  end
end
