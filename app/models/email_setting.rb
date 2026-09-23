class EmailSetting < ApplicationRecord
  belongs_to :user

  encrypts :imap_password

  normalizes :imap_host, with: ->(v) { v.to_s.strip.presence }
  normalizes :imap_username, with: ->(v) { v.to_s.strip.presence }

  validates :imap_port, numericality: { only_integer: true, greater_than: 0, less_than: 65_536 }
  validates :imap_host, :imap_username, presence: true, if: :enabled?
  validate :password_present_when_enabled

  def mailbox
    imap_mailbox.presence || "INBOX"
  end

  # Enabled and has everything needed to connect.
  def ready?
    enabled? && imap_host.present? && imap_username.present? && imap_password.present?
  end

  private

  def password_present_when_enabled
    return unless enabled?
    return if imap_password.present?

    errors.add(:imap_password, "can't be blank when ingestion is enabled")
  end
end
