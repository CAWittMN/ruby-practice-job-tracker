class IngestedEmail < ApplicationRecord
  STATUSES = %w[matched unmatched ignored].freeze
  KINDS = %w[application reply other].freeze

  belongs_to :user, optional: true
  belongs_to :job_application, optional: true
  belongs_to :communication, optional: true

  validates :status, inclusion: { in: STATUSES }
  validates :message_id, uniqueness: true, allow_nil: true

  scope :pending, -> { where(status: "unmatched").order(received_at: :desc) }

  def snippet(limit = 280)
    body.to_s.strip.gsub(/\s+/, " ").truncate(limit)
  end
end
